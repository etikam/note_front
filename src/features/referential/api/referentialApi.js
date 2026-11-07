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

/** Promotions d'un programme et leur parcours d'une année à l'autre. */
export async function fetchProgramCohorts(identity, config) {
  const { data } = await apiClient.get(`${API_PREFIX}/academics/program-identities/${identity}/cohorts/`, config)
  return data
}

/** Sortants de l'année consultée (``programId`` pour un seul programme). */
export async function fetchGraduates(programId, config) {
  const { data } = await apiClient.get(`${API_PREFIX}/academics/graduates/`, { params: programId ? { program: programId } : {}, ...config })
  return data
}

export async function downloadGraduatesCsv(programId, filename) {
  const { data } = await apiClient.get(`${API_PREFIX}/academics/graduates/`, {
    params: { export: 'csv', ...(programId ? { program: programId } : {}) },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
