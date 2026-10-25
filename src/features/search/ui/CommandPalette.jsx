import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, History, Search } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { globalSearch } from '@/features/search/api/searchApi'
import { RESULT_GROUPS, buildCommands, normalize, pushRecent, readRecent } from '@/features/search/model/commands'
import { useOverlay } from '@/shared/hooks/useOverlay'
import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

const ICON_BY_KIND = Object.fromEntries(RESULT_GROUPS.map((g) => [g.key, g.icon]))

function useServerResults(query, open) {
  const [state, setState] = useState({ loading: false, data: null })
  useEffect(() => {
    const q = query.trim()
    if (!open || q.length < 2) {
      setState({ loading: false, data: null })
      return undefined
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true }))
    const t = setTimeout(() => {
      globalSearch(q, { signal: controller.signal })
        .then((data) => setState({ loading: false, data }))
        .catch(() => !controller.signal.aborted && setState({ loading: false, data: null }))
    }, 180)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query, open])
  return state
}

/**
 * Palette de commandes (⌘K / Ctrl K / « / ») : pages, actions rapides et recherche dans le
 * périmètre (étudiants, enseignants, cours, programmes). Clavier : ↑ ↓ pour choisir, Entrée pour ouvrir.
 */
export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const access = useAccess()
  const panelRef = useOverlay(open, onClose)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const { pages, actions } = useMemo(() => buildCommands(access), [access])
  const server = useServerResults(query, open)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    const local = (items) => (q ? items.filter((i) => normalize(`${i.title} ${i.keywords ?? ''}`).includes(q)).slice(0, 5) : items)
    const out = []
    if (!q) {
      const recent = readRecent()
      if (recent.length) out.push({ label: 'Récents', items: recent.map((r) => ({ ...r, icon: ICON_BY_KIND[r.kind] ?? History })) })
      out.push({ label: 'Actions', items: local(actions).slice(0, 6) })
      out.push({ label: 'Pages', items: local(pages) })
      return out
    }
    for (const g of RESULT_GROUPS) {
      const rows = server.data?.[g.key] ?? []
      if (rows.length) {
        out.push({
          label: g.label,
          items: rows.map((r) => ({ id: `${g.key}:${r.id}`, kind: g.key, group: g.label, icon: g.icon, title: r.title, subtitle: r.subtitle, to: g.to(r) })),
        })
      }
    }
    const matchedActions = local(actions)
    if (matchedActions.length) out.push({ label: 'Actions', items: matchedActions })
    const matchedPages = local(pages)
    if (matchedPages.length) out.push({ label: 'Pages', items: matchedPages })
    return out
  }, [query, server.data, actions, pages])

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => {
    setActive(0)
  }, [query, server.data])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function choose(item) {
    if (!item) return
    if (item.kind) pushRecent(item)
    onClose()
    navigate(item.to)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(flat.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(flat[active])
    }
  }

  if (!open) return null
  const q = query.trim()
  let index = -1

  return createPortal(
    <div
      className="ds-fade-in fixed inset-0 z-[140] flex items-start justify-center bg-[var(--app-overlay)] px-4 pt-[12vh] backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Recherche et commandes"
        className="ds-pop-in flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[var(--app-border)] px-4">
          <Search size={17} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
          <input
            data-autofocus=""
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un étudiant, un enseignant, un cours, une page…"
            aria-label="Rechercher"
            aria-controls="command-palette-list"
            aria-activedescendant={flat[active] ? `cmd-${flat[active].id}` : undefined}
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-[var(--app-fg)] outline-none placeholder:text-[var(--app-muted)]"
          />
          {server.loading ? <Spinner size="sm" label="Recherche" /> : null}
          <kbd className="hidden rounded-md border border-[var(--app-border)] px-1.5 py-0.5 text-[11px] text-[var(--app-muted)] sm:inline">Échap</kbd>
        </div>

        <div ref={listRef} id="command-palette-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
          {flat.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] text-[var(--app-muted)]">
              {q.length < 2 ? 'Tapez au moins deux caractères.' : server.loading ? 'Recherche…' : `Aucun résultat pour « ${q} ».`}
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-1.5" role="group" aria-label={g.label}>
                <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">{g.label}</p>
                {g.items.map((item) => {
                  index += 1
                  const i = index
                  const Icon = item.icon ?? History
                  const selected = i === active
                  return (
                    <button
                      key={item.id}
                      id={`cmd-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
                        selected ? 'bg-brand-50 text-brand-900 dark:bg-white/[0.07] dark:text-white' : 'text-[var(--app-fg)]',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          selected ? 'bg-brand-600 text-white dark:bg-brand-500' : 'bg-[var(--app-subtle)] text-[var(--app-muted)]',
                        )}
                      >
                        <Icon size={15} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">{item.title}</span>
                        {item.subtitle ? <span className="block truncate text-[12px] text-[var(--app-muted)]">{item.subtitle}</span> : null}
                      </span>
                      {selected ? <CornerDownLeft size={14} className="shrink-0 text-[var(--app-muted)]" aria-hidden /> : null}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-2 text-[11.5px] text-[var(--app-muted)]">
          <span><kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> naviguer</span>
          <span><kbd className="font-sans">Entrée</kbd> ouvrir</span>
          <span className="ml-auto">Recherche limitée à votre périmètre</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Déclencheur de la barre d'en-tête + raccourcis clavier globaux (⌘K, Ctrl K, « / »). */
export function SearchTrigger() {
  const [open, setOpen] = useState(false)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  useEffect(() => {
    function onKey(e) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-9 w-full max-w-[360px] items-center gap-2.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-subtle)] px-3 text-left text-[13px] text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
        aria-label="Rechercher (raccourci Ctrl K)"
      >
        <Search size={15} aria-hidden />
        <span className="min-w-0 flex-1 truncate">Rechercher…</span>
        <kbd className="hidden rounded border border-[var(--app-border)] bg-[var(--app-elevated)] px-1.5 text-[11px] font-medium sm:inline">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  )
}
