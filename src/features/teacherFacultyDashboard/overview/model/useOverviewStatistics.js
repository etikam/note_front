import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchDepartments, fetchLevels } from '@/features/academicYear/api/academicsApi'
import { fetchDashboardStatistics } from '@/features/teacherFacultyDashboard/overview/api/overviewStatisticsApi'
import { createOverviewFilters } from '@/features/teacherFacultyDashboard/overview/model/overviewFilterDefaults'

/**
 * Données et filtres pour l'onglet Vue d'ensemble.
 * @param {string | null} academicYearId
 * @param {boolean} enabled
 * @param {{ managedDeptId?: number | null, institutionWide?: boolean }} scope
 */
export function useOverviewStatistics(academicYearId, enabled, scope = {}) {
  const { managedDeptId = null, institutionWide = false } = scope

  const [filters, setFilters] = useState(createOverviewFilters)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [departments, setDepartments] = useState([])
  const [levels, setLevels] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      if (key === 'departmentId') {
        return { ...prev, departmentId: value, levelId: '' }
      }
      return { ...prev, [key]: value }
    })
  }, [])

  useEffect(() => {
    if (institutionWide) return
    if (managedDeptId != null) {
      setFilters((prev) => ({ ...prev, departmentId: String(managedDeptId), levelId: '' }))
    }
  }, [managedDeptId, institutionWide])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMetaLoading(true)
      try {
        const deptList = await fetchDepartments()
        if (!cancelled) setDepartments(deptList)
      } catch {
        if (!cancelled) setDepartments([])
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!filters.departmentId) {
      setLevels([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const lv = await fetchLevels({ department: filters.departmentId })
        if (!cancelled) setLevels(lv)
      } catch {
        if (!cancelled) setLevels([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [filters.departmentId])

  const apiParams = useMemo(
    () => ({
      semester: filters.semester || undefined,
      department: filters.departmentId || undefined,
      level: filters.levelId || undefined,
      include_inactive: filters.includeInactive,
    }),
    [filters],
  )

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body = await fetchDashboardStatistics(apiParams)
      setData(body)
    } catch (e) {
      setError(e?.message ?? 'Impossible de charger les statistiques.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, apiParams, academicYearId])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const t = window.setTimeout(() => {
      load()
    }, 300)
    return () => window.clearTimeout(t)
  }, [enabled, load])

  const resetFilters = useCallback(() => {
    const base = createOverviewFilters()
    if (!institutionWide && managedDeptId != null) {
      base.departmentId = String(managedDeptId)
    }
    setFilters(base)
  }, [institutionWide, managedDeptId])

  return {
    data,
    loading,
    error,
    reload: load,
    filters,
    setFilter,
    resetFilters,
    departments,
    levels,
    metaLoading,
    deptScoped: !institutionWide && managedDeptId != null,
  }
}
