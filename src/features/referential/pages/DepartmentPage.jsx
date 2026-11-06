import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Building2, Pencil, Plus, Trash2, UserRound } from 'lucide-react'

import { refPaths, useReferential } from '@/features/referential/model/ReferentialContext'
import { CurriculumStatusPill, plural } from '@/features/referential/ui/curriculumBits'
import { MandatesCard } from '@/features/referential/ui/MandateTools'
import { NotInYear } from '@/features/referential/ui/NotInYear'
import { deleteDepartment } from '@/features/structure/api/structureApi'
import { EntityFormDialog } from '@/features/structure/ui/EntityFormDialog'
import { apiErrorMessage } from '@/features/access/api/accessApi'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'

/** Niveaux d'un programme : pastilles L1 L2 L3… avec l'état de leurs semestres. */
function LevelPills({ program }) {
  const levels = useMemo(() => {
    const out = new Map()
    for (const s of program.curriculum?.semesters ?? []) {
      const prev = out.get(s.level_name) ?? { name: s.level_name, ok: true }
      out.set(s.level_name, { ...prev, ok: prev.ok && s.credits === 30 })
    }
    return [...out.values()]
  }, [program])
  if (!levels.length) return <span className="text-[11.5px] text-[var(--app-muted)]">{plural(program.counts.levels, 'niveau')}</span>
  return (
    <span className="flex flex-wrap gap-1">
      {levels.map((l) => (
        <span
          key={l.name}
          title={l.ok ? `${l.name} : 30 crédits par semestre` : `${l.name} : crédits à vérifier`}
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
            l.ok ? 'bg-brand-50 text-brand-800 ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-200' : 'bg-secondary-50 text-secondary-800 ring-secondary-600/20 dark:bg-secondary-500/10 dark:text-secondary-200',
          )}
        >
          {l.name.replace(/^Licence\s*/i, 'L').replace(/^Master\s*/i, 'M')}
        </span>
      ))}
    </span>
  )
}

function ProgramCard({ program }) {
  const c = program.curriculum
  return (
    <Link
      to={refPaths.program(program)}
      className="group relative flex flex-col rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 transition-all hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md bg-[var(--app-subtle)] px-2 py-0.5 font-mono text-[12px] font-bold ring-1 ring-inset ring-[var(--app-border)]">{program.code}</span>
        <CurriculumStatusPill curriculum={c} />
      </div>
      <h3 className="mt-2.5 font-heading text-[16px] font-semibold leading-snug">{program.name}</h3>
      <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[var(--app-fg-soft)]">
        <UserRound size={14} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
        <span className="text-[var(--app-muted)]">Direction :</span>
        {program.holders?.length ? (
          <span className="truncate">{program.holders.map((h) => h.teacher_name).join(', ')}</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-300">vacante</span>
        )}
      </p>
      <div className="mt-3"><LevelPills program={program} /></div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--app-border)] pt-3 text-center">
        {[
          ['Étudiants', program.counts.students],
          ['UE', c?.units ?? '—'],
          ['Cours', program.counts.courses],
        ].map(([label, v]) => (
          <div key={label}>
            <dd className="font-heading text-[17px] font-semibold tabular-nums">{v}</dd>
            <dt className="text-[10.5px] uppercase tracking-wider text-[var(--app-muted)]">{label}</dt>
          </div>
        ))}
      </dl>
      {c?.errors || program.counts.unassigned_courses ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-secondary-800 dark:text-secondary-200">
          <AlertTriangle size={13} aria-hidden />
          {[
            c?.errors ? plural(c.errors, 'erreur') + ' de maquette' : null,
            program.counts.unassigned_courses ? plural(program.counts.unassigned_courses, 'cours', 'cours') + ' sans enseignant' : null,
          ].filter(Boolean).join(' · ')}
        </p>
      ) : null}
      <ArrowUpRight size={16} className="absolute bottom-4 right-4 text-[var(--app-muted)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </Link>
  )
}

