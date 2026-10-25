import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

const quiet = { skipErrorToast: true }

export async function createDepartment(body) {
  const { data } = await apiClient.post(endpoints.academics.departmentCreate, body, quiet)
  return data
}

export async function updateDepartment(id, body) {
  const { data } = await apiClient.patch(endpoints.academics.departmentDetail(id), body, quiet)
  return data
}

export async function deleteDepartment(id) {
  await apiClient.delete(endpoints.academics.departmentDetail(id), quiet)
}

export async function createProgram(body) {
  const { data } = await apiClient.post(endpoints.academics.programs, body, quiet)
  return data
}

export async function updateProgram(id, body) {
  const { data } = await apiClient.patch(endpoints.academics.programDetail(id), body, quiet)
  return data
}

export async function deleteProgram(id) {
  await apiClient.delete(endpoints.academics.programDetail(id), quiet)
}
