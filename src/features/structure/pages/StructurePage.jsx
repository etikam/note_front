import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react'

import { apiErrorMessage, fetchRoles, fetchStructureTree } from '@/features/access/api/accessApi'
import { useAccess } from '@/features/access/model/useAccess'
import { entityKey, entityLabel, indexStructure } from '@/features/admin/model/structureIndex'
import { MandateDrawer } from '@/features/admin/ui/MandateDrawer'
import { NominationDrawer } from '@/features/admin/ui/NominationDrawer'
import { EntityMandates } from '@/features/admin/ui/StructureMandates'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAuth } from '@/features/auth/model/AuthContext'
import { deleteDepartment, deleteProgram } from '@/features/structure/api/structureApi'
import { EntityFormDialog } from '@/features/structure/ui/EntityFormDialog'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { DataTable } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton, SkeletonLines } from '@/shared/ui/Skeleton'
import { StatTile } from '@/shared/ui/StatTile'
import { StatusPill } from '@/shared/ui/StatusPill'

function normalize(text) {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

/* ------------------------------------------------------------------ Explorateur */

function TreeRow({ active, depth = 0, icon: Icon, code, label, meta, onSelect, expanded, onToggle }) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-lg pr-2 text-[13px] transition-colors',
        active ? 'bg-brand-50 text-brand-900 dark:bg-white/[0.07] dark:text-white' : 'text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)]',
      )}
      style={{ paddingLeft: depth * 16 }}
    >
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-6 shrink-0 items-center justify-center text-[var(--app-muted)] hover:text-[var(--app-fg)]"
          aria-label={expanded ? 'Replier' : 'Déplier'}
          aria-expanded={expanded}
        >
          <ChevronRight size={14} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>
      ) : (
        <span className="w-6 shrink-0" />
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left outline-none focus-visible:underline"
      >
        <Icon size={14} className={cn('shrink-0', active ? 'text-brand-600 dark:text-brand-300' : 'text-[var(--app-muted)]')} aria-hidden />
        <span className="shrink-0 font-mono text-[11px] font-semibold">{code}</span>
        <span className="min-w-0 truncate">{label !== code ? label : ''}</span>
      </button>
      {meta != null ? <span className="shrink-0 text-[11px] tabular-nums text-[var(--app-muted)]">{meta}</span> : null}
    </div>
  )
}

function Explorer({ tree, selectedKey, onSelect, query, setQuery }) {
  const [collapsed, setCollapsed] = useState(() => new Set())
  const q = normalize(query.trim())
  const hit = (e) => !q || normalize(`${e.code} ${e.name}`).includes(q)

  return (
    <SectionCard flush className="lg:sticky lg:top-20">
      <div className="border-b border-[var(--app-border)] p-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Filtrer la structure" />
      </div>
      <nav aria-label="Structure académique" className="max-h-[calc(100vh-14rem)] overflow-y-auto p-2">
        {tree.faculties.map((f) => {
          const departments = f.departments.filter((d) => hit(d) || d.programs.some(hit))
          if (!departments.length) return null
          return (
            <div key={f.id} className="mb-2">
              <p className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">{f.name}</p>
              {departments.map((d) => {
                const key = entityKey('department', d.id)
                const programs = hit(d) ? d.programs : d.programs.filter(hit)
                const expanded = Boolean(q) || !collapsed.has(d.id)
                return (
                  <div key={d.id}>
                    <TreeRow
                      icon={Building2}
                      code={d.code}
                      label={d.name}
                      meta={d.counts.students || null}
                      active={selectedKey === key}
                      onSelect={() => onSelect(key)}
                      expanded={expanded}
                      onToggle={
                        programs.length
                          ? () =>
                              setCollapsed((s) => {
                                const next = new Set(s)
                                if (next.has(d.id)) next.delete(d.id)
                                else next.add(d.id)
                                return next
                              })
                          : null
                      }
                    />
                    {expanded
                      ? programs.map((p) => (
                          <TreeRow
                            key={p.id}
                            depth={1}
                            icon={GraduationCap}
                            code={p.code}
                            label={p.name}
                            meta={p.counts.students || null}
                            active={selectedKey === entityKey('program', p.id)}
                            onSelect={() => onSelect(entityKey('program', p.id))}
                          />
                        ))
                      : null}
                  </div>
                )
              })}
            </div>
          )
        })}
      </nav>
    </SectionCard>
  )
}

/* ------------------------------------------------------------------ Détail */

