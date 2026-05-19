import { useCallback, useEffect, useState } from 'react'

import {
  fetchEnrollmentCandidates,
  fetchStudentCourses,
  fetchStudentCohort,
  fetchStudentGrades,
  fetchStudentMe,
  fetchStudentProfile,
  fetchStudentStats,
} from '@/features/student/api/studentApi'

function useAsyncResource(loader, deps = [], enabled = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const result = await loader()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  return { data, loading, error, reload }
}

export function useStudentMe() {
  return useAsyncResource(() => fetchStudentMe())
}

export function useStudentProfile(enabled = true) {
  return useAsyncResource(() => fetchStudentProfile(), [enabled], enabled)
}

export function useStudentStats() {
  return useAsyncResource(() => fetchStudentStats())
}

export function useStudentCourses(params) {
  const paramsKey = JSON.stringify(params ?? {})
  return useAsyncResource(() => fetchStudentCourses(params), [paramsKey])
}

export function useStudentGrades(params) {
  const paramsKey = JSON.stringify(params ?? {})
  return useAsyncResource(() => fetchStudentGrades(params), [paramsKey])
}

export function useStudentCohort(enabled = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await fetchStudentCohort()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { data, loading, error }
}

export function useEnrollmentCandidates(q, enabled) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetchEnrollmentCandidates({ q: q || undefined, page_size: 50 })
        if (!cancelled) setData(res?.results ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [q, enabled])

  return { data, loading }
}
