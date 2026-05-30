import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/shared/ui/Button'

const NOTE_LABEL = { note1: 'Note 1', note2: 'Note 2', note3: 'Note 3' }

function rowKey(c) {
  return `${c.student_id}:${c.field}`
}

/**
 * Résolution des conflits notes (inline, étape 4).
 */
export function GradeImportConflictResolution({ conflicts, disabled = false, onChoicesChange }) {
  const [choice, setChoice] = useState(() => {
    const init = {}
    for (const c of conflicts) {
      init[rowKey(c)] = 'keep'
    }
    return init
  })

  useEffect(() => {
    onChoicesChange?.(choice)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- init notify parent on mount (key remounts on new batch)

  const updateChoice = useCallback(
    (next) => {
      setChoice(next)
      onChoicesChange?.(next)
    },
    [onChoicesChange],
  )

  const setAll = useCallback(
    (decision) => {
      const next = {}
      for (const c of conflicts) {
        next[rowKey(c)] = decision
      }
      updateChoice(next)
    },
    [conflicts, updateChoice],
  )

  if (!conflicts.length) return null

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">Décisions sur les conflits ({conflicts.length})</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Une note existe déjà en base et diffère du fichier. Choisissez par ligne.
        </p>
      </div>
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
                    <div className="font-medium">
                      {c.last_name} {c.first_name}
                    </div>
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
                          disabled={disabled}
                          onChange={() => updateChoice({ ...choice, [k]: 'keep' })}
                        />
                        <span>Garder base</span>
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-1">
                        <input
                          type="radio"
                          name={k}
                          checked={v === 'overwrite'}
                          disabled={disabled}
                          onChange={() => updateChoice({ ...choice, [k]: 'overwrite' })}
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
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => setAll('keep')}>
          Tout garder (base)
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => setAll('overwrite')}>
          Tout remplacer (fichier)
        </Button>
      </div>
    </div>
  )
}

export function buildConflictDecisions(conflicts, choices) {
  return conflicts.map((c) => ({
    student_id: c.student_id,
    field: c.field,
    decision: choices[`${c.student_id}:${c.field}`] ?? 'keep',
  }))
}

export function conflictsAllResolved(conflicts, choices) {
  if (!conflicts.length) return true
  return conflicts.every((c) => {
    const v = choices[`${c.student_id}:${c.field}`]
    return v === 'keep' || v === 'overwrite'
  })
}
