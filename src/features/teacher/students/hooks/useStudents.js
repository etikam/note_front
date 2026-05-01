import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchCohorts, fetchDepartments, fetchLevels } from '@/features/academicYear/api/academicsApi'
import {
  fetchStudentsExportBlob,
  fetchStudentsList,
  fetchStudentsStats,
} from '@/features/teacher/students/api/studentsApi'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAuth } from '@/features/auth/model/AuthContext'
import { buildParams, PAGE_SIZE } from '@/features/teacher/students/studentList.constants'

/**
 * Annuaire étudiants : liste paginée, stats, filtres, export CSV.
 * @param {{ listEnabled?: boolean }} [opts] — `listEnabled: false` retarde le fetch jusqu’au viewport (lazy).
 */
export function useStudents(opts = {}) {
  const { listEnabled = true } = opts
  const { user } = useAuth()
  const managedDeptId = user?.scope?.managed_department_id ?? null
  const canViewAggregatedStats = Boolean(user?.capabilities?.can_view_directory_aggregated_stats)
  const { academicYears, isLoadingYears } = useAcademicYear()

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [departmentId, setDepartmentId] = useState('')
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

  const [departments, setDepartments] = useState([])
  const [levels, setLevels] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)
  const [cohorts, setCohorts] = useState([])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => window.clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (managedDeptId != null) setDepartmentId(String(managedDeptId))
  }, [managedDeptId])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, departmentId, levelId, status, filterAcademicYearId, cohorteId, pageSize, ordering])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMetaLoading(true)
      try {
        const [deptList, cohortList] = await Promise.all([fetchDepartments(), fetchCohorts()])
        if (!cancelled) {
          setDepartments(deptList)
          setCohorts(cohortList)
        }
      } catch {
        if (!cancelled) {
          setDepartments([])
          setCohorts([])
        }
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!departmentId) {
      setLevels([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchLevels({ department: departmentId })
        if (!cancelled) setLevels(list)
      } catch {
        if (!cancelled) setLevels([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [departmentId])

  useEffect(() => {
    setLevelId('')
  }, [departmentId])

  const listParams = useMemo(
    () =>
      buildParams({
        page,
        pageSize,
        ordering,
        debouncedQ,
        departmentId,
        levelId,
        status,
        filterAcademicYearId,
        cohorteId,
      }),
    [page, pageSize, ordering, debouncedQ, departmentId, levelId, status, filterAcademicYearId, cohorteId],
  )

  const statsParams = useMemo(
    () =>
      buildParams({
        page: 1,
        pageSize,
        ordering,
        debouncedQ,
        departmentId,
        levelId,
        status,
        filterAcademicYearId,
        cohorteId,
      }),
    [pageSize, ordering, debouncedQ, departmentId, levelId, status, filterAcademicYearId, cohorteId],
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
    setDepartmentId(managedDeptId != null ? String(managedDeptId) : '')
    setPage(1)
  }, [managedDeptId])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (debouncedQ) n++
    if (managedDeptId == null && departmentId) n++
    if (levelId) n++
    if (status) n++
    if (filterAcademicYearId) n++
    if (cohorteId) n++
    return n
  }, [debouncedQ, departmentId, levelId, status, filterAcademicYearId, cohorteId, managedDeptId])

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

  const deptScoped = managedDeptId != null

  return {
    academicYears,
    isLoadingYears,
    q,
    setQ,
    departmentId,
    setDepartmentId,
    levelId,
    setLevelId,
    status,
    setStatus,
    filterAcademicYearId,
    setFilterAcademicYearId,
    cohorteId,
    setCohorteId,
    cohorts,
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
    departments,
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
    deptScoped,
    canImport: Boolean(user?.capabilities?.can_import_data),
  }
}
