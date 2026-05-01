import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

function normalizeListPayload(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchAcademicYears(config) {
  const { data } = await apiClient.get(endpoints.academics.academicYears, config)
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data)) return data
  return []
}

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchDepartments(config) {
  const { data } = await apiClient.get(endpoints.academics.departments, config)
  return normalizeListPayload(data)
}

/**
 * @param {{ department: string | number }} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchLevels(params, config) {
  const { data } = await apiClient.get(endpoints.academics.levels, {
    params,
    ...config,
  })
  return normalizeListPayload(data)
}

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchCohorts(config) {
  const { data } = await apiClient.get(endpoints.academics.cohorts, config)
  return normalizeListPayload(data)
}
