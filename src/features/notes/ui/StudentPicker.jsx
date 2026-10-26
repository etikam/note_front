import { useEffect, useState } from 'react'

import { globalSearch } from '@/features/search/api/searchApi'
import { Avatar } from '@/shared/ui/Avatar'
import { SearchInput } from '@/shared/ui/SearchInput'

/** Recherche d'un étudiant du périmètre (nom, matricule, INE) ; ``onPick({ id, title, subtitle })``. */
export function StudentPicker({ onPick, autoFocus = false }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      return undefined
    }
    const controller = new AbortController()
    const t = setTimeout(() => {
      globalSearch(q.trim(), { signal: controller.signal })
        .then((d) => setResults(d.students ?? []))
        .catch(() => {})
    }, 200)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [q])
  return (
    <div className="relative w-full">
      <SearchInput value={q} onChange={setQ} placeholder="Nom, matricule ou INE" autoFocus={autoFocus} ariaLabel="Rechercher un étudiant" />
      {results.length ? (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(r)
                  setQ('')
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--app-hover)]"
              >
                <Avatar name={r.title} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[var(--app-fg)]">{r.title}</span>
                  <span className="block truncate text-[11.5px] text-[var(--app-muted)]">{r.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