function EntityHeader({ eyebrow, entity, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium text-[var(--app-muted)]">{eyebrow}</p>
        <h2 className="mt-1 flex flex-wrap items-center gap-2.5 font-heading text-[20px] font-semibold tracking-tight text-[var(--app-fg)]">
          <span className="rounded-md bg-[var(--app-subtle)] px-2 py-0.5 font-mono text-[13px] font-semibold text-[var(--app-fg-soft)] ring-1 ring-[var(--app-border)]">
            {entity.code}
          </span>
          {entity.name}
        </h2>
        {entity.description ? <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--app-fg-soft)]">{entity.description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

function Alert({ children, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <span className="flex items-center gap-2">
        <AlertTriangle size={15} className="shrink-0" aria-hidden />
        {children}
      </span>
      {action}
    </div>
  )
}

function Shortcut({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
        <Icon size={17} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[13px] font-semibold text-[var(--app-fg)]">
          {title}
          <ArrowRight size={13} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </span>
        <span className="mt-0.5 block text-[12px] text-[var(--app-muted)]">{description}</span>
      </span>
    </Link>
  )
}

function Tiles({ counts, yearLabel }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <StatTile icon={Users} tone="brand" label="Étudiants" value={counts.students} />
      <StatTile icon={Layers} label="Niveaux" value={counts.levels} />
      <StatTile icon={BookOpen} label="Cours" value={counts.courses} hint={yearLabel || null} />
      <StatTile
        icon={ClipboardList}
        tone={counts.unassigned_courses ? 'warning' : 'success'}
        label="Sans enseignant"
        value={counts.unassigned_courses}
      />
      <StatTile icon={UsersRound} label="Enseignants" value={counts.teachers} hint="intervenant dans les cours" />
    </div>
  )
}

function MandatesCard({ entity, roles, onOpen, onNominate, title }) {
  return (
    <SectionCard
      title={title}
      actions={
        entity.can?.assign_roles && onNominate ? (
          <Button size="sm" variant="ghost" onClick={() => onNominate({ level: entity.level, entityId: entity.id })}>
            <UserPlus size={14} aria-hidden /> Nommer
          </Button>
        ) : null
      }
    >
      <EntityMandates entity={entity} roles={roles} onOpen={onOpen} onNominate={onNominate} emptyLabel="Aucun responsable nommé." />
    </SectionCard>
  )
}

