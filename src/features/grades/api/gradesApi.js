import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

/**
 * Liste des notes / relevés (paramètres selon l’API future).
 * @param {Record<string, unknown>} [params]
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchGradesList(params = {}, config = {}) {
  const { data } = await apiClient.get(endpoints.grades.list, {
    params,
    ...config,
  })
  return data
}
