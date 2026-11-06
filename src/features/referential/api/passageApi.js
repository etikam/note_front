import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'

const base = `${API_PREFIX}/academics`

/** Simulation du passage de ``parity`` pour l'année ``yearId``. */
export async function fetchPassagePreview(yearId, parity, config) {
  const { data } = await apiClient.get(`${base}/academic-years/${yearId}/passage/`, { params: { parity }, ...config })
  return data
}

/** @param {{ parity: 'odd'|'even', overrides?: Record<string, {action: string, justification?: string}>, note?: string, enroll?: boolean }} body */
export async function postPassage(yearId, body) {
  const { data } = await apiClient.post(`${base}/academic-years/${yearId}/passage/`, body)
  return data
}

export async function fetchPassages(yearId, config) {
  const { data } = await apiClient.get(`${base}/passages/`, { params: yearId ? { academic_year: yearId } : {}, ...config })
  return data
}

export async function fetchPassage(id, config) {
  const { data } = await apiClient.get(`${base}/passages/${id}/`, config)
  return data
}

/** Télécharge le rapport CSV d'un passage. */
export async function downloadPassageCsv(id, filename) {
  const { data } = await apiClient.get(`${base}/passages/${id}/`, { params: { export: 'csv' }, responseType: 'blob' })
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
