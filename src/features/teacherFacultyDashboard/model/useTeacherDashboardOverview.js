import { useCallback, useEffect, useState } from 'react'

import { fetchTeacherDashboardOverview } from '@/features/reporting/api/reportingApi'

/**
 * Données agrégées pour l’onglet Vue d’ensemble (reporting/dashboard/overview/).
 */
export function useTeacherDashboardOverview(academicYearId, enabled) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Année : header X-Academic-Year-Id (intercepteur apiClient + localStorage), pas de query string.
      const body = await fetchTeacherDashboardOverview()
      setData(body)
    } catch (e) {
      setError(e?.message ?? 'Impossible de charger le tableau de bord.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [academicYearId, enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    load()
  }, [enabled, load])

  return { data, loading, error, reload: load }
}
