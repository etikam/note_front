import { useEffect, useState } from 'react'
import { ArrowRight, Minus, Pencil, Plus } from 'lucide-react'

import { apiErrorMessage, fetchCurriculumDiff } from '@/features/curriculum/api/curriculaApi'
import { cn } from '@/shared/lib/cn'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Drawer } from '@/shared/ui/Drawer'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const FIELD = {
  code: 'Code',
  name: 'Intitulé',
  total_credits: 'Crédits',
  credits: 'Crédits',
  level: 'Niveau',
  semester: 'Semestre',
  department: 'Département',
}

const STATUS = {
  added: { label: 'Nouveau', tone: 'success', bar: 'border-l-green-500', Icon: Plus },
  removed: { label: 'Retiré', tone: 'danger', bar: 'border-l-red-500', Icon: Minus },
  changed: { label: 'Modifié', tone: 'warning', bar: 'border-l-secondary-500', Icon: Pencil },
  same: { label: 'Inchangé', tone: 'neutral', bar: 'border-l-[var(--app-border)]', Icon: null },
}

function value(field, v) {
  if (v == null || v === '') return '—'
  return field === 'semester' ? `S${v}` : String(v)
}

function ChangeLine({ change }) {
  return (
    <li className="flex flex-wrap items-center gap-1.5 text-[12px]">
      <span className="text-[var(--app-muted)]">{FIELD[change.field] ?? change.field}</span>
      <span className="rounded bg-red-50 px-1 text-red-800 line-through decoration-red-400/60 dark:bg-red-500/10 dark:text-red-200">{value(change.field, change.before)}</span>
      <ArrowRight size={12} className="text-[var(--app-muted)]" aria-hidden />
      <span className="rounded bg-green-50 px-1 font-medium text-green-800 dark:bg-green-500/10 dark:text-green-200">{value(change.field, change.after)}</span>
    </li>
  )
}

function UnitDiff({ unit }) {
  const s = STATUS[unit.status]
  const { added, removed, changed } = unit.courses
  return (
    <li className={cn('rounded-lg border border-[var(--app-border)] border-l-[3px] bg-[var(--app-elevated)] px-3 py-2', s.bar)}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px]">
          <span className="font-mono text-[12px] font-semibold">{unit.code}</span> {unit.name}
        </p>
        <StatusPill tone={s.tone} dot={false}>{s.label}</StatusPill>
      </div>
      {unit.changes.length || added.length || removed.length || changed.length ? (
        <ul className="mt-1.5 space-y-1">
          {unit.changes.map((c) => <ChangeLine key={c.field} change={c} />)}
          {added.map((c) => (
            <li key={`a${c.code}`} className="text-[12px] text-green-800 dark:text-green-200">+ cours {c.code} {c.name} ({c.credits} cr.)</li>
          ))}
          {removed.map((c) => (
            <li key={`r${c.code}`} className="text-[12px] text-red-800 dark:text-red-200">− cours {c.code} {c.name} ({c.credits} cr.)</li>
          ))}
          {changed.map((c) => (
            <li key={`c${c.code}`} className="text-[12px]">
              <span className="font-mono text-[11.5px]">{c.code}</span>
              <ul className="mt-0.5 space-y-0.5 pl-3">{c.changes.map((ch) => <ChangeLine key={ch.field} change={ch} />)}</ul>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function ProgramDiff({ program }) {
  const s = STATUS[program.status]
  const levels = program.levels
  return (
    <section className="rounded-2xl border border-[var(--app-border)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-[var(--app-muted)]">{program.department}</p>
          <h3 className="truncate font-heading text-[14.5px] font-semibold">
            <span className="font-mono text-[13px]">{program.code}</span> {program.name}
          </h3>
        </div>
        <StatusPill tone={s.tone}>{s.label}</StatusPill>
      </header>
      <div className="space-y-3 p-4">
        {program.changes.length ? <ul className="space-y-1">{program.changes.map((c) => <ChangeLine key={c.field} change={c} />)}</ul> : null}
        {levels.added.length || levels.removed.length ? (
          <p className="text-[12px]">
            {levels.added.map((l) => <span key={l} className="mr-2 text-green-800 dark:text-green-200">+ {l}</span>)}
            {levels.removed.map((l) => <span key={l} className="mr-2 text-red-800 dark:text-red-200">− {l}</span>)}
          </p>
        ) : null}
        {program.units.length ? (
          <ul className="space-y-2">{program.units.map((u) => <UnitDiff key={u.identity} unit={u} />)}</ul>
        ) : program.status === 'same' ? (
          <p className="text-[12px] text-[var(--app-muted)]">Aucun changement.</p>
        ) : null}
      </div>
    </section>
  )
}

/** Comparaison de la maquette de l'année consultée avec l'année précédente. */
export function CurriculumDiffDrawer({ open, onClose }) {
  const [diff, setDiff] = useState(null)
  const [error, setError] = useState(null)
  const [showSame, setShowSame] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setDiff(null)
    setError(null)
    fetchCurriculumDiff(undefined, { skipErrorToast: true })
      .then((d) => !cancelled && setDiff(d))
      .catch((err) => !cancelled && setError(apiErrorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [open])

  const sm = diff?.summary ?? {}
  const programs = (diff?.programs ?? []).filter((p) => showSame || p.status !== 'same')
  const chips = [
    ['Programmes nouveaux', sm.programs_added, 'text-green-700 dark:text-green-300'],
    ['Programmes retirés', sm.programs_removed, 'text-red-700 dark:text-red-300'],
    ['UE nouvelles', sm.units_added, 'text-green-700 dark:text-green-300'],
    ['UE retirées', sm.units_removed, 'text-red-700 dark:text-red-300'],
    ['UE modifiées', sm.units_changed, 'text-secondary-700 dark:text-secondary-300'],
    ['Cours ajoutés / retirés', `${sm.courses_added ?? 0} / ${sm.courses_removed ?? 0}`, 'text-[var(--app-fg)]'],
  ]

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      eyebrow="Comparaison des maquettes"
      title={diff ? `${diff.compare.label} → ${diff.year.label}` : 'Comparaison'}
      description="Ce qui change d’une année à l’autre : programmes, niveaux, UE et cours."
    >
      {error ? (
        <EmptyState tone="error" title="Comparaison impossible" description={error} />
      ) : !diff ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {chips.map(([label, v, cls]) => (
              <div key={label} className="rounded-xl bg-[var(--app-subtle)] px-3 py-2">
                <dd className={cn('font-heading text-[18px] font-semibold tabular-nums', cls)}>{v ?? 0}</dd>
                <dt className="text-[11px] text-[var(--app-muted)]">{label}</dt>
              </div>
            ))}
          </dl>
          <Checkbox checked={showSame} onChange={setShowSame} label={<span className="text-[12.5px]">Afficher les programmes inchangés</span>} />
          {programs.length ? (
            programs.map((p) => <ProgramDiff key={p.identity} program={p} />)
          ) : (
            <EmptyState compact title="Aucun changement" description="Les maquettes sont identiques à celles de l’année précédente." />
          )}
        </div>
      )}
    </Drawer>
  )
}
