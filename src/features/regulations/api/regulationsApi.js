import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'

const BASE = `${API_PREFIX}/regulations`
const quiet = { skipErrorToast: true }

/** Règlement d'une année : règles de l'établissement, exceptions par programme, verrou, historique. */
export async function fetchRegulation(yearId) {
  const { data } = await apiClient.get(`${BASE}/${yearId}/`, quiet)
  return data
}

/** Renvoie le règlement à jour et ``recomputed`` (notes recalculées). */
export async function saveYearRules(yearId, rules, comment = '') {
  const { data } = await apiClient.put(`${BASE}/${yearId}/`, { rules, comment }, quiet)
  return data
}

export async function saveProgramOverrides(yearId, programId, overrides, comment = '') {
  const { data } = await apiClient.put(`${BASE}/${yearId}/programs/${programId}/`, { overrides, comment }, quiet)
  return data
}

export async function setRegulationLocked(yearId, locked, comment = '') {
  const { data } = await apiClient.post(`${BASE}/${yearId}/${locked ? 'lock' : 'unlock'}/`, { comment }, quiet)
  return data
}
