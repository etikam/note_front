import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

export async function fetchStudentMe(config) {
  const { data } = await apiClient.get(endpoints.students.me, config)
  return data
}

export async function fetchStudentProfile(config) {
  const { data } = await apiClient.get(endpoints.students.profile, config)
  return data
}

export async function patchStudentProfile(body, config) {
  const { data } = await apiClient.patch(endpoints.students.profile, body, config)
  return data
}

export async function postOnboardingComplete(body, config) {
  const { data } = await apiClient.post(endpoints.students.onboardingComplete, body, config)
  return data
}

export async function fetchStudentStats(config) {
  const { data } = await apiClient.get(endpoints.students.meStats, config)
  return data
}

export async function fetchStudentCourses(params, config) {
  const { data } = await apiClient.get(endpoints.students.meCourses, { params, ...config })
  return data
}

export async function fetchStudentGrades(params, config) {
  const { data } = await apiClient.get(endpoints.students.meGrades, { params, ...config })
  return data
}

export async function fetchStudentEnrollments(params, config) {
  const { data } = await apiClient.get(endpoints.students.meEnrollments, { params, ...config })
  return data
}

export async function postStudentEnrollment(body, config) {
  const { data } = await apiClient.post(endpoints.students.meEnrollments, body, config)
  return data
}

export async function fetchEnrollmentCandidates(params, config) {
  const { data } = await apiClient.get(endpoints.students.meEnrollmentCandidates, { params, ...config })
  return data
}

export async function fetchStudentCohort(config) {
  const { data } = await apiClient.get(endpoints.students.meCohort, config)
  return data
}

export async function fetchCourseDetail(courseId, config) {
  const { data } = await apiClient.get(endpoints.academics.courseDetail(courseId), config)
  return data
}

export async function fetchCourseArchives(courseId, config) {
  const { data } = await apiClient.get(endpoints.academics.courseArchives(courseId), config)
  return data
}
