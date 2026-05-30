import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

/**
 * Rapport détaillé par niveau (inscrits, évalués, admis, dettes, abandons).
 * Année académique : header X-Academic-Year-Id (intercepteur apiClient).
 *
 * @param {{
 *   semester?: string | number,
 *   department?: string | number,
 *   level?: string | number,
 *   include_inactive?: boolean,
 * }} params
 */
export async function fetchDetailedReport(params = {}, config = {}) {
  const query = {}
  if (params.semester != null && params.semester !== '') {
    query.semester = params.semester
  }
  if (params.department != null && params.department !== '') {
    query.department = params.department
  }
  if (params.level != null && params.level !== '') {
    query.level = params.level
  }
  if (params.include_inactive) {
    query.include_inactive = 'true'
  }
  const { data } = await apiClient.get(endpoints.reporting.teacherDashboardReport, {
    params: query,
    skipErrorToast: true,
    ...config,
  })
  return data
}
