import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { fetchTeachersList, fetchTeachersStats } from '@/features/teacher/faculty/api/teachersApi'

const DEFAULT_PAGE_SIZE = 20
export const TEACHER_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function buildTeacherListParams({ page, pageSize, ordering, debouncedQ, status }) {
  return {
    page,
    page_size: pageSize,
    ordering,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(status ? { status } : {}),
  }
}

function buildTeacherStatsParams({ debouncedQ, status }) {
  return {
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(status ? { status } : {}),
  }
}

/**
 * Liste paginée enseignants (dashboard RH) : tri, taille de page, stats, lazy optionnel.
 * @param {{ listEnabled?: boolean }} [opts]
 */
export function useTeacherDirectoryList(opts = {}) {
  const { listEnabled = true } = opts
  const { user } = useAuth()
  const canViewAggregatedStats = Boolean(user?.capabilities?.can_view_directory_aggregated_stats)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [ordering, setOrdering] = useState('-created_at')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('')

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
  }, [debouncedQ, status, pageSize, ordering])

  const listParams = useMemo(
    () => buildTeacherListParams({ page, pageSize, ordering, debouncedQ, status }),
    [page, pageSize, ordering, debouncedQ, status],
  )

  const statsParams = useMemo(
    () => buildTeacherStatsParams({ debouncedQ, status }),
    [debouncedQ, status],
  )

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

  return {
    q,
    setQ,
    status,
    setStatus,
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
