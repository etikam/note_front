import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

import { useStudentMe, useStudentStats } from '@/features/student/hooks/useStudentResources'
import { StudentMetricsScroll } from '@/features/student/ui/StudentMetricsScroll'
import { StudentPageHeader } from '@/features/student/ui/StudentPageHeader'
import { StudentQuickActions } from '@/features/student/ui/StudentQuickActions'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'

export function StudentDashboardPage() {
  const { data: me } = useStudentMe()
  const { data: stats, loading, error } = useStudentStats()

  useEffect(() => {
    if (error) dispatchToast({ type: 'error', message: error?.message ?? 'Impossible de charger les statistiques.' })
  }, [error])

  const pending = stats?.enrollments?.pending ?? 0
  const gradeSummary = stats?.grade_summary
  const cohorteLabel = stats?.cohorte_label ?? me?.cohorte_label ?? ''

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

      {pending > 0 ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-500/30 bg-secondary-500/10 px-4 py-3"
          role="status"
        >
          <p className="flex items-center gap-2 text-sm font-medium text-secondary-900 dark:text-secondary-100">
            <AlertCircle size={18} aria-hidden />
            {pending} demande{pending > 1 ? 's' : ''} d&apos;inscription en attente
          </p>
          <Button asChild variant="secondary" size="sm" className="min-h-[44px] shrink-0">
            <Link to="/student/enrollments">Voir</Link>
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Chargement de la synthèse" />
        </div>
      ) : (
        <StudentMetricsScroll summary={gradeSummary} cohorteLabel={cohorteLabel} />
      )}

      <StudentQuickActions canManagePromotion={Boolean(me?.capabilities?.can_manage_promotion)} />
    </div>
  )
}
