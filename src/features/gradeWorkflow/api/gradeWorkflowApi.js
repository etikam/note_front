import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

const quiet = { skipErrorToast: true }

/** État de la fiche de notes d'un cours : statut, étapes, droits, contrôles, historique. */
export async function fetchGradeSheet(courseId) {
  const { data } = await apiClient.get(endpoints.academics.gradeSheet(courseId), quiet)
  return data
}

/** ``submit`` | ``approve`` | ``reject`` | ``unpublish`` | ``republish`` — renvoie la fiche à jour. */
export async function gradeSheetAction(courseId, action, comment = '') {
  const { data } = await apiClient.post(endpoints.academics.gradeSheetAction(courseId, action), { comment }, quiet)
  return data
}

export async function fetchValidationCircuit() {
  const { data } = await apiClient.get(endpoints.grades.circuit, quiet)
  return data.steps ?? []
}

export async function saveValidationCircuit(steps) {
  const { data } = await apiClient.put(endpoints.grades.circuit, { steps }, quiet)
  return data.steps ?? []
}

export async function fetchReviewQueue() {
  const { data } = await apiClient.get(endpoints.grades.reviewQueue, quiet)
  return Array.isArray(data) ? data : []
}
