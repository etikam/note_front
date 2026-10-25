import { useMemo } from 'react'

import { SCOPE_LEVEL_LABELS, groupCatalog } from '@/features/admin/model/accessLabels'
import { Checkbox } from '@/shared/ui/Checkbox'

/**
 * Matrice des permissions d'un rôle, par domaine.
 * Une permission sans effet au niveau du rôle est désactivée (et retirée si elle était cochée).
 */
export function PermissionMatrix({ catalog, scopeLevel, value, onChange, readOnly = false }) {
  const groups = useMemo(() => groupCatalog(catalog), [catalog])
  const selected = useMemo(() => new Set(value), [value])
  const levelLabel = SCOPE_LEVEL_LABELS[scopeLevel] ?? scopeLevel

  function toggle(code, on) {
    const next = new Set(selected)
    if (on) next.add(code)
    else next.delete(code)
    onChange([...next].sort())
  }

  function toggleGroup(group, on) {
    const next = new Set(selected)
    for (const p of group.permissions) {
      if (!p.levels.includes(scopeLevel)) continue
      if (on) next.add(p.code)
      else next.delete(p.code)
    }
    onChange([...next].sort())
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => {
        const applicable = group.permissions.filter((p) => p.levels.includes(scopeLevel))
        const count = applicable.filter((p) => selected.has(p.code)).length
        const allOn = applicable.length > 0 && count === applicable.length
        return (
          <fieldset key={group.name} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
            <legend className="sr-only">{group.name}</legend>
            <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-subtle)] px-3.5 py-2 rounded-t-xl">
              <Checkbox
                checked={allOn}
                indeterminate={count > 0 && !allOn}
                disabled={readOnly || applicable.length === 0}
                onChange={(on) => toggleGroup(group, on)}
                label={<span className="text-[12.5px] font-semibold">{group.name}</span>}
              />
              <span className="text-[11.5px] tabular-nums text-[var(--app-muted)]">
                {count}/{applicable.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5 px-3.5 py-3">
              {group.permissions.map((p) => {
                const allowed = p.levels.includes(scopeLevel)
                return (
                  <Checkbox
                    key={p.code}
                    checked={allowed && selected.has(p.code)}
                    disabled={readOnly || !allowed}
                    onChange={(on) => toggle(p.code, on)}
                    label={p.label}
                    description={allowed ? null : `Sans effet au niveau « ${levelLabel} »`}
                  />
                )
              })}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
