import { useCallback, useEffect, useState } from 'react'

import { fetchEnrollmentList } from '@/features/enrollment/api/enrollmentApi'

/**
 * Chargement de la liste d’inscriptions (routes backend à finaliser).
 * @param {Record<string, unknown>} [initialParams]
 * @param {{ enabled?: boolean, skipErrorToast?: boolean }} [options]
 */
export function useEnrollments(initialParams = {}, options = {}) {
  const { enabled = true, skipErrorToast = false } = options
  const [params, setParams] = useState(initialParams)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body = await fetchEnrollmentList(params, skipErrorToast ? { skipErrorToast: true } : {})
      setData(body)
    } catch (e) {
      setError(e?.message ?? 'Impossible de charger les inscriptions.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, params, skipErrorToast])

  useEffect(() => {
    load()
  }, [load])

  return {
    data,
    loading,
    error,
    reload: load,
    params,
    setParams,
  }
}
