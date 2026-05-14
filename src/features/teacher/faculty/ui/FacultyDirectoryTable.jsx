import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

import { TEACHER_PAGE_SIZE_OPTIONS } from '@/features/teacher/faculty/hooks/useTeacherDirectoryList'
import { BADGE } from '@/features/teacher/students/studentList.constants'
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

/** En-tête triable — aligné sur `StudentTable` (`SortTh`). */
function SortTh({ label, title: titleAttr, field, ordering, onChange, align = 'left', className }) {
  const active = ordering === field || ordering === `-${field}`
  const desc = ordering === `-${field}`
  const tip = titleAttr ?? label
  return (
    <th
      title={tip}
      className={cn(
        'border-b border-[var(--app-border)] px-4 py-3.5 align-top text-[10px] font-semibold uppercase tracking-widest text-[var(--app-muted)]',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      <button
        type="button"
        title={tip}
        onClick={() => onChange(nextOrdering(ordering, field))}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-md text-left outline-none transition-colors',
          'hover:text-[var(--app-fg)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--ring-focus)_70%,transparent)]',
          align === 'right' && 'ml-auto flex-row-reverse',
          align === 'center' && 'mx-auto',
        )}
      >
        <span className="truncate">{label}</span>
        <ArrowDown
          className={cn(
            'size-3 shrink-0 text-[var(--app-muted)] transition-transform',
            active && 'text-brand-600 dark:text-brand-400',
            desc && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
    </th>
  )
}

const GENDER_LABEL = { M: 'M', F: 'F', '': '—' }

function formatMatriculeCell(row) {
  const m = row.matricule?.trim()
  return m || '—'
}

function formatFrenchCalendarDate(raw) {
  if (!raw) return '—'
  const t = new Date(raw)
  if (Number.isNaN(t.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(t)
}

const COL_COUNT = 11

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

  const actionBtnClass =
    'inline-flex size-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-[var(--app-muted)] transition-colors hover:border-brand-500/40 hover:bg-[color-mix(in_srgb,var(--app-fg)_06%,transparent)] hover:text-[var(--app-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm',
        'dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)]',
      )}
    >
      {!listEnabled ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-500">Faites défiler jusqu’ici pour charger le tableau.</span>
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
          <div
            className={cn(
              'flex flex-col gap-0 border-b border-zinc-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
              'dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]',
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
                <span className="whitespace-nowrap">Lignes par page</span>
                <select
                  className={cn(
                    'rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800',
                    'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:text-[var(--app-fg)]',
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
                <span className="text-xs font-medium text-[var(--app-muted)]">
                  {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
                </span>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto bg-[var(--app-canvas)]">
            <table className="w-full min-w-[78rem] table-fixed text-left text-[13px] leading-snug">
              <thead>
                <tr className="bg-[var(--app-canvas)]">
                  <th
                    title="Sélection — cocher les lignes pour d’éventuelles actions groupées"
                    className="w-11 border-b border-[var(--app-border)] px-3 py-3.5 align-top"
                  >
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="size-4 rounded border-[var(--app-border)] bg-[var(--app-elevated)] text-brand-600 focus:ring-[var(--ring-focus)] dark:text-brand-500"
                      checked={allSelected}
                      onChange={toggleAllPage}
                      aria-label="Sélectionner tous les enseignants de la page"
                    />
                  </th>
                  <SortTh
                    label="Matricule"
                    title="Matricule institutionnel"
                    field="matricule"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    className="w-[8rem]"
                  />
                  <SortTh
                    label="Enseignant"
                    title="Enseignant — identité et contact"
                    field="last_name"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    className="min-w-[13rem]"
                  />
                  <SortTh
                    label="Téléphone"
                    title="Téléphone"
                    field="phone"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    className="w-[8.5rem]"
                  />
                  <SortTh
                    label="Grade"
                    title="Grade / titre"
                    field="grade"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    className="min-w-[9rem]"
                  />
                  <SortTh
                    label="Rôle"
                    title="Fonction institutionnelle"
                    field="teacher_role"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    className="w-[9rem]"
                  />
                  <SortTh
                    label="Département"
                    title="Département géré (code)"
                    field="managed_department__code"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    className="w-[7rem]"
                  />
                  <SortTh
                    label="Genre"
                    title="Genre"
                    field="gender"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    align="center"
                    className="w-[4.25rem]"
                  />
                  <th
                    title="Compte utilisateur : fiche liée à un accès de connexion (activation OTP effectuée) ou non"
                    className="w-[10.5rem] border-b border-[var(--app-border)] px-4 py-3.5 align-top text-[10px] font-semibold uppercase tracking-widest text-[var(--app-muted)]"
                  >
                    Compte
                  </th>
                  <SortTh
                    label="Créée le"
                    title="Date de création de la fiche"
                    field="created_at"
                    ordering={ordering}
                    onChange={onOrderingChange}
                    className="w-[7rem]"
                  />
                  <th
                    title="Actions — ouvrir la fiche enseignant"
                    className="border-b border-[var(--app-border)] px-3 py-3.5 text-right align-top text-[10px] font-semibold uppercase tracking-widest text-[var(--app-muted)]"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--app-canvas)]">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={COL_COUNT} className="px-4 py-14 text-center text-sm text-[var(--app-muted)]">
                      Aucun enseignant ne correspond à ces critères.
                    </td>
                  </tr>
                ) : (
                  results.map((row) => {
                    const roleLabel = ROLE_LABEL[row.teacher_role] ?? row.teacher_role
                    const accountLinked = Boolean(row.is_active)
                    const email = (row.email || '').trim()
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[var(--app-border)] transition-colors hover:bg-[color-mix(in_srgb,var(--app-fg)_04%,transparent)]"
                      >
                        <td className="px-3 py-4 align-middle">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-[var(--app-border)] bg-[var(--app-elevated)] text-brand-600 focus:ring-[var(--ring-focus)] dark:text-brand-500"
                            checked={selected.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            aria-label={`Sélectionner ${row.first_name} ${row.last_name}`}
                          />
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className="font-mono text-[12px] tabular-nums text-[var(--app-fg)]">
                            {formatMatriculeCell(row)}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex min-w-0 items-center gap-3">
                            {row.photo_url ? (
                              <img
                                className="size-9 shrink-0 rounded-full object-cover ring-1 ring-[var(--app-border)]"
                                src={row.photo_url}
                                alt=""
                              />
                            ) : (
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white shadow-sm">
                                {initials(row.first_name, row.last_name)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--app-fg)]">
                                {row.first_name} {row.last_name}
                              </p>
                              <p className="truncate text-[12px] text-[var(--app-muted)]">
                                {email || 'Pas d’e-mail renseigné'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className="font-mono text-[12px] tabular-nums text-[var(--app-muted)]">
                            {row.phone?.trim() || '—'}
                          </span>
                        </td>
                        <td className="max-w-[11rem] px-4 py-4 align-middle">
                          <span
                            className="line-clamp-2 text-[12px] text-[var(--app-fg)]"
                            title={row.grade_name ?? ''}
                          >
                            {row.grade_name ?? (row.grade_code ? row.grade_code : '—')}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className="line-clamp-2 text-[12px] text-[var(--app-fg)]" title={roleLabel}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className="font-mono text-[11px] tabular-nums text-[var(--app-muted)]">
                            {row.managed_department_code ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center align-middle text-[12px] text-[var(--app-muted)]">
                          {GENDER_LABEL[row.gender] ?? (row.gender || '—')}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span
                            className={cn(
                              BADGE,
                              'max-w-full whitespace-normal text-center text-[10px] font-semibold leading-snug tracking-wide',
                              accountLinked
                                ? 'border border-[#10b981]/40 bg-[#10b981]/14 text-[#047857] dark:border-[#34d399]/35 dark:bg-[#10b981]/18 dark:text-[#a7f3d0]'
                                : 'border border-secondary-500/35 bg-secondary-500/10 text-secondary-800 dark:border-secondary-400/30 dark:bg-secondary-400/10 dark:text-secondary-300',
                            )}
                            title={
                              accountLinked
                                ? 'Compte utilisateur activé : la fiche est liée à un accès de connexion.'
                                : 'Compte utilisateur non activé : la fiche existe sans accès de connexion (OTP non effectué ou en attente).'
                            }
                          >
                            {accountLinked ? 'Compte activé' : 'Compte non activé'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle text-[12px] text-[var(--app-muted)]">
                          {formatFrenchCalendarDate(row.created_at)}
                        </td>
                        <td className="px-3 py-4 text-right align-middle">
                          <Link
                            to={`/teacher/faculty/${row.id}`}
                            className={cn(actionBtnClass)}
                            aria-label={`Ouvrir la fiche de ${row.first_name} ${row.last_name}`}
                            title="Ouvrir la fiche"
                          >
                            <Eye className="size-[18px] text-brand-600 dark:text-brand-400" strokeWidth={2} aria-hidden />
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
