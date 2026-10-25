import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck } from 'lucide-react'

import { fetchAccessCatalog } from '@/features/access/api/accessApi'
import { useAccess } from '@/features/access/model/useAccess'
import { SCOPE_LEVEL_LABELS, SCOPE_LEVEL_ORDER, formatPeriod, groupCatalog } from '@/features/admin/model/accessLabels'
import { Card } from '@/shared/ui/Card'
import { SkeletonLines } from '@/shared/ui/Skeleton'

/** « Toute l'institution », « Département INFO », « Vos cours »… à partir d'un périmètre et des mandats. */
function describeScope(scope, names) {
  if (scope.institution) return 'Toute l’institution'
  const parts = []
  const add = (ids, kind) => {
    for (const id of ids ?? []) parts.push(names[`${kind}:${id}`] ?? `${SCOPE_LEVEL_LABELS[kind]} n° ${id}`)
  }
  add(scope.faculty_ids, 'faculty')
  add(scope.department_ids, 'department')
  add(scope.program_ids, 'program')
  if (scope.own_courses) parts.push('Vos cours')
  return parts.join(' · ')
}

/** Mandats actifs de l'utilisateur et ce qu'ils lui permettent, en clair. */
export function MyMandatesSection() {
  const access = useAccess()
  const [catalog, setCatalog] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchAccessCatalog()
      .then((c) => !cancelled && setCatalog(c))
      .catch(() => !cancelled && setCatalog({ permissions: [] }))
    return () => {
      cancelled = true
    }
  }, [])

  const mandates = useMemo(
    () => [...access.mandates].sort((a, b) => SCOPE_LEVEL_ORDER.indexOf(a.scope_level) - SCOPE_LEVEL_ORDER.indexOf(b.scope_level)),
    [access.mandates],
  )

  const names = useMemo(() => {
    const out = {}
    for (const m of mandates) {
      const key = m.program_id ? `program:${m.program_id}` : m.department_id ? `department:${m.department_id}` : m.faculty_id ? `faculty:${m.faculty_id}` : null
      if (key && m.target_label) out[key] = m.target_label
    }
    return out
  }, [mandates])

  const groups = useMemo(() => {
    if (!catalog) return []
    return groupCatalog(catalog.permissions.filter((p) => access.permissions[p.code])).map((g) => ({
      ...g,
      permissions: g.permissions.map((p) => ({ ...p, where: describeScope(access.permissions[p.code], names) })),
    }))
  }, [catalog, access.permissions, names])

  return (
    <Card className="border-zinc-300/90 p-5 dark:border-[var(--app-border)]">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          <BadgeCheck size={16} />
        </span>
        <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Mes mandats et droits</h2>
      </div>

      <ul className="mb-5 divide-y divide-[var(--app-border)] rounded-xl border border-[var(--app-border)]">
        {mandates.map((m) => (
          <li key={m.assignment_id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3.5 py-2.5">
            <span className="text-[13px]">
              <span className="font-semibold text-[var(--app-fg)]">{m.role_name}</span>
              {m.target_label ? <span className="text-[var(--app-fg-soft)]"> · {m.target_label}</span> : null}
            </span>
            <span className="text-[12px] text-[var(--app-muted)]">{formatPeriod(m.starts_on, m.ends_on)}</span>
          </li>
        ))}
        <li className="flex flex-wrap items-baseline justify-between gap-x-4 px-3.5 py-2.5">
          <span className="text-[13px]">
            <span className="font-semibold text-[var(--app-fg)]">Enseignant</span>
            <span className="text-[var(--app-fg-soft)]"> · sur les cours qui vous sont affectés</span>
          </span>
          <span className="text-[12px] text-[var(--app-muted)]">Permanent</span>
        </li>
      </ul>

      {!catalog ? (
        <SkeletonLines lines={4} />
      ) : groups.length ? (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.name}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">{g.name}</p>
              <ul className="space-y-1">
                {g.permissions.map((p) => (
                  <li key={p.code} className="flex flex-wrap items-baseline justify-between gap-x-4 text-[13px]">
                    <span className="text-[var(--app-fg)]">{p.label}</span>
                    <span className="text-[12px] text-[var(--app-muted)]">{p.where}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      {mandates.length === 0 ? (
        <p className="mt-4 text-[12px] text-[var(--app-muted)]">
          Les responsabilités (chef de département, directeur de programme…) sont attribuées par nomination depuis l’administration.
        </p>
      ) : null}
    </Card>
  )
}
