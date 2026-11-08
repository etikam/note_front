import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom'
import { Building2, Check, ChevronDown, GraduationCap, Landmark, Network, Search, SlidersHorizontal } from 'lucide-react'

import { refPaths, ReferentialProvider, useReferential } from '@/features/referential/model/ReferentialContext'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/Popover'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'

function normalize(text) {
  return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Élément du fil d'Ariane qui sert aussi d'aiguillage vers ses voisins. */
function Crumb({ icon: Icon, label, sublabel, to, items, currentKey, onPick, searchable = false, active }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const n = normalize(q.trim())
    return n ? items.filter((it) => normalize(`${it.code} ${it.name} ${it.group ?? ''}`).includes(n)) : items
  }, [items, q])
  const groups = useMemo(() => {
    const out = new Map()
    for (const it of filtered) {
      const g = it.group ?? ''
      if (!out.has(g)) out.set(g, [])
      out.get(g).push(it)
    }
    return [...out.entries()]
  }, [filtered])

  return (
    <div
      className={cn(
        'flex min-w-0 items-center rounded-xl transition-colors',
        active ? 'bg-[var(--app-elevated)] shadow-sm ring-1 ring-[var(--app-border)]' : 'hover:bg-[var(--app-hover)]',
      )}
    >
      <Link to={to} className="flex min-w-0 items-center gap-2 py-1.5 pl-2.5 pr-1 outline-none focus-visible:underline">
        <Icon size={15} className={cn('shrink-0', active ? 'text-brand-600 dark:text-brand-300' : 'text-[var(--app-muted)]')} aria-hidden />
        <span className="min-w-0 truncate text-[13px] font-semibold">{label}</span>
        {sublabel ? <span className="hidden min-w-0 truncate text-[12px] text-[var(--app-muted)] md:inline">{sublabel}</span> : null}
      </Link>
      {items.length > 1 ? (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQ('') }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Changer : ${label}`}
              className="mr-1 flex h-7 w-6 items-center justify-center rounded-md text-[var(--app-muted)] hover:bg-[var(--app-subtle)] hover:text-[var(--app-fg)]"
            >
              <ChevronDown size={14} aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-1.5">
            {searchable ? (
              <div className="mb-1 flex items-center gap-2 rounded-lg bg-[var(--app-subtle)] px-2.5">
                <Search size={14} className="text-[var(--app-muted)]" aria-hidden />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-8 w-full bg-transparent text-[13px] outline-none"
                />
              </div>
            ) : null}
            <div className="max-h-80 overflow-y-auto">
              {groups.map(([group, list]) => (
                <div key={group || 'all'}>
                  {group ? <p className="px-2 pb-1 pt-2 text-[11.5px] font-semibold text-[var(--app-muted)]">{group}</p> : null}
                  {list.map((it) => (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => { setOpen(false); onPick(it) }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[var(--app-hover)]',
                        it.key === currentKey && 'bg-brand-50 dark:bg-white/[0.06]',
                      )}
                    >
                      <span className="w-16 shrink-0 truncate font-mono text-[11.5px] font-semibold">{it.code}</span>
                      <span className="min-w-0 flex-1 truncate">{it.name}</span>
                      {it.key === currentKey ? <Check size={14} className="text-brand-600" aria-hidden /> : null}
                    </button>
                  ))}
                </div>
              ))}
              {!filtered.length ? <p className="px-2 py-3 text-center text-[12px] text-[var(--app-muted)]">Aucun résultat</p> : null}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

function Separator() {
  return <span className="px-0.5 text-[var(--app-border-strong)]" aria-hidden>/</span>
}

function Breadcrumbs() {
  const ref = useReferential()
  const navigate = useNavigate()
  const deptMatch = useMatch('/referentiel/departements/:id/*')
  const progMatch = useMatch('/referentiel/programmes/:id/*')
  const program = progMatch ? ref.programByIdentity.get(progMatch.params.id) : null
  const department = program
    ? ref.departmentById.get(program.department.id)
    : deptMatch
      ? ref.departmentByIdentity.get(deptMatch.params.id)
      : null
  const faculty = department?.faculty ?? ref.faculties[0]
  const tab = progMatch?.params['*'] || ''

  const deptItems = ref.departments.map((d) => ({ key: d.identity, code: d.code, name: d.name, entity: d }))
  const progItems = ref.programs.map((p) => ({ key: p.identity, code: p.code, name: p.name, group: p.department.code, entity: p }))

  return (
    <nav aria-label="Fil d’Ariane du référentiel" className="flex min-w-0 flex-wrap items-center gap-0.5 rounded-2xl bg-[var(--app-subtle)]/70 p-1">
      <Crumb
        icon={Landmark}
        label={faculty?.code || 'Établissement'}
        sublabel={faculty?.name}
        to={refPaths.home}
        items={[]}
        active={!department && !program}
      />
      {department ? (
        <>
          <Separator />
          <Crumb
            icon={Building2}
            label={department.code}
            sublabel={department.name}
            to={refPaths.department(department)}
            items={deptItems}
            currentKey={department.identity}
            onPick={(it) => navigate(refPaths.department(it.entity))}
            active={!program}
          />
        </>
      ) : null}
      {program ? (
        <>
          <Separator />
          <Crumb
            icon={GraduationCap}
            label={program.code}
            sublabel={program.name}
            to={refPaths.program(program)}
            items={progItems}
            currentKey={program.identity}
            searchable
            onPick={(it) => navigate(refPaths.program(it.entity, tab.split('/')[0] || undefined))}
            active
          />
        </>
      ) : null}
    </nav>
  )
}

function ModeSwitch() {
  const cls = ({ isActive }) =>
    cn(
      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors',
      isActive ? 'bg-[var(--app-elevated)] text-[var(--app-fg)] shadow-sm ring-1 ring-[var(--app-border)]' : 'text-[var(--app-muted)] hover:text-[var(--app-fg)]',
    )
  const explorer = useMatch('/referentiel/explorer/*')
  return (
    <div className="flex shrink-0 rounded-xl bg-[var(--app-subtle)]/70 p-1" role="tablist" aria-label="Mode de navigation">
      <NavLink to={refPaths.home} className={() => cls({ isActive: !explorer })} role="tab" aria-selected={!explorer}>
        <Network size={14} aria-hidden /> Structure
      </NavLink>
      <NavLink to={refPaths.explorer} className={cls} role="tab" aria-selected={Boolean(explorer)}>
        <SlidersHorizontal size={14} aria-hidden /> Explorateur
      </NavLink>
    </div>
  )
}

function ShellBody() {
  const ref = useReferential()
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden text-[12px] font-semibold text-[var(--app-muted)] sm:inline">Référentiel</span>
          <Breadcrumbs />
        </div>
        <ModeSwitch />
      </div>
      {ref.error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={ref.error} onRetry={() => ref.reload()} />
        </SectionCard>
      ) : ref.loading && !ref.tree ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-3xl" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  )
}

/** Référentiel : on zoome de l'établissement au département puis au programme — ou on explore librement. */
export function ReferentialShell() {
  return (
    <ReferentialProvider>
      <ShellBody />
    </ReferentialProvider>
  )
}
