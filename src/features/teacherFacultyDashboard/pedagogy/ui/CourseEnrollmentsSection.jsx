import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ExternalLink, LayoutGrid, List, Search, Users } from 'lucide-react'

import { formatCohortDisplay } from '@/shared/lib/formatCohortDisplay'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

function initials(first, last) {
  const a = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim()
  return a ? a.toUpperCase() : '?'
}

/** Inscription au cours côté API (seules ces lignes apparaissent dans l’onglet « Inscrits »). */
const ENROLLMENT_ACCEPTED = 'approved'

/** Libellé dossier étudiant (évite le doublon « Inscrit » côté annuaire vs inscription au cours). */
const STUDENT_DOSSIER_LABELS = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  SUSPENDED: 'Suspendu',
  EXCLUDED: 'Exclu',
  COMPLETED: 'Terminé',
}

const BADGE_BASE =
  'inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide'

const FILTER_LABEL =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'

/** Hauteur commune des champs (recherche / select / bouton). */
const FILTER_CONTROL_H = 'h-10'

const DEFAULT_ORDERING = 'last_name'

function nextOrdering(current, field) {
  if (current === field) return `-${field}`
  if (current === `-${field}`) return field
  return field
}

/** Valeur de tri stable (chaîne ou nombre). */
function sortKey(row, field) {
  switch (field) {
    case 'last_name':
      return `${(row.last_name || '').toLowerCase()}\t${(row.first_name || '').toLowerCase()}`
    case 'matricule':
      return (row.matricule || '').toLowerCase()
    case 'ine':
      return (row.INE || '').toLowerCase()
    case 'student_status':
      return (row.student_status || '').toLowerCase()
    case 'cohorte':
      return (row.cohorte_label || '').toLowerCase()
    case 'level':
      return (row.level_compact || row.level_name || '').toLowerCase()
    case 'department_code':
      return (row.department_code || '').toLowerCase()
    case 'enrolled_at':
      return row.enrolled_at ? new Date(row.enrolled_at).getTime() : 0
    case 'approved_at':
      return row.approved_at ? new Date(row.approved_at).getTime() : 0
    default:
      return ''
  }
}

function compareEnrollment(a, b, field, desc) {
  if (field === 'cohorte') {
    const la = (a.cohorte_label || '').trim()
    const lb = (b.cohorte_label || '').trim()
    if (!la && !lb) {
      /* continue to tie-break */
    } else if (!la) return desc ? -1 : 1
    else if (!lb) return desc ? 1 : -1
  }
  const va = sortKey(a, field)
  const vb = sortKey(b, field)
  let cmp = 0
  if (typeof va === 'number' && typeof vb === 'number') {
    cmp = va - vb
  } else {
    cmp = String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' })
  }
  if (cmp !== 0) return desc ? -cmp : cmp
  const tie = `${a.matricule || ''}`.localeCompare(`${b.matricule || ''}`, 'fr', { sensitivity: 'base' })
  return desc ? -tie : tie
}

function SortTh({ label, field, ordering, onChange, align = 'left', className }) {
  const active = ordering === field || ordering === `-${field}`
  const desc = ordering === `-${field}`
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-zinc-200 bg-zinc-100/95 px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-600',
        'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(nextOrdering(ordering, field))}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-md text-left outline-none transition-colors',
          'hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:text-zinc-200',
          align === 'right' && 'ml-auto flex-row-reverse',
          align === 'center' && 'mx-auto',
        )}
      >
        <span className="truncate">{label}</span>
        <ArrowDown
          className={cn(
            'size-3.5 shrink-0 text-zinc-400 transition-transform',
            active && 'text-brand-600 dark:text-brand-400',
            desc && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
    </th>
  )
}

/**
 * Onglet « Inscrits » d’un cours : recherche, filtre cohorte, vues tableau / cartes.
 * N’affiche **que** les inscriptions au cours au statut **approuvé** (acceptées) — ni « en attente » ni « rejeté ».
 * @param {{ enrollments: Array<Record<string, unknown>> }} props
 */
