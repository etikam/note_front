import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutGrid, ListOrdered, PanelRight, Search } from 'lucide-react'

import { fetchCoursesList, fetchTeachingUnits } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { useAuth } from '@/features/auth/model/AuthContext'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, Input } from '@/shared/ui/Field'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

/** @param {Array<Record<string, unknown>>} rows */
function groupCoursesByTeachingUnit(rows) {
  const m = new Map()
  for (const c of rows) {
    const tuId = c.teaching_unit
    const key = tuId != null ? String(tuId) : '_'
    if (!m.has(key)) {
      m.set(key, {
        ueId: tuId,
        ueCode: c.teaching_unit_code ?? '—',
        ueName: c.teaching_unit_name ?? '',
        courses: [],
      })
    }
    m.get(key).courses.push(c)
  }
  const groups = Array.from(m.values())
  for (const g of groups) {
    g.courses.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'fr', { sensitivity: 'base' }))
  }
  groups.sort((a, b) => String(a.ueCode).localeCompare(String(b.ueCode), 'fr', { sensitivity: 'base' }))
  return groups
}

/**
 * @param {{
 *   yearFocusId: number | null
 *   modules: Array<{ id: number; number: number; start_date?: string; end_date?: string; academic_year_label?: string }>
 *   departments: Array<{ id: number; code: string; name: string }>
 *   unitsForUeFilter: Array<{ id: number; code: string; name: string }>
 *   managedDeptId: number | null
 *   institutionWide?: boolean
 *   canStructure: boolean
 *   reloadKey: number
 * }} props
 */
