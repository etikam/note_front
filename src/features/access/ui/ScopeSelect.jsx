import { useMemo, useRef, useState } from 'react'
import { Building2, Check, ChevronDown, Layers } from 'lucide-react'

import { parseScopeValue, scopeValue } from '@/features/access/model/scopeFilter'
import { cn } from '@/shared/lib/cn'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/Popover'

function normalize(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Filtre de périmètre en arbre : tout le périmètre, un département (tous ses programmes) ou un
 * programme, chaque programme indenté sous son département, noms complets.
 * ``options`` vient de ``useScopeOptions``. ``programOnly`` : les départements servent de titres
 * (le filtre ne porte que sur un programme). Un périmètre verrouillé affiche l'entité sans choix.
 */
export function ScopeSelect({ options, departmentId, programId, onChange, className, allLabel = 'Tout mon périmètre', disabled, id, programOnly = false }) {
  const { departments, lockedDepartmentId, lockedProgramId, loading } = options
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const listRef = useRef(null)
  const locked = Boolean(lockedProgramId || lockedDepartmentId)
  const single = departments.length === 1 && departments[0].programs.length === 1
  const value = scopeValue({ departmentId, programId })
  const canPickDepartment = !programOnly && !lockedProgramId
  const total = departments.reduce((n, d) => n + d.programs.length, 0)

  const current = useMemo(() => {
    const { departmentId: d, programId: p } = parseScopeValue(value)
    for (const dept of departments) {
      if (d && String(dept.id) === d) return { title: dept.name || dept.code, hint: 'tous les programmes', icon: Building2 }
      const prog = p ? dept.programs.find((x) => String(x.id) === p) : null
      if (prog) return { title: prog.name || prog.code, hint: dept.code, icon: Layers }
    }
    return null
  }, [departments, value])

  const tree = useMemo(() => {
    const needle = normalize(q.trim())
    if (!needle) return departments
    return departments
      .map((d) => {
        const deptMatch = normalize(`${d.code} ${d.name}`).includes(needle)
        const programs = deptMatch ? d.programs : d.programs.filter((p) => normalize(`${p.code} ${p.name}`).includes(needle))
        return programs.length ? { ...d, programs } : null
      })
      .filter(Boolean)
  }, [departments, q])

  function pick(next) {
    onChange(next)
    setOpen(false)
    setQ('')
  }

  function onKeyDown(e) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    const items = [...(listRef.current?.querySelectorAll('[data-scope-item]:not([disabled])') ?? [])]
    if (!items.length) return
    e.preventDefault()
    const i = items.indexOf(document.activeElement)
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1)
    items[next].focus()
  }

  const isDisabled = disabled || loading || (locked && single)
  const Icon = current?.icon ?? Layers
  const itemClass = (active) =>
    cn(
      'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors focus:outline-none focus-visible:bg-[var(--app-hover)]',
      active ? 'bg-brand-50 font-medium text-brand-800 dark:bg-white/[0.07] dark:text-brand-100' : 'text-[var(--app-fg)] hover:bg-[var(--app-hover)]',
    )

  return (
    <Popover open={open} onOpenChange={(o) => !isDisabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={isDisabled}
          aria-label="Périmètre"
          className={cn('inline-flex min-w-[12rem] items-center gap-2 text-left', className)}
        >
          <Icon size={14} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {current ? current.title : <span className="text-[var(--app-muted)]">{loading ? 'Chargement…' : allLabel}</span>}
          </span>
          {current?.hint ? <span className="shrink-0 text-[11px] text-[var(--app-muted)]">{current.hint}</span> : null}
          {!isDisabled ? <ChevronDown size={14} className="shrink-0 text-[var(--app-muted)]" aria-hidden /> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-1.5" onKeyDown={onKeyDown}>
        {total > 6 ? (
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un département ou un programme"
            className="mb-1.5 h-8 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-subtle)] px-2.5 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            aria-label="Rechercher"
          />
        ) : null}
        <div ref={listRef} role="listbox" aria-label="Périmètre" className="max-h-[22rem] overflow-y-auto">
          {!locked ? (
            <button type="button" data-scope-item role="option" aria-selected={!value} className={itemClass(!value)} onClick={() => pick({ departmentId: '', programId: '' })}>
              <span className="flex-1">{allLabel}</span>
              {!value ? <Check size={14} aria-hidden /> : null}
            </button>
          ) : null}
          {tree.map((d) => {
            const deptValue = `d:${d.id}`
            const deptActive = value === deptValue
            return (
              <div key={d.id} className="mt-1 first:mt-0">
                {canPickDepartment && !lockedProgramId ? (
                  <button
                    type="button"
                    data-scope-item
                    role="option"
                    aria-selected={deptActive}
                    className={itemClass(deptActive)}
                    onClick={() => pick({ departmentId: String(d.id), programId: '' })}
                    title="Tous les programmes du département"
                  >
                    <Building2 size={14} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{d.name || d.code}</span>
                      <span className="block text-[11px] font-normal text-[var(--app-muted)]">Département {d.code} · tous les programmes</span>
                    </span>
                    {deptActive ? <Check size={14} aria-hidden /> : null}
                  </button>
                ) : (
                  <p className="flex items-center gap-2 px-2.5 pb-0.5 pt-1.5 text-[11.5px] font-semibold text-[var(--app-muted)]">
                    <Building2 size={13} aria-hidden />
                    <span className="truncate">{d.name || d.code}</span>
                    <span className="font-normal">· {d.code}</span>
                  </p>
                )}
                <div className="ml-[18px] border-l border-[var(--app-border)] pl-2">
                  {d.programs.map((p) => {
                    const v = `p:${p.id}`
                    const active = value === v
                    return (
                      <button key={p.id} type="button" data-scope-item role="option" aria-selected={active} className={itemClass(active)} onClick={() => pick({ departmentId: '', programId: String(p.id) })}>
                        <span className="min-w-0 flex-1 truncate">{p.name || p.code}</span>
                        <span className="shrink-0 rounded bg-[var(--app-subtle)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)]">{p.code}</span>
                        {active ? <Check size={14} className="shrink-0" aria-hidden /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {!tree.length ? <p className="px-3 py-4 text-center text-[12.5px] text-[var(--app-muted)]">Aucun résultat.</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