function DepartmentDetail({ dept, roles, yearLabel, onSelect, onOpen, onNominate, onEdit, onAddProgram, onDelete }) {
  const programs = dept.programs.map((p) => ({ ...p, level: 'program' }))
  const columns = [
    {
      key: 'code',
      header: 'Programme',
      sortValue: (p) => p.code,
      cell: (p) => (
        <span className="flex flex-col">
          <span className="font-mono text-[12px] font-semibold text-[var(--app-fg)]">{p.code}</span>
          {p.name !== p.code ? <span className="truncate text-[12px] text-[var(--app-muted)]">{p.name}</span> : null}
        </span>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      sortValue: (p) => p.holders[0]?.teacher_name ?? '',
      cell: (p) =>
        p.holders.length ? (
          <span className="truncate">{p.holders.map((h) => h.teacher_name).join(', ')}</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-300">Vacant</span>
        ),
    },
    { key: 'students', header: 'Étudiants', align: 'right', sortValue: (p) => p.counts.students, cell: (p) => p.counts.students },
    { key: 'levels', header: 'Niveaux', align: 'right', sortValue: (p) => p.counts.levels, cell: (p) => p.counts.levels },
    { key: 'courses', header: 'Cours', align: 'right', sortValue: (p) => p.counts.courses, cell: (p) => p.counts.courses },
    {
      key: 'unassigned',
      header: 'Sans ens.',
      align: 'right',
      sortValue: (p) => p.counts.unassigned_courses,
      cell: (p) => (
        <span className={p.counts.unassigned_courses ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-[var(--app-muted)]'}>
          {p.counts.unassigned_courses}
        </span>
      ),
    },
  ]
  const canManage = dept.can?.manage_structure

  return (
    <div className="flex flex-col gap-5">
      <EntityHeader
        eyebrow={`Département · ${dept.faculty.name}`}
        entity={dept}
        actions={
          canManage ? (
            <>
              <Button variant="ghost" onClick={onEdit}>
                <Pencil size={14} aria-hidden /> Modifier
              </Button>
              <Button onClick={onAddProgram}>
                <Plus size={15} aria-hidden /> Nouveau programme
              </Button>
            </>
          ) : null
        }
      />
      <Tiles counts={dept.counts} yearLabel={yearLabel} />
      <MandatesCard title="Responsables du département" entity={dept} roles={roles} onOpen={onOpen} onNominate={onNominate} />
      <SectionCard title="Programmes" description={plural(programs.length, 'programme')} flush>
        <DataTable
          columns={columns}
          rows={programs}
          onRowClick={(p) => onSelect(entityKey('program', p.id))}
          initialSort={{ key: 'code', dir: 'asc' }}
          empty={{
            title: 'Aucun programme',
            description: 'Créez un programme pour y rattacher niveaux, maquette et étudiants.',
            action: canManage ? (
              <Button size="sm" onClick={onAddProgram}>
                <Plus size={14} aria-hidden /> Nouveau programme
              </Button>
            ) : null,
          }}
        />
      </SectionCard>
      {canManage && !programs.length ? (
        <div className="flex justify-end">
          <Button variant="ghost" className="text-red-700 dark:text-red-300" onClick={onDelete}>
            <Trash2 size={14} aria-hidden /> Supprimer le département
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ProgramDetail({ program, roles, yearLabel, access, onOpen, onNominate, onEdit, onDelete }) {
  const covers = (perm) => access.covers(perm, { programId: program.id, departmentId: program.department.id })
  const vacantDirection = !program.holders.length
  const { counts } = program
  const empty = !counts.levels && !counts.courses && !counts.students

  return (
    <div className="flex flex-col gap-5">
      <EntityHeader
        eyebrow={`Programme · ${entityLabel({ ...program.department, level: 'department' })}`}
        entity={program}
        actions={
          program.can?.manage_structure ? (
            <Button variant="ghost" onClick={onEdit}>
              <Pencil size={14} aria-hidden /> Modifier
            </Button>
          ) : null
        }
      />
      {counts.unassigned_courses ? (
        <Alert
          action={
            covers('courses.assign') ? (
              <Button as={Link} size="sm" variant="ghost" to={`/teacher/faculty/course-assignments?program=${program.id}`}>
                Affecter
              </Button>
            ) : null
          }
        >
          {plural(counts.unassigned_courses, 'cours', 'cours')} sans enseignant{yearLabel ? ` en ${yearLabel}` : ''}.
        </Alert>
      ) : null}
      {vacantDirection && program.can?.assign_roles && onNominate ? (
        <Alert
          action={
            <Button size="sm" variant="ghost" onClick={() => onNominate({ level: 'program', entityId: program.id })}>
              Nommer
            </Button>
          }
        >
          Aucun responsable nommé sur ce programme.
        </Alert>
      ) : null}
      <Tiles counts={counts} yearLabel={yearLabel} />
      <MandatesCard title="Direction du programme" entity={program} roles={roles} onOpen={onOpen} onNominate={onNominate} />
      <div className="grid gap-3 md:grid-cols-2">
        {covers('curriculum.manage') ? (
          <Shortcut
            to={`/teacher/academie?tab=maquette&program=${program.id}`}
            icon={Layers}
            title="Maquette & cours"
            description="Niveaux, UE, cours et crédits du cursus."
          />
        ) : null}
        {covers('students.view') ? (
          <Shortcut
            to={`/teacher/students/list?program=${program.id}`}
            icon={Users}
            title="Étudiants"
            description={`${plural(counts.students, 'étudiant')} inscrit${counts.students > 1 ? 's' : ''} dans ce programme.`}
          />
        ) : null}
        {covers('courses.assign') ? (
          <Shortcut
            to={`/teacher/faculty/course-assignments?program=${program.id}`}
            icon={ClipboardList}
            title="Affectations des cours"
            description="Qui enseigne quoi cette année."
          />
        ) : null}
        {covers('reports.view') ? (
          <Shortcut to="/teacher/reports" icon={BookOpen} title="Rapports" description="Procès-verbaux et rapports de pilotage par niveau." />
        ) : null}
      </div>
      {program.can?.manage_structure && empty ? (
        <div className="flex justify-end">
          <Button variant="ghost" className="text-red-700 dark:text-red-300" onClick={onDelete}>
            <Trash2 size={14} aria-hidden /> Supprimer le programme
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ Page */

export default function StructurePage() {
  const access = useAccess()
  const { refreshMe } = useAuth()
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [params, setParams] = useSearchParams()
  const [tree, setTree] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [wizard, setWizard] = useState(null)
  const [openMandate, setOpenMandate] = useState(null)
  const canAssign = access.canManage('access.assign_roles')

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true)
      setError('')
      try {
        const [t, r] = await Promise.all([fetchStructureTree(), canAssign ? fetchRoles() : Promise.resolve([])])
        setTree(t)
        setRoles(r)
      } catch (err) {
        setError(apiErrorMessage(err, 'Impossible de charger la structure.'))
      } finally {
        setLoading(false)
      }
    },
    [canAssign],
  )

  useEffect(() => {
    void load()
  }, [load, academicYearId])

  const index = useMemo(() => indexStructure(tree), [tree])
  const selectedKey = params.get('node')
  // Un directeur de programme arrive sur son programme ; les autres sur le premier département.
  const programOnly = access.mandates.length > 0 && access.mandates.every((m) => m.scope_level === 'program')
  const selected =
    (selectedKey && index.byKey.get(selectedKey)) ||
    (programOnly && index.programs.length === 1 ? index.programs[0] : index.departments[0]) ||
    null

  const select = useCallback((key) => setParams({ node: key }, { replace: true }), [setParams])

  const facultyParents = useMemo(() => index.faculties.filter((f) => f.can?.manage_structure), [index])
  const departmentParents = useMemo(() => index.departments.filter((d) => d.can?.manage_structure), [index])

  const afterSave = (kind) => async (saved) => {
    dispatchToast({ type: 'success', message: `${kind === 'program' ? 'Programme' : 'Département'} « ${saved.code} » enregistré.` })
    await load({ silent: true })
    select(entityKey(kind, saved.id))
  }

  async function runDelete() {
    const { kind, entity } = confirm
    try {
      if (kind === 'program') await deleteProgram(entity.id)
      else await deleteDepartment(entity.id)
      dispatchToast({ type: 'success', message: `« ${entity.code} » supprimé.` })
      setParams({}, { replace: true })
      await load({ silent: true })
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err, 'Suppression impossible.') })
      throw err
    }
  }

  const refreshMandates = async () => {
    await load({ silent: true })
    await refreshMe()
  }

  const nominate = canAssign ? setWizard : null
  const openHolder = canAssign ? setOpenMandate : null

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Pédagogie' }, { label: 'Structure' }]}
        title="Structure académique"
        description="Départements et programmes de votre périmètre : responsables, effectifs et points d’attention de l’année."
        meta={academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
        actions={
          facultyParents.length ? (
            <Button onClick={() => setForm({ kind: 'department', entity: null })}>
              <Plus size={15} aria-hidden /> Nouveau département
            </Button>
          ) : null
        }
      />

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} onRetry={load} />
        </SectionCard>
      ) : loading ? (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <SectionCard>
            <div className="space-y-2">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </SectionCard>
          <SectionCard>
            <SkeletonLines lines={8} />
          </SectionCard>
        </div>
      ) : !tree?.faculties.length || !selected ? (
        <SectionCard>
          <EmptyState
            icon={Building2}
            title="Aucune entité dans votre périmètre"
            description="Les départements et programmes dont vous avez la charge apparaîtront ici."
          />
        </SectionCard>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Explorer tree={tree} selectedKey={entityKey(selected.level, selected.id)} onSelect={select} query={query} setQuery={setQuery} />
          <div key={entityKey(selected.level, selected.id)} className="ds-fade-in min-w-0">
            {selected.level === 'program' ? (
              <ProgramDetail
                program={selected}
                roles={roles}
                yearLabel={academicYearLabel}
                access={access}
                onOpen={openHolder}
                onNominate={nominate}
                onEdit={() => setForm({ kind: 'program', entity: selected })}
                onDelete={() => setConfirm({ kind: 'program', entity: selected })}
              />
            ) : selected.level === 'department' ? (
              <DepartmentDetail
                dept={selected}
                roles={roles}
                yearLabel={academicYearLabel}
                onSelect={select}
                onOpen={openHolder}
                onNominate={nominate}
                onEdit={() => setForm({ kind: 'department', entity: selected })}
                onAddProgram={() => setForm({ kind: 'program', entity: null, parentId: selected.id })}
                onDelete={() => setConfirm({ kind: 'department', entity: selected })}
              />
            ) : (
              <SectionCard>
                <EmptyState title="Sélectionnez un département ou un programme" />
              </SectionCard>
            )}
          </div>
        </div>
      )}

      <EntityFormDialog
        kind="department"
        open={form?.kind === 'department'}
        onClose={() => setForm(null)}
        entity={form?.kind === 'department' ? form.entity : null}
        parents={facultyParents}
        onSaved={afterSave('department')}
      />
      <EntityFormDialog
        kind="program"
        open={form?.kind === 'program'}
        onClose={() => setForm(null)}
        entity={form?.kind === 'program' ? form.entity : null}
        parents={departmentParents}
        defaultParentId={form?.parentId ?? null}
        onSaved={afterSave('program')}
      />
      <ConfirmModal
        open={confirm != null}
        onClose={() => setConfirm(null)}
        title={`Supprimer « ${confirm?.entity.code ?? ''} » ?`}
        message="Cette action est définitive. Elle n’est possible que si rien n’y est encore rattaché."
        confirmLabel="Supprimer"
        onConfirm={runDelete}
      />
      {canAssign ? (
        <>
          <NominationDrawer
            open={wizard != null}
            onClose={() => setWizard(null)}
            roles={roles}
            index={index}
            preset={wizard}
            onDone={(m) => {
              dispatchToast({ type: 'success', message: `${m.teacher_name} nommé·e ${m.role_name}.` })
              void refreshMandates()
            }}
          />
          <MandateDrawer assignmentId={openMandate} onClose={() => setOpenMandate(null)} onChanged={() => void refreshMandates()} />
        </>
      ) : null}
    </div>
  )
}
