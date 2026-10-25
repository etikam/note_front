import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, CornerUpLeft, Lock, PenLine, Send, ShieldCheck, Undo2, Upload } from 'lucide-react'

import { fetchGradeSheet, gradeSheetAction } from '@/features/gradeWorkflow/api/gradeWorkflowApi'
import { EVENT_LABELS, SHEET_STATUS, formatDateTime, sheetStatusText } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { GradeSheetActionDialog } from '@/features/gradeWorkflow/ui/GradeSheetActionDialog'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const EVENT_ICONS = { submit: Send, approve: Check, reject: CornerUpLeft, publish: Upload, unpublish: Undo2 }

function StepNode({ label, sublabel, state, vacant, publishes, first }) {
  const done = state === 'done'
  const current = state === 'current'
  return (
    <li className="relative flex min-w-0 flex-1 flex-col items-center text-center">
      {!first ? (
        <span
          aria-hidden
          className={cn('absolute right-1/2 top-3 h-px w-full', done || current ? 'bg-brand-500' : 'bg-[var(--app-border)]')}
        />
      ) : null}
      <span
        className={cn(
          'relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ring-4 ring-[var(--app-elevated)]',
          done && 'bg-brand-600 text-white dark:bg-brand-500',
          current && 'bg-[var(--app-elevated)] text-brand-700 ring-brand-100 outline outline-2 outline-brand-500 dark:text-brand-200 dark:ring-brand-900/40',
          !done && !current && 'bg-[var(--app-subtle)] text-[var(--app-muted)]',
        )}
      >
        {done ? <Check size={13} aria-hidden /> : publishes ? <Upload size={12} aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className={cn('mt-2 line-clamp-2 px-1 text-[12px] font-medium', current ? 'text-[var(--app-fg)]' : 'text-[var(--app-fg-soft)]')}>
        {label}
      </span>
      <span className={cn('mt-0.5 line-clamp-1 px-1 text-[11px]', vacant ? 'font-medium text-amber-700 dark:text-amber-300' : 'text-[var(--app-muted)]')}>
        {sublabel}
      </span>
    </li>
  )
}

function History({ events }) {
  const [open, setOpen] = useState(false)
  if (!events.length) return null
  return (
    <div className="border-t border-[var(--app-border)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-[12.5px] font-medium text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)]"
      >
        Historique ({events.length})
        <ChevronDown size={15} className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <ol className="space-y-3 px-4 pb-4 pt-1">
          {events.map((e) => {
            const Icon = EVENT_ICONS[e.action] ?? PenLine
            return (
              <li key={e.id} className="flex gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    e.action === 'reject' || e.action === 'unpublish'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-[var(--app-subtle)] text-[var(--app-muted)]',
                  )}
                >
                  <Icon size={12} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 text-[12.5px]">
                  <p className="text-[var(--app-fg)]">
                    <span className="font-medium">{EVENT_LABELS[e.action] ?? e.action_label}</span>
                    {e.step_label ? <span className="text-[var(--app-muted)]"> · {e.step_label}</span> : null}
                    {e.actor ? <span className="text-[var(--app-muted)]"> · {e.actor}</span> : null}
                  </p>
                  {e.comment ? <p className="mt-1 rounded-md bg-[var(--app-subtle)] px-2.5 py-1.5 text-[var(--app-fg-soft)]">{e.comment}</p> : null}
                  <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">{formatDateTime(e.created_at)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      ) : null}
    </div>
  )
}

/**
 * Fiche de notes d'un cours : état du circuit, actions (soumettre, valider, refuser,
 * dépublier, republier) et historique. ``onSheet(sheet)`` informe le parent (droit de saisie).
 */
export function GradeSheetPanel({ courseId, reloadKey = 0, onSheet }) {
  const [sheet, setSheet] = useState(null)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)

  const apply = useCallback(
    (next) => {
      setSheet(next)
      onSheet?.(next)
    },
    [onSheet],
  )

  useEffect(() => {
    let cancelled = false
    fetchGradeSheet(courseId)
      .then((s) => !cancelled && apply(s))
      .catch((err) => !cancelled && setError(err?.message || 'Fiche de notes indisponible.'))
    return () => {
      cancelled = true
    }
  }, [courseId, reloadKey, apply])

  if (error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>
  }
  if (!sheet) {
    return (
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4">
        <SkeletonLines lines={3} />
      </div>
    )
  }

  const { can, checks, steps } = sheet
  const current = sheet.step_index != null ? steps[sheet.step_index] : null
  const previous = sheet.step_index ? steps[sheet.step_index - 1] : null
  const status = SHEET_STATUS[sheet.status] ?? { tone: 'neutral' }
  const incomplete = checks.missing > 0 || checks.enrolled === 0

  const run = (action, okMessage) => async (comment) => {
    const next = await gradeSheetAction(courseId, action, comment)
    apply(next)
    dispatchToast({ type: 'success', message: okMessage })
  }

  const actions = {
    submit: {
      title: 'Soumettre la fiche pour validation ?',
      description: `Les notes seront verrouillées pendant la validation. Première étape : ${steps[0]?.label ?? '—'}.`,
      confirmLabel: 'Soumettre',
      onConfirm: run('submit', 'Fiche soumise pour validation.'),
    },
    approve: {
      title: current?.publishes ? 'Valider et publier les notes ?' : `Valider à l’étape « ${current?.label} » ?`,
      description: current?.publishes
        ? 'Les étudiants verront leurs notes dès la publication.'
        : `La fiche passera à l’étape suivante : ${steps[(sheet.step_index ?? 0) + 1]?.label ?? '—'}.`,
      confirmLabel: current?.publishes ? 'Valider et publier' : 'Valider',
      onConfirm: run('approve', current?.publishes ? 'Notes publiées.' : 'Fiche validée.'),
    },
    reject: {
      title: 'Refuser la fiche ?',
      description: previous ? `Elle reviendra à l’étape « ${previous.label} ».` : 'Elle reviendra à l’enseignant, en saisie.',
      confirmLabel: 'Refuser',
      variant: 'danger',
      commentLabel: 'Motif du refus',
      commentRequired: true,
      onConfirm: run('reject', 'Fiche renvoyée.'),
    },
    unpublish: {
      title: 'Dépublier pour corriger ?',
      description: 'Les étudiants ne verront plus ces notes. Vous pourrez les corriger puis republier directement.',
      confirmLabel: 'Dépublier',
      variant: 'danger',
      onConfirm: run('unpublish', 'Notes dépubliées : vous pouvez les corriger.'),
    },
    republish: {
      title: 'Republier les notes ?',
      description: 'Les notes corrigées redeviennent visibles par les étudiants.',
      confirmLabel: 'Republier',
      onConfirm: run('republish', 'Notes republiées.'),
    },
  }

  const hint = (() => {
    if (sheet.status === 'draft') {
      if (checks.enrolled === 0) return { warn: true, text: 'Aucun étudiant inscrit à ce cours.' }
      if (checks.missing) return { warn: true, text: `${checks.missing} étudiant(s) sur ${checks.enrolled} sans les trois notes : la fiche ne peut pas encore être soumise.` }
      return { warn: false, text: `${checks.enrolled} étudiant(s) notés : la fiche peut être soumise.` }
    }
    if (sheet.status === 'review') {
      if (current?.vacant) return { warn: true, text: `Étape « ${current.label} » vacante : un responsable de niveau supérieur peut valider à sa place.` }
      return { warn: false, text: `En attente : ${current?.label}${current?.holders.length ? ` (${current.holders.map((h) => h.name).join(', ')})` : ''}.` }
    }
    if (sheet.status === 'published') return { warn: false, text: `Publiée le ${formatDateTime(sheet.published_at)} — visible par les étudiants, saisie verrouillée.` }
    return { warn: true, text: 'Notes masquées aux étudiants le temps de la correction. Republiez une fois les corrections faites.' }
  })()

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-2 pt-3.5">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--app-fg)]">
            Fiche de notes
            <StatusPill tone={status.tone}>{sheetStatusText(sheet)}</StatusPill>
            {!can.edit ? (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-normal text-[var(--app-muted)]">
                <Lock size={12} aria-hidden /> Saisie verrouillée
              </span>
            ) : null}
          </h2>
          <p className={cn('mt-1 flex items-start gap-1.5 text-[12.5px]', hint.warn ? 'text-amber-800 dark:text-amber-200' : 'text-[var(--app-muted)]')}>
            {hint.warn ? <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden /> : null}
            {hint.text}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can.reject ? (
            <Button size="sm" variant="ghost" onClick={() => setDialog('reject')}>
              <CornerUpLeft size={14} aria-hidden /> Refuser
            </Button>
          ) : null}
          {can.approve ? (
            <Button size="sm" onClick={() => setDialog('approve')}>
              {current?.publishes ? <Upload size={14} aria-hidden /> : <ShieldCheck size={14} aria-hidden />}
              {current?.publishes ? 'Valider et publier' : 'Valider'}
            </Button>
          ) : null}
          {can.submit ? (
            <Button size="sm" onClick={() => setDialog('submit')} disabled={incomplete} title={incomplete ? hint.text : undefined}>
              <Send size={14} aria-hidden /> Soumettre pour validation
            </Button>
          ) : null}
          {can.unpublish ? (
            <Button size="sm" variant="ghost" onClick={() => setDialog('unpublish')}>
              <Undo2 size={14} aria-hidden /> Dépublier pour corriger
            </Button>
          ) : null}
          {can.republish ? (
            <Button size="sm" onClick={() => setDialog('republish')}>
              <Upload size={14} aria-hidden /> Republier
            </Button>
          ) : null}
        </div>
      </div>

      <ol className="flex gap-1 overflow-x-auto px-2 pb-4 pt-3" aria-label="Circuit de validation">
        <StepNode
          first
          label="Saisie"
          sublabel="Enseignant"
          state={sheet.status === 'draft' ? 'current' : 'done'}
        />
        {steps.map((s) => (
          <StepNode
            key={s.index}
            label={s.label}
            sublabel={s.vacant ? 'Vacant' : s.holders.map((h) => h.name).join(', ')}
            vacant={s.vacant}
            state={s.state}
            publishes={s.publishes}
          />
        ))}
      </ol>

      <History events={sheet.events} />

      {dialog ? <GradeSheetActionDialog open onClose={() => setDialog(null)} {...actions[dialog]} /> : null}
    </section>
  )
}
