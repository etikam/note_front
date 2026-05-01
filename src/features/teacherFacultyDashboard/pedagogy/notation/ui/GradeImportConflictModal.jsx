import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

const NOTE_LABEL = { note1: 'Note 1', note2: 'Note 2', note3: 'Note 3' }

function rowKey(c) {
  return `${c.student_id}:${c.field}`
}

/**
 * @param {{
 *   open: boolean
 *   conflicts: Array<{
 *     student_id: number
 *     matricule: string
 *     first_name: string
 *     last_name: string
 *     field: string
 *     value_in_db: string
 *     value_in_file: string
 *   }>
 *   onClose: () => void
 *   onResolve: (payload: {
 *     decisions: Array<{ student_id: number, field: string, decision: 'keep'|'overwrite' }>
 *     apply_to_remaining?: 'keep'|'overwrite'
 *   }) => Promise<void>
 * }} props
 */
export function GradeImportConflictModal({ open, conflicts, onClose, onResolve }) {
  const titleId = useId()
  const [pending, setPending] = useState(false)
  /** @type {Record<string, 'keep'|'overwrite'>} */
  const [choice, setChoice] = useState({})

  useEffect(() => {
    if (!open) {
      setPending(false)
      setChoice({})
      return
    }
    const init = {}
    for (const c of conflicts) {
      init[rowKey(c)] = 'keep'
    }
    setChoice(init)
  }, [open, conflicts])

  const setAll = useCallback((decision) => {
    const next = {}
    for (const c of conflicts) {
      next[rowKey(c)] = decision
    }
    setChoice(next)
  }, [conflicts])

  const submit = useCallback(
    async (applyToRemaining) => {
      setPending(true)
      try {
        if (applyToRemaining) {
          await onResolve({ decisions: [], apply_to_remaining: applyToRemaining })
        } else {
          const decisions = conflicts.map((c) => ({
            student_id: c.student_id,
            field: c.field,
            decision: choice[rowKey(c)] ?? 'keep',
          }))
          await onResolve({ decisions })
        }
        onClose()
      } catch (e) {
        dispatchToast({
          type: 'error',
          message: e?.response?.data?.message ?? e?.response?.data?.detail ?? e?.message ?? 'Action impossible.',
        })
      } finally {
        setPending(false)
      }
    },
    [choice, conflicts, onClose, onResolve],
  )

  const canSubmitCustom = useMemo(
    () => conflicts.length > 0 && conflicts.every((c) => choice[rowKey(c)] === 'keep' || choice[rowKey(c)] === 'overwrite'),
    [choice, conflicts],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
      role="presentation"
      onClick={() => !pending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-5 py-4 dark:border-[var(--app-border)]">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Conflits d’import des notes
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Une valeur existe déjà en base et diffère du fichier. Choisissez par ligne ou appliquez le même choix à
            toutes les lignes restantes.
          </p>
        </div>
        <div className="max-h-[55vh] overflow-auto px-5 py-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-[var(--app-border)]">
                <th className="py-2 pr-2">Étudiant</th>
                <th className="py-2 px-1">Champ</th>
                <th className="py-2 px-1 text-center">Base</th>
                <th className="py-2 px-1 text-center">Fichier</th>
                <th className="py-2 pl-2">Décision</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((c) => {
                const k = rowKey(c)
                const v = choice[k] ?? 'keep'
                return (
                  <tr key={k} className="border-b border-zinc-100 dark:border-[var(--app-border)]">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-zinc-800 dark:text-zinc-100">
                        {c.last_name} {c.first_name}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500">{c.matricule}</div>
                    </td>
                    <td className="px-1 py-2 text-zinc-600 dark:text-zinc-300">{NOTE_LABEL[c.field] ?? c.field}</td>
                    <td className="px-1 py-2 text-center tabular-nums">{c.value_in_db}</td>
                    <td className="px-1 py-2 text-center tabular-nums font-medium text-brand-700 dark:text-brand-300">
                      {c.value_in_file}
                    </td>
                    <td className="py-2 pl-2">
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1">
                          <input
                            type="radio"
                            name={k}
                            checked={v === 'keep'}
                            disabled={pending}
                            onChange={() => setChoice((prev) => ({ ...prev, [k]: 'keep' }))}
                          />
                          <span>Garder base</span>
                        </label>
                        <label className="inline-flex cursor-pointer items-center gap-1">
                          <input
                            type="radio"
                            name={k}
                            checked={v === 'overwrite'}
                            disabled={pending}
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
        <div className="flex flex-col gap-2 border-t border-zinc-100 px-5 py-4 dark:border-[var(--app-border)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setAll('keep')}>
              Tout garder (base)
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setAll('overwrite')}>
              Tout remplacer (fichier)
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending || !canSubmitCustom}
              onClick={() => submit(null)}
            >
              Valider les choix
            </Button>
            <Button type="button" variant="primary" size="sm" disabled={pending} onClick={() => submit('keep')}>
              Tout garder et fermer
            </Button>
            <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => submit('overwrite')}>
              Tout remplacer et fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
