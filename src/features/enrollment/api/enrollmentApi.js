import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

/**
 * Liste des inscriptions (paramètres alignés sur le backend quand les routes seront exposées).
 * @param {Record<string, unknown>} [params]
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchEnrollmentList(params = {}, config = {}) {
  const { data } = await apiClient.get(endpoints.enrollment.list, {
    params,
    ...config,
  })
  return data
}
