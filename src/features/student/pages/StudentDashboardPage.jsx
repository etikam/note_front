import { useEffect } from 'react'

import { useStudentMe, useStudentStats } from '@/features/student/hooks/useStudentResources'
import { StudentDashboardFeed } from '@/features/student/ui/StudentDashboardFeed'
import { StudentMetricsScroll } from '@/features/student/ui/StudentMetricsScroll'
import { StudentPageHeader } from '@/features/student/ui/StudentPageHeader'
import { StudentQuickActions } from '@/features/student/ui/StudentQuickActions'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'

export function StudentDashboardPage() {
  const { data: me } = useStudentMe()
  const { data: stats, loading, error } = useStudentStats()

  useEffect(() => {
    if (error) dispatchToast({ type: 'error', message: error?.message ?? 'Impossible de charger les statistiques.' })
  }, [error])

  const gradeSummary = stats?.grade_summary
  const academicContext = stats?.academic_context

  return (
    <div className="flex flex-col gap-6 pb-20 md:gap-8 md:pb-6">
      <StudentPageHeader
        title={me ? `${me.first_name} ${me.last_name}` : 'Accueil'}
        description={
          [
            me?.matricule,
            me?.level_name,
            me?.current_academic_year?.year ? `Année ${me.current_academic_year.year}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Votre espace personnel'
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Chargement de la synthèse" />
        </div>
      ) : (
        <StudentMetricsScroll summary={gradeSummary} academicContext={academicContext} />
      )}

      <StudentDashboardFeed
        alerts={stats?.alerts}
        notifications={stats?.notifications}
        loading={loading}
      />

      <StudentQuickActions canManagePromotion={Boolean(me?.capabilities?.can_manage_promotion)} />
    </div>
  )
}
