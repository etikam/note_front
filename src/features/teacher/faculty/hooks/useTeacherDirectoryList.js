import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAccess } from '@/features/access/model/useAccess'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { fetchTeachersList, fetchTeachersStats } from '@/features/teacher/faculty/api/teachersApi'

const DEFAULT_PAGE_SIZE = 20
export const TEACHER_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function buildTeacherListParams({ page, pageSize, ordering, debouncedQ, status, teacherRole, programId }) {
  return {
    page,
    page_size: pageSize,
    ordering,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(status ? { status } : {}),
    ...(teacherRole ? { teacher_role: teacherRole } : {}),
    ...(programId ? { program: programId } : {}),
  }
}

/** Sans le statut : les compteurs par statut (onglets) couvrent tout le filtre. */
function buildTeacherStatsParams({ debouncedQ, teacherRole, programId }) {
  return {
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(teacherRole ? { teacher_role: teacherRole } : {}),
    ...(programId ? { program: programId } : {}),
  }
}

/**
 * Liste paginée enseignants (dashboard RH) : tri, taille de page, stats, lazy optionnel.
 * @param {{ listEnabled?: boolean }} [opts]
 */
export function useTeacherDirectoryList(opts = {}) {
  const { listEnabled = true } = opts
  const access = useAccess()
  const canViewAggregatedStats = access.canManage('stats.view')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [ordering, setOrdering] = useState('-created_at')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('')
  const [teacherRole, setTeacherRole] = useState('')
  const [programId, setProgramId] = useState('')
  const scopeOptions = useScopeOptions('teachers.view')
  const lockedScope = useMemo(() => defaultScope(scopeOptions), [scopeOptions])

  useEffect(() => {
    if (scopeOptions.loading || !lockedScope.programId) return
    setProgramId((p) => p || lockedScope.programId)
  }, [scopeOptions.loading, lockedScope])

  /** Un département choisi = tous ses programmes : on ne filtre que sur un programme précis. */
  const setScope = useCallback(({ programId: p }) => setProgramId(p || ''), [])

  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => window.clearTimeout(t)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, status, teacherRole, programId, pageSize, ordering])

  const listParams = useMemo(
    () => buildTeacherListParams({ page, pageSize, ordering, debouncedQ, status, teacherRole, programId }),
    [page, pageSize, ordering, debouncedQ, status, teacherRole, programId],
  )

  const statsParams = useMemo(
    () => buildTeacherStatsParams({ debouncedQ, teacherRole, programId }),
    [debouncedQ, teacherRole, programId],
  )

  const resetFilters = useCallback(() => {
    setQ('')
    setStatus('')
    setTeacherRole('')
    setProgramId(lockedScope.programId)
  }, [lockedScope])

  const load = useCallback(async () => {
    if (canViewAggregatedStats) {
      try {
        const statsBody = await fetchTeachersStats(statsParams)
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
      const body = await fetchTeachersList(listParams)
      setData(body)
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

  const results = data?.results ?? []
  const count = data?.count ?? 0
  const next = Boolean(data?.next)
  const previous = Boolean(data?.previous)
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

  const activeFilterCount = useMemo(
    () => [teacherRole, programId && programId !== lockedScope.programId ? programId : ''].filter(Boolean).length,
    [teacherRole, programId, lockedScope],
  )

  return {
    q,
    setQ,
    status,
    setStatus,
    teacherRole,
    setTeacherRole,
    programId,
    setScope,
    scopeOptions,
    resetFilters,
    activeFilterCount,
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
    results,
    count,
    next,
    previous,
    pageNumbers,
    rangeStart,
    rangeEnd,
    totalPages,
  }
}
