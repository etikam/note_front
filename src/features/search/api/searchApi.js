import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

/** Recherche globale : ``{ students, teachers, courses, programs, departments }`` (6 max. par groupe). */
export async function globalSearch(q, { signal } = {}) {
  const { data } = await apiClient.get(endpoints.academics.search, { params: { q }, signal, skipErrorToast: true })
  return data
}
