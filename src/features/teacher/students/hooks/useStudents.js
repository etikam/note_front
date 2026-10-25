import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { fetchCohorts, fetchLevels } from '@/features/academicYear/api/academicsApi'
import { useAccess } from '@/features/access/model/useAccess'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { defaultScope, programIdsFor, scopeValue } from '@/features/access/model/scopeFilter'
import {
  fetchStudentsExportBlob,
  fetchStudentsList,
  fetchStudentsStats,
} from '@/features/teacher/students/api/studentsApi'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { buildParams, PAGE_SIZE } from '@/features/teacher/students/studentList.constants'

/**
 * Annuaire étudiants : liste paginée, stats, filtres, export CSV.
 * @param {{ listEnabled?: boolean }} [opts] — `listEnabled: false` retarde le fetch jusqu’au viewport (lazy).
 */
export function useStudents(opts = {}) {
  const { listEnabled = true } = opts
  const access = useAccess()
  const canViewAggregatedStats = access.can('stats.view')
  const { academicYears, isLoadingYears } = useAcademicYear()
  const scopeOptions = useScopeOptions('students.view')
  const [searchParams] = useSearchParams()

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [programId, setProgramId] = useState(() => searchParams.get('program') ?? '')
  const [levelId, setLevelId] = useState('')
  const [status, setStatus] = useState('')
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('')
  const [cohorteId, setCohorteId] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [ordering, setOrdering] = useState('-created_at')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)

  const [levels, setLevels] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)
  const [cohorts, setCohorts] = useState([])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => window.clearTimeout(t)
  }, [q])

  /** Périmètre réduit à une entité (chef de département, directeur de programme) : filtre imposé. */
  const lockedScope = useMemo(() => defaultScope(scopeOptions), [scopeOptions])
  const scopeLocked = Boolean(lockedScope.departmentId || lockedScope.programId)
  useEffect(() => {
    if (scopeOptions.loading || !scopeLocked) return
    if (!programId && !departmentId) {
      setDepartmentId(lockedScope.departmentId)
      setProgramId(lockedScope.programId)
    }
  }, [scopeOptions.loading, scopeLocked, lockedScope, programId, departmentId])

  const setScope = useCallback(({ departmentId: d, programId: p }) => {
    setDepartmentId(d)
    setProgramId(p)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, departmentId, programId, levelId, status, filterAcademicYearId, cohorteId, pageSize, ordering])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMetaLoading(true)
      try {
        const cohortList = await fetchCohorts()
        if (!cancelled) setCohorts(cohortList)
      } catch {
        if (!cancelled) setCohorts([])
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!departmentId && !programId) {
      setLevels([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchLevels(programId ? { program: programId } : { department: departmentId })
        if (!cancelled) setLevels(list)
      } catch {
        if (!cancelled) setLevels([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [departmentId, programId])

  useEffect(() => {
    setLevelId('')
    setCohorteId('')
  }, [departmentId, programId])

  const scopedCohorts = useMemo(() => {
    const ids = programIdsFor(scopeOptions, { departmentId, programId })
    return cohorts.filter((c) => ids.has(c.program))
  }, [cohorts, scopeOptions, departmentId, programId])

  const listParams = useMemo(
    () =>
      buildParams({
        page,
        pageSize,
        ordering,
        debouncedQ,
        departmentId,
        programId,
        levelId,
        status,
        filterAcademicYearId,
        cohorteId,
      }),
    [page, pageSize, ordering, debouncedQ, departmentId, programId, levelId, status, filterAcademicYearId, cohorteId],
  )

  const statsParams = useMemo(
    () =>
      buildParams({
        page: 1,
        pageSize,
        ordering,
        debouncedQ,
        departmentId,
        programId,
        levelId,
        status,
        filterAcademicYearId,
        cohorteId,
      }),
    [pageSize, ordering, debouncedQ, departmentId, programId, levelId, status, filterAcademicYearId, cohorteId],
  )

  const load = useCallback(async () => {
    if (canViewAggregatedStats) {
      try {
        const statsBody = await fetchStudentsStats(statsParams)
        setStats(statsBody)
      } catch {
        setStats(null)
      }
    } else {
      setStats(null)
    }
    if (!listEnabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const listBody = await fetchStudentsList(listParams)
      setData(listBody)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [listParams, statsParams, listEnabled, canViewAggregatedStats])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = useCallback(async () => {
    try {
      const res = await fetchStudentsExportBlob(statsParams)
      const blob =
        res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'etudiants_export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* Toast global via intercepteur Axios */
    }
  }, [statsParams])

  const resetFilters = useCallback(() => {
    setQ('')
    setDebouncedQ('')
    setLevelId('')
    setStatus('')
    setFilterAcademicYearId('')
    setCohorteId('')
    setDepartmentId(lockedScope.departmentId)
    setProgramId(lockedScope.programId)
    setPage(1)
  }, [lockedScope])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (debouncedQ) n++
    if ((departmentId || programId) && scopeValue({ departmentId, programId }) !== scopeValue(lockedScope)) n++
    if (levelId) n++
    if (status) n++
    if (filterAcademicYearId) n++
    if (cohorteId) n++
    return n
  }, [debouncedQ, departmentId, programId, levelId, status, filterAcademicYearId, cohorteId, lockedScope])

  const results = data?.results ?? []
  const count = data?.count ?? 0
  const next = data?.next
  const previous = data?.previous
  const totalPages = Math.max(1, Math.ceil(count / pageSize) || 1)
  const rangeStart = count === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, count)

  const pageNumbers = useMemo(() => {
    const windowSize = 5
    let start = Math.max(1, page - Math.floor(windowSize / 2))
    let end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)
    const arr = []
    for (let i = start; i <= end; i++) arr.push(i)
    return arr
  }, [page, totalPages])

  return {
    academicYears,
    isLoadingYears,
    q,
    setQ,
    departmentId,
    programId,
    setScope,
    scopeOptions,
    levelId,
    setLevelId,
    status,
    setStatus,
    filterAcademicYearId,
    setFilterAcademicYearId,
    cohorteId,
    setCohorteId,
    cohorts: scopedCohorts,
    filtersOpen,
    setFiltersOpen,
    page,
    setPage,
    pageSize,
    setPageSize,
    ordering,
    setOrdering,
    loading,
    error,
    load,
    stats,
    departments: scopeOptions.departments,
    levels,
    metaLoading,
    exportCsv,
    resetFilters,
    activeFilterCount,
    results,
    count,
    next,
    previous,
    totalPages,
    rangeStart,
    rangeEnd,
    pageNumbers,
    scopeLocked,
    canImport: access.canManage('students.import'),
  }
}
