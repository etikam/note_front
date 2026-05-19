import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

const listSkip = { skipErrorToast: true }

/**
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchStudentsList(params, config = {}) {
  const { data } = await apiClient.get(endpoints.students.list, {
    params,
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchStudentsStats(params, config = {}) {
  const { data } = await apiClient.get(endpoints.students.stats, {
    params,
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchStudentsExportBlob(params, config = {}) {
  return apiClient.get(endpoints.students.export, {
    params,
    responseType: 'blob',
    ...config,
  })
}

/**
 * @param {number} id
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchStudentDetail(id, config = {}) {
  const { data } = await apiClient.get(endpoints.students.detail(id), {
    skipErrorToast: true,
    ...config,
  })
  return data
}

/**
 * @param {number} id
 * @param {Record<string, unknown>} body
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function patchStudentDetail(id, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.students.detail(id), body, {
    skipErrorToast: true,
    ...config,
  })
  return data
}

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchStudentImportTemplateBlob(config = {}) {
  return apiClient.get(endpoints.students.importTemplate, {
    responseType: 'blob',
    skipErrorToast: true,
    ...config,
  })
}

/**
 * @param {FormData} formData
 * @param {Pick<import('axios').AxiosRequestConfig, 'headers' | 'onUploadProgress' | 'skipErrorToast'>} [config]
 */
export async function postStudentImport(formData, config = {}) {
  const { data } = await apiClient.post(endpoints.students.import, formData, {
    skipErrorToast: true,
    headers: { 'Content-Type': undefined },
    ...config,
  })
  return data
}

/**
 * @param {{ student_ids: number[], course_id: string }} body
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postStudentsBulkEnroll(body, config = {}) {
  const { data } = await apiClient.post(endpoints.students.bulkEnroll, body, {
    skipErrorToast: true,
    ...config,
  })
  return data
}
