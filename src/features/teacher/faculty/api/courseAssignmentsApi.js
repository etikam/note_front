import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

const listSkip = { skipErrorToast: true }

/**
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchCourseAssignmentsList(params, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseAssignments, {
    params,
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {{ course: string, teacher: number }} body
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postCourseAssignment(body, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.courseAssignments, body, {
    skipErrorToast: true,
    ...config,
  })
  return data
}

/**
 * @param {string} courseId
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function deleteCourseAssignment(courseId, config = {}) {
  await apiClient.delete(endpoints.academics.courseAssignmentUnassign(courseId), {
    ...config,
  })
}

/**
 * @param {string} courseId
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchCourseAssignmentDetail(courseId, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseAssignmentUnassign(courseId), {
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {Record<string, unknown>} params
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchCourseAssignmentModules(params, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseAssignmentModules, {
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
export async function fetchCourseAssignmentCandidates(params, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseAssignmentCandidates, {
    params,
    ...listSkip,
    ...config,
  })
  return data
}

/**
 * @param {Record<string, unknown>} [params]
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchCourseAssignmentTeachers(params = {}, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseAssignmentTeachers, {
    params,
    ...listSkip,
    ...config,
  })
  return Array.isArray(data) ? data : data?.results ?? []
}

/**
 * @param {number} teacherId
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchCourseAssignmentTeacherPreview(teacherId, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseAssignmentTeacherPreview(teacherId), {
    ...listSkip,
    ...config,
  })
  return data
}
