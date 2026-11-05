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

/** Retire les filtres vides. */
const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

/** Résultats par cours : ``{ department, program, level, semester }``. */
export async function fetchCourseResults(query = {}) {
  const { data } = await apiClient.get(`${BASE}/course-results/`, { params: clean(query), ...quiet })
  return data
}

export async function fetchEntryProgress(query = {}) {
  const { data } = await apiClient.get(`${BASE}/entry-progress/`, { params: clean(query), ...quiet })
  return data
}

/** Statistiques par niveau (décisions du règlement, ventilation filles / garçons). */
export async function fetchLevelStatistics(query = {}, { publishedOnly = true } = {}) {
  const { data } = await apiClient.get(`${BASE}/level-statistics/`, { params: { ...clean(query), published_only: publishedOnly ? 1 : 0 }, ...quiet })
  return data
}
