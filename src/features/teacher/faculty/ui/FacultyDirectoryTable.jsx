import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'

import { TEACHER_PAGE_SIZE_OPTIONS } from '@/features/teacher/faculty/hooks/useTeacherDirectoryList'
import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

function initials(first, last) {
  const a = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim()
  return a ? a.toUpperCase() : '?'
}

const ROLE_LABEL = {
  teacher: 'Enseignant',
  department_head: 'Chef de département',
  study_director: 'Directeur des études',
  program_director: 'Directeur de programme',
  general_director: 'Directeur général',
}

function nextOrdering(current, field) {
  if (current === field) return `-${field}`
  if (current === `-${field}`) return field
  return field
}

function SortTh({ label, field, ordering, onChange, align = 'left', className }) {
  const active = ordering === field || ordering === `-${field}`
  const desc = ordering === `-${field}`
  return (
    <th
      className={cn(
        'border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(nextOrdering(ordering, field))}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-md outline-none transition-colors',
          'hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:text-zinc-200',
          align === 'left' && 'text-left',
          align === 'center' && 'w-full justify-center text-center',
          align === 'right' && 'ml-auto flex-row-reverse text-right',
        )}
      >
        <span className="truncate">{label}</span>
        <ArrowDown
          className={cn('size-3.5 shrink-0 text-zinc-400 transition-transform', active && 'text-brand-600 dark:text-brand-400', desc && 'rotate-180')}
          aria-hidden
        />
      </button>
    </th>
  )
}

const GENDER_LABEL = { M: 'M', F: 'F', '': '—' }

const COL_COUNT = 10

