import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { createOverviewFilters } from '@/features/teacherFacultyDashboard/overview/model/overviewFilterDefaults'

/**
 * Filtres (semestre, programme / département, niveau, inactifs) et chargement d'un agrégat
 * de reporting. Le périmètre proposé est celui de ``stats.view`` ; un périmètre réduit à une
 * entité fixe le filtre. ``fetcher(params)`` reçoit les paramètres d'API.
 *
 * @param {(params: Record<string, unknown>) => Promise<any>} fetcher
 * @param {{ academicYearId: string | null, enabled: boolean, errorMessage: string }} opts
 */
export function useReportData(fetcher, { academicYearId, enabled, errorMessage }) {
  const scopeOptions = useScopeOptions('stats.view', { enabled })
  const lockedScope = useMemo(() => defaultScope(scopeOptions), [scopeOptions])

  const [filters, setFilters] = useState(createOverviewFilters)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [levels, setLevels] = useState([])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setScope = useCallback(({ departmentId, programId }) => {
    setFilters((prev) => ({ ...prev, departmentId, programId, levelId: '' }))
  }, [])

  useEffect(() => {
    if (scopeOptions.loading || !(lockedScope.departmentId || lockedScope.programId)) return
    setFilters((prev) => (prev.departmentId || prev.programId ? prev : { ...prev, ...lockedScope }))
  }, [scopeOptions.loading, lockedScope])

  useEffect(() => {
    const { departmentId, programId } = filters
    if (!departmentId && !programId) {
      setLevels([])
      return undefined
    }
    let cancelled = false
    fetchLevels(programId ? { program: programId } : { department: departmentId })
      .then((lv) => !cancelled && setLevels(lv))
      .catch(() => !cancelled && setLevels([]))
    return () => {
      cancelled = true
    }
  }, [filters.departmentId, filters.programId]) // eslint-disable-line react-hooks/exhaustive-deps

  const apiParams = useMemo(
    () => ({
      semester: filters.semester || undefined,
      program: filters.programId || undefined,
      department: !filters.programId && filters.departmentId ? filters.departmentId : undefined,
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
      setData(await fetcher(apiParams))
    } catch (e) {
      setError(e?.message ?? errorMessage)
      setData(null)
    } finally {
      setLoading(false)
    }
    // ``academicYearId`` : l'année part dans l'en-tête de requête, on recharge quand elle change.
  }, [enabled, apiParams, academicYearId, fetcher, errorMessage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }
    const t = window.setTimeout(load, 300)
    return () => window.clearTimeout(t)
  }, [enabled, load])

  const resetFilters = useCallback(() => {
    setFilters({ ...createOverviewFilters(), ...lockedScope })
  }, [lockedScope])

  return {
    data,
    loading,
    error,
    reload: load,
    filters,
    setFilter,
    setScope,
    resetFilters,
    scopeOptions,
    levels,
  }
}
