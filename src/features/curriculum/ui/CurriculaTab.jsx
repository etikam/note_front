import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ChevronDown, CopyPlus, FileText, GitCompareArrows, Lock, LockOpen, ShieldCheck, XCircle } from 'lucide-react'

import { apiErrorMessage, fetchCurricula, postCurriculumAction } from '@/features/curriculum/api/curriculaApi'
import { CurriculumDiffDrawer } from '@/features/curriculum/ui/CurriculumDiffDrawer'
import { ReconductionDialog } from '@/features/curriculum/ui/ReconductionDialog'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const SEMESTER_CREDITS = 30

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Anneau de progression : maquettes validées sur le total de l'année. */
function ReadinessRing({ validated, total }) {
  const ratio = total ? validated / total : 0
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-[var(--app-subtle)]" />
        <circle
          cx="32" cy="32" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
          className={cn('transition-[stroke-dashoffset] duration-700', ratio === 1 ? 'stroke-green-500' : 'stroke-brand-500')}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[15px] font-semibold tabular-nums">
        {validated}/{total}
      </span>
    </div>
  )
}

function SemesterChip({ slot }) {
  const ok = slot.credits === SEMESTER_CREDITS
  return (
    <span
      title={`${slot.level_name} · S${slot.semester} : ${slot.units} UE, ${slot.credits} crédits`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums ring-1 ring-inset',
        ok
          ? 'bg-green-50 text-green-800 ring-green-600/20 dark:bg-green-500/10 dark:text-green-200 dark:ring-green-400/20'
          : 'bg-secondary-50 text-secondary-800 ring-secondary-600/20 dark:bg-secondary-500/10 dark:text-secondary-200 dark:ring-secondary-400/25',
      )}
    >
      S{slot.semester}
      <span className="opacity-70">{slot.credits}/{SEMESTER_CREDITS}</span>
    </span>
  )
}

