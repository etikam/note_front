import { Link } from 'react-router-dom'

import { useStudentCohort } from '@/features/student/hooks/useStudentResources'
import { StudentKpiCard } from '@/features/student/ui/StudentKpiCard'
import { StudentEmptyState } from '@/features/student/ui/StudentEmptyState'
import { StudentPageHeader } from '@/features/student/ui/StudentPageHeader'
import { Users } from 'lucide-react'
import { Spinner } from '@/shared/ui/Spinner'

export function StudentPromotionPage() {
  const { data, loading, error } = useStudentCohort(true)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Chargement de la promotion" />
      </div>
    )
  }

  if (error || !data?.cohorte_id) {
    return (
      <StudentEmptyState
        title="Promotion non disponible"
        description="Votre compte n'est pas rattaché à une cohorte ou vous n'êtes pas chef de promotion."
      />
    )
  }

  const counts = data.enrollment_status_counts ?? {}

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <StudentPageHeader
        title="Ma promotion"
        description={data.cohorte_label || 'Effectif de votre cohorte (sans notes des pairs).'}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StudentKpiCard label="Effectif" value={data.headcount ?? 0} icon={Users} />
        <StudentKpiCard label="Inscriptions en attente" value={counts.pending ?? 0} icon={Users} />
        <StudentKpiCard label="Inscriptions approuvées" value={counts.approved ?? 0} icon={Users} />
        <StudentKpiCard label="Inscriptions rejetées" value={counts.rejected ?? 0} icon={Users} />
      </div>

      <p className="text-sm">
        <Link to="/student/enrollments" className="font-semibold text-brand-700 dark:text-brand-200">
          Gérer mes inscriptions →
        </Link>
      </p>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Étudiants de la promotion</h2>
        <ul className="divide-y divide-[var(--app-border)] rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
          {(data.peers ?? []).map((peer) => (
            <li key={peer.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span>
                {peer.first_name} {peer.last_name}
                <span className="ml-2 font-mono text-xs text-[var(--app-muted)]">{peer.matricule}</span>
              </span>
              {peer.enrollment_pending_count > 0 ? (
                <span className="text-xs font-semibold text-secondary-700">
                  {peer.enrollment_pending_count} demande(s) en attente
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