export function FacultyDirectoryTable({
  listEnabled,
  loading,
  error,
  onRetry,
  results,
  page,
  onPageChange,
  count,
  next,
  previous,
  pageNumbers,
  rangeStart,
  rangeEnd,
  pageSize,
  onPageSizeChange,
  ordering,
  onOrderingChange,
}) {
  const [selected, setSelected] = useState(() => new Set())
  const selectAllRef = useRef(null)

  const allPageIds = useMemo(() => results.map((r) => r.id), [results])
  const allSelected = results.length > 0 && results.every((r) => selected.has(r.id))
  const someSelected = results.some((r) => selected.has(r.id))

  useLayoutEffect(() => {
    const el = selectAllRef.current
    if (el) el.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  useEffect(() => {
    setSelected(new Set())
  }, [results])

  const toggleRow = useCallback((id) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const toggleAllPage = useCallback(() => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (allSelected) for (const id of allPageIds) n.delete(id)
      else for (const id of allPageIds) n.add(id)
      return n
    })
  }, [allPageIds, allSelected])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm',
        'dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)]',
      )}
    >
      {!listEnabled ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Faites défiler jusqu’ici pour charger le tableau.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" label="Chargement de la liste" />
        </div>
      ) : error ? (
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm text-red-700 dark:text-red-200" role="alert">
          <span>{error}</span>
          <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={onRetry}>
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-0 border-b border-zinc-100 bg-white px-4 py-3 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="whitespace-nowrap">Lignes par page</span>
                <select
                  className={cn(
                    'rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800',
                    'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:text-zinc-200',
                  )}
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                  {TEACHER_PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              {someSelected ? (
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
                </span>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem] table-fixed text-left text-[13px] leading-snug">
              <thead>
                <tr>
                  <th className="w-10 border-b border-zinc-200 bg-zinc-100 px-3 py-3 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="size-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500 dark:border-zinc-600"
                      checked={allSelected}
                      onChange={toggleAllPage}
                      aria-label="Sélectionner tous les enseignants de la page"
                    />
                  </th>
                  <SortTh label="Enseignant" field="last_name" ordering={ordering} onChange={onOrderingChange} className="min-w-[12rem]" />
                  <SortTh label="Matricule" field="matricule" ordering={ordering} onChange={onOrderingChange} className="w-[7rem]" />
                  <SortTh label="Téléphone" field="phone" ordering={ordering} onChange={onOrderingChange} className="w-[8.5rem]" />
                  <SortTh label="Grade" field="grade" ordering={ordering} onChange={onOrderingChange} className="min-w-[9rem]" />
                  <SortTh label="Rôle" field="teacher_role" ordering={ordering} onChange={onOrderingChange} className="w-[9rem]" />
                  <SortTh label="Département" field="managed_department__code" ordering={ordering} onChange={onOrderingChange} className="w-[7rem]" />
                  <SortTh label="Genre" field="gender" ordering={ordering} onChange={onOrderingChange} align="center" className="w-12" />
                  <th className="min-w-[8.5rem] border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400">
                    Statut
                  </th>
                  <th className="w-28 border-b border-zinc-200 bg-zinc-100 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[var(--app-elevated)]">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={COL_COUNT} className="px-4 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Aucun enseignant ne correspond à ces critères.
                    </td>
                  </tr>
                ) : (
                  results.map((row) => {
                    const roleLabel = ROLE_LABEL[row.teacher_role] ?? row.teacher_role
                    const isActive = Boolean(row.is_active)
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/80 dark:border-[var(--app-border)] dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-3 py-3 align-middle">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500 dark:border-zinc-600"
                            checked={selected.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            aria-label={`Sélectionner ${row.first_name} ${row.last_name}`}
                          />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex min-w-0 items-center gap-3">
                            {row.photo_url ? (
                              <img
                                className="size-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-600"
                                src={row.photo_url}
                                alt=""
                              />
                            ) : (
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white shadow-sm">
                                {initials(row.first_name, row.last_name)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                                {row.first_name} {row.last_name}
                              </p>
                              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{row.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="font-mono text-[11px] tabular-nums text-zinc-700 dark:text-zinc-300">{row.matricule}</span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">{row.phone?.trim() || '—'}</span>
                        </td>
                        <td className="max-w-[11rem] px-4 py-3 align-middle">
                          <span className="line-clamp-2 text-[12px] text-zinc-800 dark:text-zinc-200" title={row.grade_name ?? ''}>
                            {row.grade_name ?? (row.grade_code ? row.grade_code : '—')}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="line-clamp-2 text-[12px] text-zinc-800 dark:text-zinc-200" title={roleLabel}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">
                            {row.managed_department_code ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center align-middle text-[12px] text-zinc-600 dark:text-zinc-400">
                          {GENDER_LABEL[row.gender] ?? (row.gender || '—')}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              isActive
                                ? 'border border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-200'
                                : 'border border-zinc-300/70 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-200',
                            )}
                          >
                            {isActive ? 'Compte activé' : 'Compte non activé'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right align-middle">
                          <Link
                            to={`/teacher/faculty/${row.id}`}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors',
                              'bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 dark:bg-cyan-600 dark:hover:bg-cyan-500',
                            )}
                          >
                            <Pencil size={14} strokeWidth={2} aria-hidden />
                            Modifier
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            className={cn(
              'flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
              'dark:border-[var(--app-border)] dark:bg-white/[0.03]',
            )}
          >
            <span className="text-[12px] text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rangeStart}</span>
              {' — '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rangeEnd}</span>
              <span className="text-zinc-400 dark:text-zinc-500"> sur </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{count}</span>
              <span className="text-zinc-400 dark:text-zinc-500"> enseignant{count > 1 ? 's' : ''}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-40 dark:border-[var(--app-border)] dark:text-zinc-400 dark:hover:bg-white/5"
                disabled={!previous}
                onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn(
                    'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-colors',
                    n === page
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
                      : 'border border-zinc-200 text-zinc-600 hover:bg-white dark:border-[var(--app-border)] dark:text-zinc-300 dark:hover:bg-white/5',
                  )}
                  onClick={() => onPageChange(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-40 dark:border-[var(--app-border)] dark:text-zinc-400 dark:hover:bg-white/5"
                disabled={!next}
                onClick={() => onPageChange((p) => p + 1)}
                aria-label="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
