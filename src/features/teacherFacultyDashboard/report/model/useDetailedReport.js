import { useReportData } from '@/features/teacherFacultyDashboard/overview/model/useReportData'
import { fetchDetailedReport } from '@/features/teacherFacultyDashboard/report/api/detailedReportApi'

/**
 * Données et filtres pour la page Rapports (tableau détaillé par niveau).
 * @param {string | null} academicYearId
 * @param {boolean} enabled
 */
export function useDetailedReport(academicYearId, enabled) {
  return useReportData(fetchDetailedReport, {
    academicYearId,
    enabled,
    errorMessage: 'Impossible de charger le rapport détaillé.',
  })
}
