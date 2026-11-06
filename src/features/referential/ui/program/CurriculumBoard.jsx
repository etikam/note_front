import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookPlus, FileText, GitCompareArrows, LayoutGrid, Lock, LockOpen, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2, UserX } from 'lucide-react'

import { deleteLevelManage, fetchLevels, postLevelManage } from '@/features/academicYear/api/academicsApi'
import { apiErrorMessage } from '@/features/curriculum/api/curriculaApi'
import { CurriculumDiffDrawer } from '@/features/curriculum/ui/CurriculumDiffDrawer'
import { useReferential } from '@/features/referential/model/ReferentialContext'
import { ChecksList, CurriculumActionDialog, CurriculumStatusPill, SEMESTER_CREDITS } from '@/features/referential/ui/curriculumBits'
import { deleteTeachingUnit, fetchCoursesList, fetchModules, fetchTeachingUnits } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { PedagogyMaquetteSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyMaquetteSection'
import { TeachingUnitCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitCreateModal'
import { TeachingUnitDetailModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitDetailModal'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Dialog } from '@/shared/ui/Dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/Popover'
import { Skeleton } from '@/shared/ui/Skeleton'

function semestersOf(level) {
  if (String(level.cycle).toUpperCase() === 'LICENCE') return [2 * level.number - 1, 2 * level.number]
  return [1, 2]
}

function CreditBar({ value, max }) {
  const ratio = max ? Math.min(1, value / max) : 0
  const tone = value === max ? 'bg-green-500' : value > max ? 'bg-red-500' : 'bg-secondary-500'
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-subtle)]" aria-hidden>
      <span className={cn('block h-full rounded-full transition-[width] duration-500', tone)} style={{ width: `${ratio * 100}%` }} />
    </span>
  )
}

