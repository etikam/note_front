import { ArrowRight } from 'lucide-react'

import { formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fmtNote, GRADE_STATUS } from '@/features/notes/model/notesModel'
import { cn } from '@/shared/lib/cn'
import { StatusPill } from '@/shared/ui/StatusPill'

const FIELD_LABEL = { note1: 'N1', note2: 'N2', note3: 'N3', note4: 'Rattrapage' }
const SOURCE_TONE = { entry: 'neutral', import: 'info', admin_import: 'warning' }

/** « N1 6,00 → 7,00 » pour chaque note modifiée. */
export function ChangeDiff({ changes }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {Object.entries(changes ?? {}).map(([field, [before, after]]) => (
        <span key={field} className="inline-flex items-center gap-1 rounded-md bg-[var(--app-subtle)] px-1.5 py-0.5 text-[12px] tabular-nums ring-1 ring-inset ring-[var(--app-border)]">
          <span className="text-[10.5px] font-semibold text-[var(--app-muted)]">{FIELD_LABEL[field] ?? field}</span>
          <span className={cn(before == null && 'text-[var(--app-muted)]')}>{before == null ? 'vide' : fmtNote(before)}</span>
          <ArrowRight size={11} className="text-[var(--app-muted)]" aria-hidden />
          <span className="font-semibold text-[var(--app-fg)]">{after == null ? 'vide' : fmtNote(after)}</span>
        </span>
      ))}
    </span>
  )
}

export function SourcePill({ change }) {
  return (
    <StatusPill tone={SOURCE_TONE[change.source] ?? 'neutral'} dot={false}>
      {change.source_label}
    </StatusPill>
  )
}

/** Effet sur la moyenne et le statut : « 4,80 Rattrapage → 5,40 Validé ». */
export function AverageShift({ change }) {
  const changedStatus = change.status_before && change.status_before !== change.status_after
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[12px] tabular-nums text-[var(--app-fg-soft)]">
      <span>{fmtNote(change.average_before)}</span>
      <ArrowRight size={11} className="text-[var(--app-muted)]" aria-hidden />
      <span className="font-semibold text-[var(--app-fg)]">{fmtNote(change.average_after)}</span>
      {changedStatus ? (
        <StatusPill tone={GRADE_STATUS[change.status_after]?.tone} dot={false}>
          {GRADE_STATUS[change.status_after]?.label ?? change.status_after}
        </StatusPill>
      ) : null}
    </span>
  )
}

/** Chronologie compacte des modifications d'une note (tiroir d'un étudiant × cours). */
export function GradeHistoryTimeline({ items }) {
  if (!items.length) return <p className="py-6 text-center text-[13px] text-[var(--app-muted)]">Aucune modification enregistrée pour cette note.</p>
  return (
    <ol className="relative ml-2 border-l border-[var(--app-border)]">
      {items.map((ch) => (
        <li key={ch.id} className="relative pb-5 pl-5 last:pb-0">
          <span className={cn('absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--app-elevated)]', ch.was_published ? 'bg-secondary-500' : 'bg-brand-500')} aria-hidden />
          <p className="text-[12px] text-[var(--app-muted)]">
            {formatDateTime(ch.created_at)} · {ch.actor_name ?? 'Système'}
          </p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            <ChangeDiff changes={ch.changes} />
            <span className="flex flex-wrap items-center gap-2">
              <AverageShift change={ch} />
              <SourcePill change={ch} />
              {ch.was_published ? <StatusPill tone="warning" dot={false}>Correction après publication</StatusPill> : null}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
