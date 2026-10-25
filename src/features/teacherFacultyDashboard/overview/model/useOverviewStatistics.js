import { fetchDashboardStatistics } from '@/features/teacherFacultyDashboard/overview/api/overviewStatisticsApi'
import { useReportData } from '@/features/teacherFacultyDashboard/overview/model/useReportData'

/**
 * Données et filtres pour l'onglet Vue d'ensemble.
 * @param {string | null} academicYearId
 * @param {boolean} enabled
 */
export function useOverviewStatistics(academicYearId, enabled) {
  return useReportData(fetchDashboardStatistics, {
    academicYearId,
    enabled,
    errorMessage: 'Impossible de charger les statistiques.',
  })
}