function UnitCard({ unit, courses, editable, onOpen, onEdit, onDelete }) {
  const distributed = courses.reduce((s, c) => s + Number(c.credits || 0), 0)
  const ok = distributed === unit.total_credits
  const unassigned = courses.filter((c) => !c.teacher).length
  return (
    <article
      className={cn(
        'group rounded-xl border bg-[var(--app-elevated)] p-3 shadow-sm transition-all hover:shadow-md',
        ok ? 'border-[var(--app-border)]' : 'border-secondary-400/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="min-w-0 text-left outline-none focus-visible:underline">
          <span className="font-mono text-[11.5px] font-bold text-brand-700 dark:text-brand-300">{unit.code}</span>
          <span className="mt-0.5 block text-[13px] font-semibold leading-snug">{unit.name}</span>
        </button>
        <span className="flex shrink-0 items-center gap-1">
          <span className="rounded-md bg-[var(--app-subtle)] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">{unit.total_credits} cr.</span>
          {editable ? (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label={`Actions ${unit.code}`} className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--app-muted)] hover:bg-[var(--app-subtle)]">
                  <MoreHorizontal size={14} aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1">
                {[
                  [BookPlus, 'Offrir des cours', onOpen],
                  [Pencil, 'Modifier l’UE', onEdit],
                  ...(courses.length ? [] : [[Trash2, 'Supprimer', onDelete]]),
                ].map(([Icon, label, fn]) => (
                  <button key={label} type="button" onClick={fn} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-[var(--app-hover)]">
                    <Icon size={14} aria-hidden /> {label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          ) : null}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <CreditBar value={distributed} max={unit.total_credits} />
        <span className={cn('shrink-0 text-[10.5px] tabular-nums', ok ? 'text-[var(--app-muted)]' : 'font-semibold text-secondary-700 dark:text-secondary-300')}>
          {distributed}/{unit.total_credits}
        </span>
      </div>
      {courses.length ? (
        <ul className="mt-2 space-y-1">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-12 shrink-0 truncate font-mono text-[10.5px] text-[var(--app-muted)]">{c.code}</span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span className="shrink-0 tabular-nums text-[var(--app-muted)]">{c.credits}</span>
              {c.teacher ? (
                <span className="h-4 w-4 shrink-0 rounded-full bg-brand-100 text-center text-[8.5px] font-bold leading-4 text-brand-800 dark:bg-brand-500/20 dark:text-brand-100" title={c.teacher_name}>
                  {(c.teacher_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
              ) : (
                <UserX size={13} className="shrink-0 text-secondary-600" aria-label="Sans enseignant" />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <button type="button" onClick={onOpen} className="mt-2 w-full rounded-lg border border-dashed border-[var(--app-border)] py-1.5 text-[11.5px] text-[var(--app-muted)] hover:border-brand-400 hover:text-brand-700">
          {editable ? '+ Offrir les cours de l’UE' : 'Aucun cours'}
        </button>
      )}
      {unassigned && courses.length ? <p className="mt-1.5 text-[10.5px] text-secondary-700 dark:text-secondary-300">{unassigned} sans enseignant</p> : null}
    </article>
  )
}

function SemesterColumn({ title, units, coursesByUnit, editable, onAdd, renderCard }) {
  const credits = units.reduce((s, u) => s + u.total_credits, 0)
  const ok = credits === SEMESTER_CREDITS
  return (
    <section className="flex min-w-[15rem] flex-1 flex-col rounded-2xl bg-[var(--app-subtle)]/60 p-2.5">
      <header className="mb-2 flex items-center justify-between px-1">
        <h4 className="text-[12.5px] font-semibold">{title}</h4>
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums', ok ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-200' : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-500/15 dark:text-secondary-200')}>
          {credits}/{SEMESTER_CREDITS} cr.
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {units.map((u) => renderCard(u, coursesByUnit.get(u.id) ?? []))}
        {editable ? (
          <button type="button" onClick={onAdd} className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--app-border-strong)] py-2 text-[12px] text-[var(--app-muted)] transition-colors hover:border-brand-400 hover:bg-[var(--app-elevated)] hover:text-brand-700 dark:hover:text-brand-200">
            <Plus size={13} aria-hidden /> UE
          </button>
        ) : null}
      </div>
    </section>
  )
}

function LevelDialog({ open, program, onClose, onCreated }) {
  const [cycle, setCycle] = useState('LICENCE')
  const [number, setNumber] = useState('1')
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Nouveau niveau"
      description={`Niveau ouvert dans ${program.code} pour l’année.`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await postLevelManage({ program: program.id, cycle, number: Number(number) })
                dispatchToast({ type: 'success', message: 'Niveau ajouté.' })
                onCreated()
              } catch (err) {
                dispatchToast({ type: 'error', message: apiErrorMessage(err) })
              } finally {
                setBusy(false)
              }
            }}
          >
            Ajouter
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[12.5px] font-medium">
          Cycle
          <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2 text-[13px]">
            <option value="LICENCE">Licence</option>
            <option value="MASTER">Master</option>
            <option value="DOCTORAT">Doctorat</option>
          </select>
        </label>
        <label className="text-[12.5px] font-medium">
          Année du cycle
          <input type="number" min={1} max={8} value={number} onChange={(e) => setNumber(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2 text-[13px]" />
        </label>
      </div>
    </Dialog>
  )
}

/** Maquette d'un programme en tableau de parcours : une colonne par semestre, regroupées par niveau. */
export function CurriculumBoard({ program }) {
  const ref = useReferential()
  const curriculum = program.curriculum
  const locked = curriculum?.status === 'validated'
  const canEdit = Boolean(curriculum?.can?.manage) && !locked
  const [data, setData] = useState(null)
  const [view, setView] = useState('board')
  const [create, setCreate] = useState(null)
  const [edit, setEdit] = useState(null)
  const [detail, setDetail] = useState(null)
  const [remove, setRemove] = useState(null)
  const [levelOpen, setLevelOpen] = useState(false)
  const [pending, setPending] = useState(null)
  const [diff, setDiff] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    const [units, levels, courses, modules] = await Promise.all([
      fetchTeachingUnits({ program: program.id, offer_year: ref.yearId }),
      fetchLevels({ program: program.id }),
      fetchCoursesList({ program_id: program.id, academic_year_id: ref.yearId, page_size: 1000 }),
      ref.yearId ? fetchModules(ref.yearId) : Promise.resolve([]),
    ])
    setData({ units, levels, courses: courses.results, modules })
  }, [program.id, ref.yearId])

  useEffect(() => {
    load().catch((err) => dispatchToast({ type: 'error', message: apiErrorMessage(err) }))
  }, [load])

  const refresh = async () => {
    await Promise.all([load(), ref.reload({ silent: true })])
    setReloadKey((k) => k + 1)
  }

  const coursesByUnit = useMemo(() => {
    const m = new Map()
    for (const c of data?.courses ?? []) {
      if (!m.has(c.teaching_unit)) m.set(c.teaching_unit, [])
      m.get(c.teaching_unit).push(c)
    }
    return m
  }, [data])

  if (!data) return <div className="grid gap-3 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>

  const levels = [...data.levels].sort((a, b) => String(a.cycle).localeCompare(String(b.cycle)) || a.number - b.number)
  const unplaced = data.units.filter((u) => !u.level || !u.semester)
  const card = (u, courses) => (
    <UnitCard
      key={u.id}
      unit={u}
      courses={courses}
      editable={canEdit}
      onOpen={() => setDetail(u)}
      onEdit={() => setEdit(u)}
      onDelete={() => setRemove(u)}
    />
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <CurriculumStatusPill curriculum={curriculum} />
          {curriculum ? (
            <span className="text-[12px] text-[var(--app-muted)]">
              {curriculum.units} UE · {curriculum.courses} cours · {curriculum.credits} crédits
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-[var(--app-subtle)] p-0.5" role="tablist" aria-label="Affichage de la maquette">
            {[['board', LayoutGrid, 'Parcours'], ['document', FileText, 'Document']].map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium', view === id ? 'bg-[var(--app-elevated)] shadow-sm' : 'text-[var(--app-muted)]')}
              >
                <Icon size={13} aria-hidden /> {label}
              </button>
            ))}
          </div>
          {ref.previousYear ? (
            <Button size="sm" variant="ghost" onClick={() => setDiff(true)}>
              <GitCompareArrows size={14} aria-hidden /> vs {ref.previousYear.label}
            </Button>
          ) : null}
          {canEdit ? (
            <Button size="sm" variant="ghost" onClick={() => setLevelOpen(true)}><Plus size={14} aria-hidden /> Niveau</Button>
          ) : null}
          {curriculum?.can?.validate ? (
            locked ? (
              <Button size="sm" variant="ghost" onClick={() => setPending({ program, action: 'reopen' })}><LockOpen size={14} aria-hidden /> Rouvrir</Button>
            ) : (
              <Button size="sm" disabled={curriculum.errors > 0} title={curriculum.errors ? 'Corrigez d’abord les erreurs.' : undefined} onClick={() => setPending({ program, action: 'validate' })}>
                <ShieldCheck size={14} aria-hidden /> Valider la maquette
              </Button>
            )
          ) : null}
        </div>
      </div>

      {locked ? (
        <p className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-[12.5px] text-green-900 dark:bg-green-500/10 dark:text-green-100">
          <Lock size={14} aria-hidden /> Maquette validée et verrouillée{curriculum.validated_by ? ` par ${curriculum.validated_by}` : ''}. L’affectation des enseignants reste possible.
        </p>
      ) : curriculum?.checks?.length ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-3"><ChecksList checks={curriculum.checks} /></div>
      ) : null}

      {view === 'document' ? (
        <PedagogyMaquetteSection
          key={`doc-${reloadKey}`}
          yearFocusId={ref.yearId ? Number(ref.yearId) : null}
          yearFocusLabel={ref.yearLabel}
          canStructure={canEdit}
          unitsForOfferSelect={data.units}
          reloadKey={reloadKey}
          onCreateTeachingUnit={() => setCreate({})}
          onOpenTeachingUnit={(unit) => setDetail(unit)}
        />
      ) : !levels.length ? (
        <EmptyState
          title="Aucun niveau"
          description="Ouvrez d’abord les niveaux du programme (Licence 1, 2, 3…) : la maquette s’organise par niveau et par semestre."
          action={canEdit ? <Button onClick={() => setLevelOpen(true)}><Plus size={15} aria-hidden /> Ajouter un niveau</Button> : null}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {levels.map((level) => (
            <section key={level.id}>
              <h3 className="mb-2 flex items-center gap-2 font-heading text-[14.5px] font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-bold text-white dark:bg-brand-500">
                  {String(level.cycle)[0]}{level.number}
                </span>
                {level.name}
                {canEdit && !data.units.some((u) => u.level === level.id) ? (
                  <button
                    type="button"
                    aria-label={`Retirer le niveau ${level.name}`}
                    title="Retirer ce niveau (aucune UE)"
                    onClick={async () => {
                      try {
                        await deleteLevelManage(level.id)
                        dispatchToast({ type: 'success', message: `${level.name} retiré.` })
                        await refresh()
                      } catch (err) {
                        dispatchToast({ type: 'error', message: apiErrorMessage(err) })
                      }
                    }}
                    className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-[var(--app-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                ) : null}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {semestersOf(level).map((sem) => (
                  <SemesterColumn
                    key={sem}
                    title={`Semestre ${sem}`}
                    units={data.units.filter((u) => u.level === level.id && u.semester === sem)}
                    coursesByUnit={coursesByUnit}
                    editable={canEdit}
                    onAdd={() => setCreate({ level: level.id, semester: sem })}
                    renderCard={card}
                  />
                ))}
              </div>
            </section>
          ))}
          {unplaced.length ? (
            <section>
              <h3 className="mb-2 font-heading text-[14.5px] font-semibold text-secondary-800 dark:text-secondary-200">À placer dans le parcours</h3>
              <p className="mb-2 text-[12px] text-[var(--app-muted)]">Ces UE n’ont pas de niveau ou de semestre : modifiez-les pour les situer.</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{unplaced.map((u) => card(u, coursesByUnit.get(u.id) ?? []))}</div>
            </section>
          ) : null}
        </div>
      )}

      <TeachingUnitCreateModal
        open={create != null}
        onClose={() => setCreate(null)}
        onCreated={refresh}
        defaults={{ program: program.id, ...(create ?? {}) }}
        lockProgram
      />
      <TeachingUnitCreateModal open={edit != null} onClose={() => setEdit(null)} mode="edit" unit={edit} onCreated={refresh} lockProgram />
      <TeachingUnitDetailModal
        open={detail != null}
        onClose={() => setDetail(null)}
        unit={detail}
        tier={detail && coursesByUnit.get(detail.id)?.length ? 'offered' : 'catalog'}
        academicYearId={ref.yearId ? Number(ref.yearId) : null}
        canStructure={canEdit}
        modules={data.modules}
        unitsForOfferSelect={data.units}
        onOfferSaved={refresh}
      />
      <ConfirmModal
        open={remove != null}
        onClose={() => setRemove(null)}
        title={`Supprimer l’UE ${remove?.code ?? ''} ?`}
        message="L’UE est retirée de la maquette de cette année."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          try {
            await deleteTeachingUnit(remove.id)
            dispatchToast({ type: 'success', message: 'UE supprimée.' })
            await refresh()
          } catch (err) {
            dispatchToast({ type: 'error', message: apiErrorMessage(err) })
            throw err
          }
        }}
      />
      <LevelDialog open={levelOpen} program={program} onClose={() => setLevelOpen(false)} onCreated={() => { setLevelOpen(false); void refresh() }} />
      <CurriculumActionDialog pending={pending} onClose={() => setPending(null)} onDone={() => { setPending(null); void refresh() }} />
      <CurriculumDiffDrawer open={diff} onClose={() => setDiff(false)} programIdentity={program.identity} />
    </div>
  )
}
