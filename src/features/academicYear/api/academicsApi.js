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

/** Liste niveaux (gestion structure — authentifié). */
export async function fetchLevelsManage(config = {}) {
  const { data } = await apiClient.get(endpoints.academics.levelsManage, { skipErrorToast: true, ...config })
  return normalizeListPayload(data)
}

/** @param {Record<string, unknown>} body */
export async function postLevelManage(body, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.levelsManage, body, { skipErrorToast: true, ...config })
  return data
}

/** @param {number} id @param {Record<string, unknown>} body */
export async function patchLevelManage(id, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.academics.levelsManageDetail(id), body, {
    skipErrorToast: true,
    ...config,
  })
  return data
}

/** @param {number} id */
export async function deleteLevelManage(id, config = {}) {
  await apiClient.delete(endpoints.academics.levelsManageDetail(id), { skipErrorToast: true, ...config })
}

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchCohorts(config) {
  const { data } = await apiClient.get(endpoints.academics.cohorts, config)
  return normalizeListPayload(data)
}
