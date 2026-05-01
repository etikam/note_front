import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchTeacherDashboardOverview(config = {}) {
  const { data } = await apiClient.get(endpoints.reporting.teacherDashboardOverview, {
    skipErrorToast: true,
    ...config,
  })
  return data
}
