import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

/** Accueil du pilotage (année via l'en-tête ``X-Academic-Year-Id``). */
export async function fetchHomeDashboard() {
  const { data } = await apiClient.get(endpoints.reporting.homeDashboard, { skipErrorToast: true })
  return data
}
