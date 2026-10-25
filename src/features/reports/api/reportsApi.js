import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'

const BASE = `${API_PREFIX}/reporting/reports`
const quiet = { skipErrorToast: true }

/** PV de délibération d'un niveau (année de l'en-tête), éventuellement d'un semestre. */
export async function fetchDeliberation({ level, semester }) {
  const { data } = await apiClient.get(`${BASE}/deliberation/`, { params: { level, ...(semester ? { semester } : {}) }, ...quiet })
  return data
}

export async function fetchTranscript(studentId, { semester, allYears } = {}) {
  const { data } = await apiClient.get(`${BASE}/transcript/${studentId}/`, {
    params: { ...(semester ? { semester } : {}), ...(allYears ? { all_years: 1 } : {}) },
    ...quiet,
  })
  return data
}

export async function fetchCourseResults({ program, level } = {}) {
  const { data } = await apiClient.get(`${BASE}/course-results/`, { params: { ...(program ? { program } : {}), ...(level ? { level } : {}) }, ...quiet })
  return data
}

export async function fetchEntryProgress({ program } = {}) {
  const { data } = await apiClient.get(`${BASE}/entry-progress/`, { params: program ? { program } : {}, ...quiet })
  return data
}
