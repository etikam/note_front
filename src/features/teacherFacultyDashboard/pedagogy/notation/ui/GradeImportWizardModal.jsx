import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import { AlertTriangle, FileSpreadsheet, Loader2, X } from 'lucide-react'

import { postCourseGradesImportCommit } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

const NOTE_LABEL = { note1: 'Note 1', note2: 'Note 2', note3: 'Note 3' }

function rowKey(c) {
  return `${c.student_id}:${c.field}`
}

/**
 * Assistant après analyse du fichier : résumé, conflits, validation unique.
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   courseId: string
 *   fileName?: string
 *   preview: Record<string, unknown> | null
 *   onCommitted: () => Promise<void>
 * }} props
 */
export function GradeImportWizardModal({ open, onClose, courseId, fileName = '', preview, onCommitted }) {
  const titleId = useId()
  const [submitting, setSubmitting] = useState(false)
  /** @type {Record<string, 'keep'|'overwrite'>} */
  const [choice, setChoice] = useState({})

  const conflicts = useMemo(() => (Array.isArray(preview?.conflicts) ? preview.conflicts : []), [preview])
  const batchPublicId = preview?.batch_public_id ? String(preview.batch_public_id) : ''

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setChoice({})
      return
    }
    const init = {}
    for (const c of conflicts) {
      init[rowKey(c)] = 'keep'
    }
    setChoice(init)
  }, [open, conflicts])

  const setAll = useCallback(
    (decision) => {
      const next = {}
      for (const c of conflicts) {
        next[rowKey(c)] = decision
      }
      setChoice(next)
    },
    [conflicts],
  )

  const canSubmit = useMemo(() => {
    if (!batchPublicId) return false
    if (!conflicts.length) return true
    return conflicts.every((c) => {
      const v = choice[rowKey(c)]
      return v === 'keep' || v === 'overwrite'
    })
  }, [batchPublicId, conflicts, choice])

  async function handleCommit() {
    if (!batchPublicId) return
    setSubmitting(true)
    try {
      const body = { batch_public_id: batchPublicId }
      if (conflicts.length) {
        body.decisions = conflicts.map((c) => ({
          student_id: c.student_id,
          field: c.field,
          decision: choice[rowKey(c)] ?? 'keep',
        }))
      }
      await postCourseGradesImportCommit(courseId, body)
      dispatchToast({ type: 'success', message: 'Import des notes enregistré.' })
      await onCommitted?.()
      onClose()
    } catch (e) {
      dispatchToast({
        type: 'error',
        message: e?.response?.data?.detail ?? e?.message ?? 'Validation impossible.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !preview) return null

  const fileErrors = Array.isArray(preview.file_errors) ? preview.file_errors : []
  const errors = Array.isArray(preview.errors) ? preview.errors : []
  const warnings = Array.isArray(preview.warnings) ? preview.warnings : []
  const pendingN = Number(preview.pending_safe_count ?? 0)
  const conflictN = Number(preview.conflicts_count ?? conflicts.length)

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
      role="presentation"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold">
              Importer des notes
            </h2>
            <p className="mt-1 flex items-center gap-2 text-xs text-[var(--app-muted)]">
              <FileSpreadsheet size={14} aria-hidden className="shrink-0" />
              <span className="truncate">{fileName || 'Fichier Excel'}</span>
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-nav-hover)] hover:text-[var(--app-fg)]"
            disabled={submitting}
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-5 py-4 space-y-5">
          {preview.detail ? (
            <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              {String(preview.detail)}
            </p>
          ) : null}

          {fileErrors.length ? (
            <div className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-100">
              <p className="font-semibold">Fichier invalide</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {fileErrors.map((msg, i) => (
                  <li key={i}>{String(msg)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!fileErrors.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_92%,var(--app-canvas))] px-3 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted)]">Sans conflit</p>
                <p className="mt-1 font-mono text-2xl font-bold text-brand-700 dark:text-brand-300">{pendingN}</p>
                <p className="text-[11px] text-[var(--app-muted)]">ligne(s) à appliquer</p>
              </div>
              <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_92%,var(--app-canvas))] px-3 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted)]">Conflits</p>
                <p className="mt-1 font-mono text-2xl font-bold text-secondary-700 dark:text-secondary-300">{conflictN}</p>
                <p className="text-[11px] text-[var(--app-muted)]">note déjà différente</p>
              </div>
              <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_92%,var(--app-canvas))] px-3 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted)]">Rejetées</p>
                <p className="mt-1 font-mono text-2xl font-bold text-zinc-700 dark:text-zinc-300">{errors.length}</p>
                <p className="text-[11px] text-[var(--app-muted)]">ligne(s) fichier</p>
              </div>
            </div>
          ) : null}

          {errors.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">Lignes ignorées</p>
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,transparent)] p-3 text-xs">
                {errors.map((er, i) => (
                  <li key={i}>
                    <span className="font-mono">{er.matricule}</span> — {er.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {warnings.length ? (
            <div className="flex gap-2 rounded-xl border border-amber-200/60 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 shrink-0" size={16} aria-hidden />
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {conflicts.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold">Décisions sur les conflits</p>
              <p className="mb-3 text-xs text-[var(--app-muted)]">
                Une note existe déjà en base et diffère du fichier. Choisissez par ligne.
              </p>
              <div className="max-h-[40vh] overflow-auto rounded-xl border border-[var(--app-border)]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_88%,var(--app-canvas))] text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                      <th className="py-2 pl-3 pr-2">Étudiant</th>
                      <th className="px-1 py-2">Champ</th>
                      <th className="px-1 py-2 text-center">Base</th>
                      <th className="px-1 py-2 text-center">Fichier</th>
                      <th className="py-2 pl-2 pr-3">Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflicts.map((c) => {
                      const k = rowKey(c)
                      const v = choice[k] ?? 'keep'
                      return (
                        <tr key={k} className="border-b border-[var(--app-border)]">
                          <td className="py-2 pl-3 pr-2">
                            <div className="font-medium">{c.last_name} {c.first_name}</div>
                            <div className="font-mono text-[10px] text-[var(--app-muted)]">{c.matricule}</div>
                          </td>
                          <td className="px-1 py-2">{NOTE_LABEL[c.field] ?? c.field}</td>
                          <td className="px-1 py-2 text-center tabular-nums">{c.value_in_db}</td>
                          <td className="px-1 py-2 text-center tabular-nums font-medium text-brand-700 dark:text-brand-300">
                            {c.value_in_file}
                          </td>
                          <td className="py-2 pl-2 pr-3">
                            <div className="flex flex-wrap gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-1">
                                <input
                                  type="radio"
                                  name={k}
                                  checked={v === 'keep'}
                                  disabled={submitting}
                                  onChange={() => setChoice((prev) => ({ ...prev, [k]: 'keep' }))}
                                />
                                <span>Garder base</span>
                              </label>
                              <label className="inline-flex cursor-pointer items-center gap-1">
                                <input
                                  type="radio"
                                  name={k}
                                  checked={v === 'overwrite'}
                                  disabled={submitting}
                                  onChange={() => setChoice((prev) => ({ ...prev, [k]: 'overwrite' }))}
                                />
                                <span>Fichier</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={() => setAll('keep')}>
                  Tout garder (base)
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={() => setAll('overwrite')}>
                  Tout remplacer (fichier)
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--app-border)] px-5 py-4">
          <Button type="button" variant="ghost" disabled={submitting} onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={submitting || !canSubmit || !batchPublicId || !!fileErrors.length}
            onClick={() => void handleCommit()}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} aria-hidden />
                Enregistrement…
              </>
            ) : (
              'Valider et enregistrer'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
