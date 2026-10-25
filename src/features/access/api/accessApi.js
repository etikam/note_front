import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

const quiet = { skipErrorToast: true }

function list(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export async function fetchAccessCatalog() {
  const { data } = await apiClient.get(endpoints.access.catalog, quiet)
  return data
}

export async function fetchRoles() {
  const { data } = await apiClient.get(endpoints.access.roles, quiet)
  return list(data)
}

export async function createRole(body) {
  const { data } = await apiClient.post(endpoints.access.roles, body, quiet)
  return data
}

export async function updateRole(id, body) {
  const { data } = await apiClient.patch(endpoints.access.role(id), body, quiet)
  return data
}

export async function deleteRole(id) {
  await apiClient.delete(endpoints.access.role(id), quiet)
}

/** @param {{ status?: string, role?: string, teacher?: number, department?: number, program?: number, page?: number, page_size?: number }} params */
export async function fetchAssignments(params = {}) {
  const { data } = await apiClient.get(endpoints.access.assignments, { params: { page_size: 200, ...params }, ...quiet })
  return { results: list(data), count: data?.count ?? list(data).length }
}

export async function fetchAssignment(id) {
  const { data } = await apiClient.get(endpoints.access.assignment(id), quiet)
  return data
}

export async function createAssignment(body) {
  const { data } = await apiClient.post(endpoints.access.assignments, body, quiet)
  return data
}

export async function updateAssignment(id, body) {
  const { data } = await apiClient.patch(endpoints.access.assignment(id), body, quiet)
  return data
}

export async function revokeAssignment(id) {
  const { data } = await apiClient.post(endpoints.access.revoke(id), {}, quiet)
  return data
}

export async function fetchCandidates(q) {
  const { data } = await apiClient.get(endpoints.access.candidates, { params: { q }, ...quiet })
  return list(data)
}

export async function fetchStructureTree() {
  const { data } = await apiClient.get(endpoints.academics.structure, quiet)
  return data
}

const GENERIC_MESSAGES = new Set(['Une erreur est survenue', 'Données invalides.'])

/** Message lisible depuis une erreur API normalisée (``HttpError``) : le motif métier renvoyé par le serveur. */
export function apiErrorMessage(err, fallback = 'Opération impossible.') {
  const data = err?.details ?? err?.response?.data
  const serverMessage = data && typeof data === 'object' && typeof data.message === 'string' ? data.message : null
  if (serverMessage && !GENERIC_MESSAGES.has(serverMessage)) return serverMessage
  return err?.message || fallback
}
