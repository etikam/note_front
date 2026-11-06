import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'

/** Ajout individuel d'un étudiant (niveau = programme et année). */
export async function createStudent(body) {
  const { data } = await apiClient.post(`${API_PREFIX}/students/`, body)
  return data
}

/** La vie d'un programme d'une année à l'autre. */
export async function fetchProgramHistory(identity, config) {
  const { data } = await apiClient.get(`${API_PREFIX}/academics/program-identities/${identity}/history/`, config)
  return data
}
