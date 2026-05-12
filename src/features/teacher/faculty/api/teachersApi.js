import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

const listSkip = { skipErrorToast: true }

/**
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchTeacherGrades(config = {}) {
  const { data } = await apiClient.get(endpoints.teachers.grades, {
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchTeachersList(params, config = {}) {
  const { data } = await apiClient.get(endpoints.teachers.list, {
    params,
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * Statistiques dashboard enseignants (mêmes filtres que la liste : q, status, teacher_role).
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchTeachersStats(params, config = {}) {
  const { data } = await apiClient.get(endpoints.teachers.stats, {
    params,
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {number} id
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchTeacherDetail(id, config = {}) {
  const { data } = await apiClient.get(endpoints.teachers.detail(id), {
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {Record<string, unknown>} body
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postTeacher(body, config = {}) {
  const { data } = await apiClient.post(endpoints.teachers.list, body, {
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
export async function patchTeacher(id, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.teachers.detail(id), body, {
    ...config,
  })
  return data
}

/**
 * @param {number} id
 * @param {File} file
 * @param {Pick<import('axios').AxiosRequestConfig, 'headers' | 'onUploadProgress' | 'skipErrorToast'>} [config]
 */
export async function patchTeacherPhoto(id, file, config = {}) {
  const formData = new FormData()
  formData.append('photo', file)
  const { data } = await apiClient.patch(endpoints.teachers.photo(id), formData, {
    skipErrorToast: true,
    ...config,
  })
  return data
}

/**
 * @param {number} id
 * @param {Pick<import('axios').AxiosRequestConfig, 'skipErrorToast'>} [config]
 */
export async function deleteTeacherPhoto(id, config = {}) {
  const { data } = await apiClient.delete(endpoints.teachers.photo(id), {
    skipErrorToast: true,
    ...config,
  })
  return data
}

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchTeacherImportTemplateBlob(config = {}) {
  return apiClient.get(endpoints.teachers.importTemplate, {
    responseType: 'blob',
    skipErrorToast: true,
    ...config,
  })
}

/**
 * @param {FormData} formData
 * @param {Pick<import('axios').AxiosRequestConfig, 'headers' | 'onUploadProgress' | 'skipErrorToast'>} [config]
 */
export async function postTeacherImport(formData, config = {}) {
  const { data } = await apiClient.post(endpoints.teachers.import, formData, {
    skipErrorToast: true,
    headers: { 'Content-Type': undefined },
    ...config,
  })
  return data
}

/**
 * @param {number} teacherId
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchTeacherCoursesSplit(teacherId, config = {}) {
  const { data } = await apiClient.get(endpoints.teachers.courses(teacherId), {
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {number} teacherId
 * @param {string} courseId
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postTeacherCourseAssign(teacherId, courseId, config = {}) {
  const { data } = await apiClient.post(endpoints.teachers.courseAssign(teacherId, courseId), {}, config)
  return data
}

/**
 * @param {number} teacherId
 * @param {string} courseId
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function deleteTeacherCourseAssign(teacherId, courseId, config = {}) {
  await apiClient.delete(endpoints.teachers.courseAssign(teacherId, courseId), config)
}