export function PedagogyCoursesSection({
  yearFocusId,
  modules,
  departments,
  unitsForUeFilter,
  managedDeptId,
  institutionWide = false,
  canStructure,
  reloadKey,
}) {
  const { user } = useAuth()
  const deptScoped = managedDeptId != null && !institutionWide
  const [viewMode, setViewMode] = useState(/** @type {'byUe' | 'flat'} */ ('byUe'))
  const [flatSort, setFlatSort] = useState(/** @type {'asc' | 'desc'} */ ('asc'))
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterDepartment, setFilterDepartment] = useState(() =>
    managedDeptId != null && !institutionWide ? String(managedDeptId) : '',
  )
  const [filterUe, setFilterUe] = useState('')
  const [page, setPage] = useState(1)
  const pageSizeFlat = 20
  const pageSizeByUe = 200

  const [payload, setPayload] = useState({ results: [], count: 0, next: null, previous: null })
  const [loading, setLoading] = useState(false)
  const [teachingUnitsCatalog, setTeachingUnitsCatalog] = useState([])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (deptScoped) setFilterDepartment(String(managedDeptId))
  }, [deptScoped, managedDeptId])

  /** Changement de compte (ex. chef → DG) : ne pas garder le filtre département imposé. */
  useEffect(() => {
    if (user?.id == null) return
    if (institutionWide) setFilterDepartment('')
  }, [user?.id, institutionWide])

  useEffect(() => {
    if (!yearFocusId) return
    let cancelled = false
    ;(async () => {
      try {
        const u = await fetchTeachingUnits()
        if (!cancelled) setTeachingUnitsCatalog(u.sort((a, b) => String(a.code).localeCompare(String(b.code))))
      } catch {
        if (!cancelled) setTeachingUnitsCatalog([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [yearFocusId])

  const loadCourses = useCallback(async () => {
    if (!yearFocusId) {
      setPayload({ results: [], count: 0, next: null, previous: null })
      return
    }
    setLoading(true)
    try {
      const base = {
        academic_year_id: yearFocusId,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(filterModule ? { module_id: Number(filterModule) } : {}),
        ...(filterDepartment ? { department_id: Number(filterDepartment) } : {}),
        ...(filterUe ? { teaching_unit_id: Number(filterUe) } : {}),
      }
      if (viewMode === 'byUe') {
        const data = await fetchCoursesList({
          ...base,
          page: 1,
          page_size: pageSizeByUe,
          ordering: 'teaching_unit__code,name',
        })
        setPayload(data)
      } else {
        const ordering = flatSort === 'asc' ? 'name' : '-name'
        const data = await fetchCoursesList({
          ...base,
          page,
          page_size: pageSizeFlat,
          ordering,
        })
        setPayload(data)
      }
    } catch (e) {
      dispatchToast({ type: 'error', message: e?.message ?? 'Chargement des cours impossible.' })
      setPayload({ results: [], count: 0, next: null, previous: null })
    } finally {
      setLoading(false)
    }
  }, [
    yearFocusId,
    debouncedSearch,
    filterModule,
    filterDepartment,
    filterUe,
    viewMode,
    flatSort,
    page,
    reloadKey,
  ])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    setPage(1)
  }, [viewMode, flatSort, debouncedSearch, filterModule, filterDepartment, filterUe, yearFocusId])

  const groups = useMemo(() => groupCoursesByTeachingUnit(payload.results ?? []), [payload.results])

  const totalPages = Math.max(1, Math.ceil((payload.count || 0) / pageSizeFlat))
  const showCapNotice = viewMode === 'byUe' && (payload.count ?? 0) >= pageSizeByUe

  if (!yearFocusId) {
    return (
      <Card className="p-8 border border-zinc-200/90 dark:border-[var(--app-border)] text-center text-sm text-zinc-500">
        Sélectionnez une année académique dans l’onglet « Années & modules » pour afficher les cours.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 border border-zinc-200/90 dark:border-[var(--app-border)] shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 self-center mr-1">Affichage</span>
            <button
              type="button"
              onClick={() => setViewMode('byUe')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                viewMode === 'byUe'
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] dark:text-zinc-300',
              )}
            >
              <LayoutGrid size={14} aria-hidden />
              Par UE
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                viewMode === 'flat'
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] dark:text-zinc-300',
              )}
            >
              <ListOrdered size={14} aria-hidden />
              Ordre A–Z
            </button>
            {viewMode === 'flat' ? (
              <button
                type="button"
                onClick={() => setFlatSort((s) => (s === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] dark:text-zinc-300"
              >
                <PanelRight size={14} aria-hidden />
                {flatSort === 'asc' ? 'A → Z' : 'Z → A'}
              </button>
            ) : null}
          </div>
          <div className="flex flex-1 min-w-0 max-w-md items-end gap-2">
            <Field label="Recherche" className="flex-1 min-w-0 mb-0">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden />
                <Input
                  className={cn(inputCls, 'pl-8')}
                  placeholder="Code ou intitulé…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </Field>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Module" className="mb-0">
            <select className={inputCls} value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
              <option value="">Tous</option>
              {modules.map((s) => (
                <option key={s.id} value={s.id}>
                  M{s.number}
                  {s.academic_year_label ? ` (${s.academic_year_label})` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Département" className="mb-0">
            <select
              className={inputCls}
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              disabled={deptScoped}
            >
              <option value="">Tous</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="UE" className="mb-0 lg:col-span-2">
            <select className={inputCls} value={filterUe} onChange={(e) => setFilterUe(e.target.value)}>
              <option value="">Toutes</option>
              {unitsForUeFilter.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} — {u.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {showCapNotice ? (
          <p className="mt-3 text-xs font-medium rounded-lg border-2 border-red-600 bg-red-50 px-3 py-2 text-red-900 dark:border-red-500 dark:bg-red-950/70 dark:text-red-50">
            Affichage limité à {pageSizeByUe} matières pour le mode « Par UE ». Affinez les filtres ou passez en liste
            alphabétique paginée.
          </p>
        ) : null}
      </Card>

      <Card className="border border-zinc-200/90 dark:border-[var(--app-border)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-100 dark:border-[var(--app-border)] bg-zinc-50/80 dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {payload.count} matière{payload.count !== 1 ? 's' : ''}
            {viewMode === 'flat' ? (
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                {' '}
                · page {page} / {totalPages}
              </span>
            ) : null}
          </div>
          {loading ? <Spinner size="sm" /> : null}
        </div>

        <div className="overflow-x-auto">
          {viewMode === 'byUe' ? (
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-[var(--app-border)] bg-zinc-100/90 dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)] text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <th className="py-3 pl-4 pr-3 w-[14rem]">Unité d’enseignement</th>
                  <th className="py-3 pr-3 font-mono w-[7rem]">Code</th>
                  <th className="py-3 pr-3">Matière</th>
                  <th className="py-3 pr-3 w-[4rem] text-center">Cr.</th>
                  <th className="py-3 pr-3 w-[10rem]">Module</th>
                  <th className="py-3 pr-3 w-[5rem] text-center">Sem.</th>
                  <th className="py-3 pr-4 w-[7rem] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[var(--app-border)]">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-500 text-sm">
                      Aucun cours pour ces critères.
                    </td>
                  </tr>
                ) : (
                  groups.flatMap((g) =>
                    g.courses.map((c, idx) => (
                      <tr
                        key={c.id}
                        className="hover:bg-zinc-50/90 dark:hover:bg-[var(--app-nav-hover)] transition-colors border-b border-zinc-50 dark:border-[var(--app-border)]"
                      >
                        {idx === 0 ? (
                          <td
                            rowSpan={g.courses.length}
                            className="align-top py-3 pl-4 pr-3 border-r border-zinc-100 dark:border-[var(--app-border)] bg-zinc-50/50 dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]"
                          >
                            <div className="font-mono text-xs font-semibold text-brand-700 dark:text-brand-300">{g.ueCode}</div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">{g.ueName}</div>
                          </td>
                        ) : null}
                        <td className="py-2.5 pr-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{c.code}</td>
                        <td className="py-2.5 pr-3 text-zinc-900 dark:text-zinc-100">{c.name}</td>
                        <td className="py-2.5 pr-3 text-center tabular-nums text-zinc-600 dark:text-zinc-400">{c.credits}</td>
                        <td className="py-2.5 pr-3 text-xs text-zinc-500 dark:text-zinc-400">{c.module_label ?? '—'}</td>
                        <td className="py-2.5 pr-3 text-center text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                          {c.semester != null ? `S${c.semester}` : '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <Button
                            as={Link}
                            to={`/teacher/courses/${c.id}`}
                            variant="ghost"
                            size="sm"
                            className="text-brand-600 dark:text-brand-400"
                          >
                            Détail
                          </Button>
                        </td>
                      </tr>
                    )),
                  )
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-[var(--app-border)] bg-zinc-100/90 dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)] text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <th className="py-3 pl-4 pr-3 font-mono w-[7rem]">Code</th>
                  <th className="py-3 pr-3">Matière</th>
                  <th className="py-3 pr-3 w-[4rem] text-center">Cr.</th>
                  <th className="py-3 pr-3 w-[10rem]">UE</th>
                  <th className="py-3 pr-3 w-[10rem]">Module</th>
                  <th className="py-3 pr-3 w-[5rem] text-center">Sem.</th>
                  <th className="py-3 pr-4 w-[7rem] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[var(--app-border)]">
                {(payload.results ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-500 text-sm">
                      Aucun cours pour ces critères.
                    </td>
                  </tr>
                ) : (
                  (payload.results ?? []).map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-50/90 dark:hover:bg-[var(--app-nav-hover)] transition-colors border-b border-zinc-50 dark:border-[var(--app-border)]"
                    >
                      <td className="py-2.5 pl-4 pr-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{c.code}</td>
                      <td className="py-2.5 pr-3 text-zinc-900 dark:text-zinc-100">{c.name}</td>
                      <td className="py-2.5 pr-3 text-center tabular-nums text-zinc-600 dark:text-zinc-400">{c.credits}</td>
                      <td className="py-2.5 pr-3 text-xs">
                        <span className="font-mono text-brand-700 dark:text-brand-300">{c.teaching_unit_code}</span>
                        <span className="text-zinc-500 dark:text-zinc-400"> · {c.teaching_unit_name}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-zinc-500 dark:text-zinc-400">{c.module_label ?? '—'}</td>
                      <td className="py-2.5 pr-3 text-center text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                        {c.semester != null ? `S${c.semester}` : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <Button
                          as={Link}
                          to={`/teacher/courses/${c.id}`}
                          variant="ghost"
                          size="sm"
                          className="text-brand-600 dark:text-brand-400"
                        >
                          Détail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {viewMode === 'flat' && totalPages > 1 ? (
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-zinc-100 dark:border-[var(--app-border)] bg-zinc-50/50 dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={16} aria-hidden />
              Précédent
            </Button>
            <span className="text-xs text-zinc-500 tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
              <ChevronRight size={16} aria-hidden />
            </Button>
          </div>
        ) : null}
      </Card>

    </div>
  )
}