export function CourseEnrollmentsSection({ enrollments = [] }) {
  const roster = useMemo(
    () => enrollments.filter((e) => String(e.status) === ENROLLMENT_ACCEPTED),
    [enrollments],
  )
  const [q, setQ] = useState('')
  const [cohorteId, setCohorteId] = useState('')
  const [ordering, setOrdering] = useState(DEFAULT_ORDERING)
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.localStorage.getItem('ci.courseEnrollments.view') === 'cards' ? 'cards' : 'table'))

  const setViewMode = (v) => {
    setView(v)
    if (typeof window !== 'undefined') window.localStorage.setItem('ci.courseEnrollments.view', v)
  }

  const cohortOptions = useMemo(() => {
    const map = new Map()
    for (const row of roster) {
      const id = row.cohorte_id
      if (id == null) continue
      if (map.has(id)) continue
      const label = (typeof row.cohorte_label === 'string' && row.cohorte_label.trim()) || formatCohortDisplay(row) || `Cohorte #${id}`
      map.set(id, { id, label })
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }, [roster])

  const hasSansCohorte = useMemo(() => roster.some((r) => r.cohorte_id == null), [roster])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return roster.filter((row) => {
      if (cohorteId) {
        if (cohorteId === '__none__') {
          if (row.cohorte_id != null) return false
        } else if (String(row.cohorte_id) !== String(cohorteId)) {
          return false
        }
      }
      if (!term) return true
      const haystack = [
        row.matricule,
        row.first_name,
        row.last_name,
        row.INE,
        row.email,
        row.cohorte_label,
        row.level_compact,
        row.level_name,
        row.department_code,
      ]
        .filter((x) => x != null && x !== '')
        .join(' ')
        .toLowerCase()
      if (haystack.includes(term)) return true
      const words = term.split(/\s+/).filter(Boolean)
      return words.every((w) => haystack.includes(w))
    })
  }, [roster, q, cohorteId])

  const orderedRows = useMemo(() => {
    const desc = ordering.startsWith('-')
    const field = desc ? ordering.slice(1) : ordering
    const rows = [...filtered]
    rows.sort((a, b) => compareEnrollment(a, b, field, desc))
    return rows
  }, [filtered, ordering])

  const handleOrderingChange = useCallback((next) => {
    setOrdering(next)
  }, [])

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div
        className={cn(
          'w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50/95 via-white to-secondary-50/30',
          'dark:border-[var(--app-border)] dark:from-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:via-[var(--app-elevated)] dark:to-secondary-950/20',
        )}
      >
        <div className="flex flex-col gap-4 p-4 sm:p-5 border-b border-zinc-100/80 dark:border-[var(--app-border)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500/20 to-brand-500/15 text-secondary-700 dark:text-secondary-300 ring-1 ring-zinc-200/60 dark:ring-white/10">
                <Users size={22} strokeWidth={2} aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">Effectif du cours</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {orderedRows.length} affiché{orderedRows.length > 1 ? 's' : ''} sur {roster.length} inscription{roster.length > 1 ? 's' : ''}{' '}
                  validée{roster.length > 1 ? 's' : ''}
                  {view === 'table' ? ' · tri au clic sur les en-têtes' : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-zinc-200/90 bg-white p-0.5 shadow-sm dark:border-[var(--app-border)] dark:bg-zinc-900/40">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    view === 'table'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5',
                  )}
                >
                  <List size={15} aria-hidden />
                  Tableau
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    view === 'cards'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5',
                  )}
                >
                  <LayoutGrid size={15} aria-hidden />
                  Cartes
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 sm:items-end',
              q || cohorteId ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]' : 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]',
            )}
          >
            <div className="min-w-0">
              <label htmlFor="course-enrollments-search" className={FILTER_LABEL}>
                Recherche
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden
                />
                <input
                  id="course-enrollments-search"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Matricule, nom, INE, e-mail…"
                  className={cn(
                    FILTER_CONTROL_H,
                    'w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm leading-none',
                    'placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
                    'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_95%,black)]',
                  )}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label htmlFor="course-enrollments-cohorte" className={FILTER_LABEL}>
                Cohorte
              </label>
              <select
                id="course-enrollments-cohorte"
                value={cohorteId}
                onChange={(e) => setCohorteId(e.target.value)}
                className={cn(
                  FILTER_CONTROL_H,
                  'w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium leading-none',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500/50',
                  'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_95%,black)]',
                )}
              >
                <option value="">Toutes les cohortes</option>
                {hasSansCohorte ? (
                  <option value="__none__">Sans cohorte</option>
                ) : null}
                {cohortOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {q || cohorteId ? (
              <div className="flex min-w-0 flex-col sm:col-span-2 lg:col-span-1">
                <span className={FILTER_LABEL}>Réinitialisation</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setQ('')
                    setCohorteId('')
                  }}
                  className={cn(FILTER_CONTROL_H, 'w-full shrink-0 px-4 text-sm font-semibold lg:w-auto')}
                >
                  Réinitialiser
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {roster.length === 0
              ? 'Aucun étudiant validé pour ce cours (les demandes en attente sont dans l’onglet « Demandes d’inscriptions »).'
              : 'Aucun étudiant ne correspond à ces critères.'}
          </div>
        ) : view === 'table' ? (
          <div
            className={cn(
              'w-full min-w-0 max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain',
              'rounded-b-2xl [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]',
            )}
          >
            <table className="w-full min-w-[42rem] text-left text-[13px] leading-snug sm:min-w-[56rem] md:min-w-[64rem] lg:min-w-[72rem]">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-zinc-200 bg-zinc-100/95 py-3 pl-4 pr-1 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]"
                  >
                    <span className="sr-only">Photo</span>
                  </th>
                  <SortTh label="Nom" field="last_name" ordering={ordering} onChange={handleOrderingChange} />
                  <SortTh label="Matricule" field="matricule" ordering={ordering} onChange={handleOrderingChange} />
                  <SortTh label="INE" field="ine" ordering={ordering} onChange={handleOrderingChange} />
                  <SortTh label="Dossier" field="student_status" ordering={ordering} onChange={handleOrderingChange} />
                  <SortTh label="Cohorte" field="cohorte" ordering={ordering} onChange={handleOrderingChange} />
                  <SortTh label="Niveau" field="level" ordering={ordering} onChange={handleOrderingChange} />
                  <SortTh label="Dépt." field="department_code" ordering={ordering} onChange={handleOrderingChange} />
                  <SortTh label="Validée le" field="approved_at" ordering={ordering} onChange={handleOrderingChange} />
                  <th
                    scope="col"
                    className="border-b border-zinc-200 bg-zinc-100/95 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400"
                  >
                    Fiche
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-[var(--app-border)] dark:bg-[var(--app-elevated)]">
                {orderedRows.map((row, idx) => {
                  const dossierLabel = STUDENT_DOSSIER_LABELS[row.student_status] ?? row.student_status ?? '—'
                  const acceptedAt = row.approved_at || row.enrolled_at
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors',
                        idx % 2 === 0
                          ? 'bg-white dark:bg-[var(--app-elevated)]'
                          : 'bg-zinc-50/60 dark:bg-white/[0.02]',
                        'hover:bg-secondary-50/40 dark:hover:bg-secondary-950/15',
                      )}
                    >
                      <td className="py-3 pl-4 pr-1 align-middle">
                        {row.photo_url ? (
                          <img
                            src={row.photo_url}
                            alt=""
                            className="size-10 rounded-full object-cover ring-2 ring-zinc-100 shadow-sm dark:ring-zinc-700"
                          />
                        ) : (
                          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white shadow-sm">
                            {initials(row.first_name, row.last_name)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-2 align-middle">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate" title={`${row.first_name} ${row.last_name}`}>
                          {row.first_name} {row.last_name}
                        </p>
                      </td>
                      <td className="py-3 pr-2 align-middle font-mono text-[12px] tabular-nums text-zinc-700 dark:text-zinc-200 truncate" title={row.matricule}>
                        {row.matricule || '—'}
                      </td>
                      <td className="py-3 pr-2 align-middle font-mono text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 truncate" title={row.INE}>
                        {row.INE || '—'}
                      </td>
                      <td className="py-3 pr-2 align-middle">
                        <span
                          className={cn(
                            'inline-flex max-w-full truncate rounded-lg border px-2 py-1 text-[11px] font-semibold',
                            'border-zinc-200/90 bg-zinc-50 text-zinc-800 dark:border-[var(--app-border)] dark:bg-white/5 dark:text-zinc-200',
                          )}
                          title="Statut du dossier étudiant"
                        >
                          {dossierLabel}
                        </span>
                      </td>
                      <td className="py-3 pr-2 align-middle">
                        <span className="block truncate text-xs text-zinc-700 dark:text-zinc-300" title={row.cohorte_label || '—'}>
                          {row.cohorte_label || '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-2 align-middle text-center">
                        <span className="font-mono text-xs font-semibold text-secondary-800 dark:text-secondary-200">
                          {row.level_compact || row.level_name || '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-2 align-middle text-center">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                          {row.department_code || '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-2 align-middle text-xs tabular-nums text-zinc-600 dark:text-zinc-400" title="Date d’acceptation de l’inscription au cours (sinon : demande)">
                        {acceptedAt
                          ? new Date(acceptedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="py-3 pr-4 text-right align-middle">
                        <Link
                          to={`/teacher/students/${row.student_id}`}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold',
                            'text-brand-700 bg-brand-50 hover:bg-brand-100 dark:text-brand-200 dark:bg-brand-950/40 dark:hover:bg-brand-900/50',
                            'ring-1 ring-brand-200/60 dark:ring-brand-800/50',
                          )}
                        >
                          Fiche
                          <ExternalLink size={12} className="opacity-80" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="min-w-0 p-3 sm:p-4">
            <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {orderedRows.map((row) => {
                const dossierLabel = STUDENT_DOSSIER_LABELS[row.student_status] ?? row.student_status ?? '—'
                const acceptedAt = row.approved_at || row.enrolled_at
                return (
                  <li key={row.id}>
                    <article
                      className={cn(
                        'group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm',
                        'transition-all duration-200 hover:shadow-md hover:border-secondary-300/50',
                        'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_98%,black)]',
                        'dark:hover:border-secondary-600/30',
                      )}
                    >
                      <div
                        className={cn(
                          'relative h-12 bg-gradient-to-r from-secondary-500/15 via-brand-500/10 to-amber-500/10',
                          'dark:from-secondary-900/30 dark:via-brand-900/20 dark:to-amber-900/20',
                        )}
                      />
                      <div className="flex flex-1 flex-col px-3 pb-3 -mt-6 sm:-mt-7">
                        <div className="flex items-end gap-2.5">
                          {row.photo_url ? (
                            <img
                              src={row.photo_url}
                              alt=""
                              className="size-12 shrink-0 rounded-xl object-cover ring-2 ring-white shadow-sm dark:ring-zinc-900"
                            />
                          ) : (
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-secondary-600 text-sm font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900">
                              {initials(row.first_name, row.last_name)}
                            </span>
                          )}
                          <div className="min-w-0 pb-0.5 flex-1">
                            <h3 className="text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-50 truncate group-hover:text-brand-800 dark:group-hover:text-brand-200 transition-colors">
                              {row.first_name} {row.last_name}
                            </h3>
                            <p className="text-[11px] font-mono text-zinc-500 tabular-nums">{row.matricule}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span
                            className={cn(
                              BADGE_BASE,
                              'bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200',
                            )}
                            title="Inscription au cours"
                          >
                            Inscription acceptée
                          </span>
                          <span
                            className={cn(
                              BADGE_BASE,
                              'bg-zinc-100 text-zinc-700 border-zinc-200/80 dark:bg-white/5 dark:text-zinc-300',
                            )}
                          >
                            Dossier {dossierLabel}
                          </span>
                        </div>
                        <dl className="mt-2 space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                          {row.cohorte_label ? (
                            <div className="flex justify-between gap-2">
                              <dt className="text-zinc-500 shrink-0">Cohorte</dt>
                              <dd className="text-right font-medium text-zinc-800 dark:text-zinc-200 truncate">{row.cohorte_label}</dd>
                            </div>
                          ) : null}
                          <div className="flex justify-between gap-2">
                            <dt className="text-zinc-500">Niveau</dt>
                            <dd className="text-right">
                              <span className="font-mono font-semibold text-secondary-800 dark:text-secondary-200">
                                {row.level_compact || row.level_name || '—'}
                              </span>
                              {row.department_code ? (
                                <span className="text-zinc-400"> · {row.department_code}</span>
                              ) : null}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2 text-[10px] text-zinc-500">
                            <dt>Validée le</dt>
                            <dd className="tabular-nums text-right" title="Acceptation de l’inscription au cours">
                              {acceptedAt
                                ? new Date(acceptedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                                : '—'}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-auto pt-2.5">
                          <Link
                            to={`/teacher/students/${row.student_id}`}
                            className={cn(
                              'flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold',
                              'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-sm',
                              'hover:from-brand-500 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400',
                              'dark:from-brand-500 dark:to-brand-600',
                            )}
                          >
                            Fiche étudiant
                            <ExternalLink size={14} className="opacity-90" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
