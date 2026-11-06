import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'

const base = `${API_PREFIX}/academics`

/** Maquettes de l'année consultée (en-tête ``X-Academic-Year-Id``). */
export async function fetchCurricula(config) {
  const { data } = await apiClient.get(`${base}/curricula/`, config)
  return data
}

/** @param {number} programId @param {'validate' | 'reopen'} action */
export async function postCurriculumAction(programId, action, note = '') {
  const { data } = await apiClient.post(`${base}/programs/${programId}/curriculum/${action}/`, { note })
  return data
}

/** Changements entre l'année consultée et ``compare`` (par défaut l'année précédente). */
export async function fetchCurriculumDiff(compare, config) {
  const { data } = await apiClient.get(`${base}/curricula/diff/`, { params: compare ? { compare } : {}, ...config })
  return data
}

export async function fetchReconduction(yearId, source) {
  const { data } = await apiClient.get(`${base}/academic-years/${yearId}/reconduction/`, { params: source ? { source } : {} })
  return data
}

/** @param {{ source_year: number, programs: number[] | null, include_courses: boolean, include_teachers: boolean }} body */
export async function postReconduction(yearId, body) {
  const { data } = await apiClient.post(`${base}/academic-years/${yearId}/reconduction/`, body)
  return data
}

/** Message lisible d'une erreur d'API (enveloppe ``{ message, details }`` ou ``{ detail }``). */
export function apiErrorMessage(err, fallback = 'Opération impossible.') {
  const data = err?.response?.data
  const errors = data?.details?.errors ?? data?.errors
  if (Array.isArray(errors) && errors.length) return errors.join(' ')
  const details = data?.details
  if (details && typeof details === 'object') {
    const first = Object.values(details).flat().find((v) => typeof v === 'string')
    if (first) return first
  }
  return data?.message ?? data?.detail ?? err?.message ?? fallback
}