/** Niveau département : responsables, chiffres et programmes de l'année. */
export default function DepartmentPage() {
  const { identity } = useParams()
  const ref = useReferential()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const dept = ref.departmentByIdentity.get(identity)
  if (!dept) return <NotInYear kind="department" />
  if (!dept.can) return <Navigate to={refPaths.home} replace />

  const canManage = dept.can.manage_structure
  const { counts } = dept

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25">
              <Building2 size={24} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">Département · {ref.yearLabel}</p>
              <h1 className="mt-1 font-heading text-[24px] font-semibold leading-tight tracking-tight">
                <span className="mr-2 font-mono text-[18px] text-brand-700 dark:text-brand-300">{dept.code}</span>
                {dept.name}
              </h1>
              {dept.description ? <p className="mt-1.5 max-w-2xl text-[13px] text-[var(--app-fg-soft)]">{dept.description}</p> : null}
            </div>
          </div>
          {canManage ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setForm({ kind: 'department' })}><Pencil size={14} aria-hidden /> Modifier</Button>
              <Button onClick={() => setForm({ kind: 'program' })}><Plus size={15} aria-hidden /> Nouveau programme</Button>
            </div>
          ) : null}
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--app-border)] pt-5 sm:grid-cols-5">
          {[
            ['Programmes', dept.programs.length],
            ['Étudiants', counts.students],
            ['Cours', counts.courses],
            ['Enseignants', counts.teachers],
            ['Sans enseignant', counts.unassigned_courses],
          ].map(([label, v], i) => (
            <div key={label}>
              <dd className={cn('font-heading text-[22px] font-semibold tabular-nums', i === 4 && v ? 'text-secondary-700 dark:text-secondary-300' : '')}>{v}</dd>
              <dt className="text-[11.5px] text-[var(--app-muted)]">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <h2 className="mb-3 font-heading text-[16px] font-semibold">Programmes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {dept.programs.map((p) => <ProgramCard key={p.id} program={p} />)}
            {canManage ? (
              <button
                type="button"
                onClick={() => setForm({ kind: 'program' })}
                className="flex min-h-[13rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--app-border)] text-[var(--app-muted)] transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700 dark:hover:bg-brand-500/5 dark:hover:text-brand-200"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-subtle)]"><Plus size={20} aria-hidden /></span>
                <span className="text-[13px] font-semibold">Nouveau programme</span>
                <span className="text-[11.5px]">dans {dept.code}, pour {ref.yearLabel}</span>
              </button>
            ) : null}
          </div>
          {canManage && !dept.programs.length ? (
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" className="text-red-700 dark:text-red-300" onClick={() => setConfirm(true)}>
                <Trash2 size={14} aria-hidden /> Supprimer le département
              </Button>
            </div>
          ) : null}
        </section>
        <MandatesCard entity={dept} title="Responsables du département" />
      </div>

      <EntityFormDialog
        kind="department"
        open={form?.kind === 'department'}
        onClose={() => setForm(null)}
        entity={dept}
        parents={ref.faculties.filter((f) => f.can?.manage_structure)}
        onSaved={async (saved) => {
          dispatchToast({ type: 'success', message: `Département « ${saved.code} » enregistré.` })
          await ref.reload({ silent: true })
        }}
      />
      <EntityFormDialog
        kind="program"
        open={form?.kind === 'program'}
        onClose={() => setForm(null)}
        entity={null}
        parents={ref.departments.filter((d) => d.can?.manage_structure)}
        defaultParentId={dept.id}
        onSaved={async (saved) => {
          dispatchToast({ type: 'success', message: `Programme « ${saved.code} » créé : préparez sa maquette.` })
          await ref.reload({ silent: true })
          if (saved.identity) navigate(refPaths.program({ identity: saved.identity }, 'maquette'))
        }}
      />
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Supprimer « ${dept.code} » ?`}
        message="Le département est retiré de cette année seulement. Les années précédentes ne changent pas."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          try {
            await deleteDepartment(dept.id)
            dispatchToast({ type: 'success', message: `« ${dept.code} » retiré de ${ref.yearLabel}.` })
            navigate(refPaths.home)
            await ref.reload({ silent: true })
          } catch (err) {
            dispatchToast({ type: 'error', message: apiErrorMessage(err, 'Suppression impossible.') })
            throw err
          }
        }}
      />
    </div>
  )
}