function ChecksList({ checks }) {
  const [open, setOpen] = useState(false)
  const errors = checks.filter((c) => c.severity === 'error')
  const warnings = checks.filter((c) => c.severity === 'warning')
  if (!checks.length) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-green-700 dark:text-green-300">
        <CheckCircle2 size={14} aria-hidden /> Maquette cohérente.
      </p>
    )
  }
  return (
    <div className="space-y-1.5">
      {errors.map((c, i) => (
        <p key={`e${i}`} className="flex gap-1.5 text-[12px] leading-snug text-red-800 dark:text-red-200">
          <XCircle size={14} className="mt-px shrink-0" aria-hidden /> {c.message}
        </p>
      ))}
      {warnings.length ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-secondary-800 hover:underline dark:text-secondary-200"
            aria-expanded={open}
          >
            <AlertTriangle size={14} aria-hidden />
            {warnings.length} point{warnings.length > 1 ? 's' : ''} d’attention
            <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
          {open ? (
            <ul className="mt-1 space-y-1 pl-5 text-[11.5px] leading-snug text-[var(--app-fg-soft)]">
              {warnings.map((c, i) => (
                <li key={`w${i}`} className="list-disc">{c.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ProgramCard({ program, onAction }) {
  const validated = program.status === 'validated'
  const byLevel = useMemo(() => {
    const groups = new Map()
    for (const slot of program.semesters) {
      if (!groups.has(slot.level_name)) groups.set(slot.level_name, [])
      groups.get(slot.level_name).push(slot)
    }
    return [...groups.entries()]
  }, [program.semesters])

  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border bg-[var(--app-elevated)] transition-shadow hover:shadow-md',
        validated ? 'border-green-500/40' : program.errors ? 'border-red-500/30' : 'border-[var(--app-border)]',
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--app-subtle)] px-1.5 py-0.5 font-mono text-[11.5px] font-semibold ring-1 ring-inset ring-[var(--app-border)]">{program.code}</span>
            <span className="text-[11px] uppercase tracking-wider text-[var(--app-muted)]">{program.department.code}</span>
          </div>
          <h3 className="mt-1.5 truncate font-heading text-[15px] font-semibold" title={program.name}>{program.name}</h3>
        </div>
        {validated ? (
          <StatusPill tone="success"><Lock size={11} className="mr-0.5 inline" aria-hidden />Validée</StatusPill>
        ) : (
          <StatusPill tone="warning">Brouillon</StatusPill>
        )}
      </header>

      <div className="grid grid-cols-4 divide-x divide-[var(--app-border)] border-b border-[var(--app-border)] text-center">
        {[
          ['Niveaux', program.levels],
          ['UE', program.units],
          ['Cours', program.courses],
          ['Crédits', program.credits],
        ].map(([label, value]) => (
          <div key={label} className="px-2 py-2.5">
            <div className="font-heading text-[17px] font-semibold tabular-nums">{value}</div>
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--app-muted)]">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {byLevel.length ? (
          <dl className="space-y-1.5">
            {byLevel.map(([level, slots]) => (
              <div key={level} className="flex items-center justify-between gap-2">
                <dt className="truncate text-[12px] text-[var(--app-fg-soft)]">{level}</dt>
                <dd className="flex gap-1">{slots.map((s) => <SemesterChip key={s.semester} slot={s} />)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <ChecksList checks={program.checks} />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--app-border)] px-4 py-3">
        <p className="min-w-0 truncate text-[11.5px] text-[var(--app-muted)]">
          {validated
            ? `Validée le ${formatDate(program.validated_at)}${program.validated_by ? ` par ${program.validated_by}` : ''}`
            : program.last_event
              ? `${program.last_event.label} le ${formatDate(program.last_event.at)}`
              : 'Jamais validée'}
        </p>
        <div className="flex items-center gap-1.5">
          <Link
            to={`?tab=maquette&program=${program.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/10"
          >
            <FileText size={14} aria-hidden /> Maquette
          </Link>
          {program.can.validate ? (
            validated ? (
              <Button size="sm" variant="ghost" onClick={() => onAction(program, 'reopen')}>
                <LockOpen size={14} aria-hidden /> Rouvrir
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                disabled={program.errors > 0}
                title={program.errors ? 'Corrigez d’abord les erreurs de la maquette.' : undefined}
                onClick={() => onAction(program, 'validate')}
              >
                <ShieldCheck size={14} aria-hidden /> Valider
              </Button>
            )
          ) : null}
        </div>
      </footer>
    </article>
  )
}

function ActionDialog({ pending, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setNote(''), [pending])
  if (!pending) return null
  const { program, action } = pending
  const validate = action === 'validate'
  const submit = async () => {
    setBusy(true)
    try {
      await postCurriculumAction(program.id, action, note)
      dispatchToast({ type: 'success', message: validate ? `Maquette ${program.code} validée.` : `Maquette ${program.code} rouverte.` })
      onDone()
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onClose={busy ? () => {} : onClose}
      icon={validate ? ShieldCheck : LockOpen}
      title={validate ? `Valider la maquette ${program.code}` : `Rouvrir la maquette ${program.code}`}
      description={
        validate
          ? 'Une fois validée, la maquette est verrouillée : niveaux, UE, cours et crédits ne peuvent plus changer. L’affectation des enseignants reste possible.'
          : 'La maquette repasse en brouillon et redevient modifiable. Elle devra être validée à nouveau.'
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button variant={validate ? 'primary' : 'secondary'} onClick={submit} disabled={busy}>
            {busy ? 'Enregistrement…' : validate ? 'Valider la maquette' : 'Rouvrir'}
          </Button>
        </div>
      }
    >
      <label className="block text-[12.5px] font-medium">
        Note pour le journal <span className="font-normal text-[var(--app-muted)]">(facultatif)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder={validate ? 'Ex. Validée en conseil pédagogique du 12 septembre.' : 'Ex. Ajout d’une UE optionnelle en L2.'}
          className="mt-1.5 min-h-[80px] w-full resize-y rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
        />
      </label>
    </Dialog>
  )
}

/** Maquettes de l'année : état de chaque programme, validation, reconduction et comparaison. */
export function CurriculaTab({ academicYearId, academicYearLabel }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)
  const [reconductOpen, setReconductOpen] = useState(false)
  const [diffOpen, setDiffOpen] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setData(await fetchCurricula({ skipErrorToast: true }))
    } catch (err) {
      setError(apiErrorMessage(err, 'Chargement des maquettes impossible.'))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, academicYearId])

  if (error) return <SectionCard><EmptyState tone="error" title="Maquettes indisponibles" description={error} onRetry={load} /></SectionCard>
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
      </div>
    )
  }

  const { programs, readiness, previous_year: previous, can } = data
  const allValidated = readiness.total > 0 && readiness.validated === readiness.total

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-[var(--app-border)] bg-gradient-to-br from-brand-50/70 via-[var(--app-elevated)] to-[var(--app-elevated)] p-5 dark:from-brand-500/10">
        <ReadinessRing validated={readiness.validated} total={readiness.total} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Maquettes {academicYearLabel}</p>
          <h2 className="mt-0.5 font-heading text-[18px] font-semibold">
            {readiness.total === 0
              ? 'Aucune maquette pour cette année'
              : allValidated
                ? 'Toutes les maquettes sont validées'
                : `${readiness.total - readiness.validated} maquette${readiness.total - readiness.validated > 1 ? 's' : ''} à valider`}
          </h2>
          <p className="mt-1 text-[12.5px] text-[var(--app-fg-soft)]">
            Chaque programme a sa maquette pour l’année. Validée, elle est verrouillée ; les années précédentes ne bougent jamais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {previous ? (
            <Button variant="ghost" onClick={() => setDiffOpen(true)} disabled={!readiness.total}>
              <GitCompareArrows size={15} aria-hidden /> Comparer avec {previous.label}
            </Button>
          ) : null}
          {can.reconduct ? (
            <Button variant={readiness.total ? 'ghost' : 'primary'} onClick={() => setReconductOpen(true)}>
              <CopyPlus size={15} aria-hidden /> {readiness.total ? 'Reconduire d’autres programmes' : 'Préparer l’année'}
            </Button>
          ) : null}
        </div>
      </section>

      {programs.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => <ProgramCard key={p.id} program={p} onAction={(program, action) => setPending({ program, action })} />)}
        </div>
      ) : (
        <SectionCard>
          <EmptyState
            icon={CopyPlus}
            title={`${academicYearLabel ?? 'Cette année'} n’a pas encore de structure`}
            description={
              can.reconduct
                ? previous
                  ? `Reconduisez la structure de ${previous.label} : départements, programmes, niveaux, UE et cours sont recopiés en brouillon, puis vous les ajustez.`
                  : 'Créez les départements et programmes de l’année, ou reconduisez une autre année.'
                : 'La direction n’a pas encore préparé cette année.'
            }
            action={can.reconduct ? <Button onClick={() => setReconductOpen(true)}><CopyPlus size={15} aria-hidden /> Préparer l’année</Button> : null}
          />
        </SectionCard>
      )}

      <ActionDialog pending={pending} onClose={() => setPending(null)} onDone={() => { setPending(null); load() }} />
      <ReconductionDialog
        open={reconductOpen}
        yearId={academicYearId}
        yearLabel={academicYearLabel}
        onClose={() => setReconductOpen(false)}
        onDone={load}
      />
      <CurriculumDiffDrawer open={diffOpen} onClose={() => setDiffOpen(false)} />
    </div>
  )
}
