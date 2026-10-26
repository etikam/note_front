import { Navigate, useSearchParams } from 'react-router-dom'
import { BarChart3, ClipboardList, FileCheck2, Users } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { CourseResultsReport } from '@/features/reports/ui/CourseResultsReport'
import { DeliberationReport } from '@/features/reports/ui/DeliberationReport'
import { EntryProgressReport } from '@/features/reports/ui/EntryProgressReport'
import { DetailedReportPage } from '@/features/teacherFacultyDashboard/report/DetailedReportPage'
import { cn } from '@/shared/lib/cn'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusPill } from '@/shared/ui/StatusPill'

const REPORTS = [
  { id: 'deliberation', icon: FileCheck2, label: 'PV de délibération', description: 'Notes publiées d’un niveau, moyennes d’UE, crédits et décisions.', Component: DeliberationReport },
  { id: 'courses', icon: BarChart3, label: 'Résultats par cours', description: 'Moyennes, réussite, rattrapages et dettes de chaque cours.', Component: CourseResultsReport },
  { id: 'progress', icon: ClipboardList, label: 'Avancement de la saisie', description: 'Fiches en saisie, en validation ou publiées, notes manquantes.', Component: EntryProgressReport },
  { id: 'levels', icon: Users, label: 'Statistiques par niveau', description: 'Effectifs, admis, dettes et abandons par niveau et par sexe.', Component: DetailedReportPage },
]

/** Catalogue des rapports académiques ; le rapport ouvert est conservé dans l'URL (``?report=``). */
export default function ReportsPage() {
  const { academicYearLabel } = useAcademicYear()
  const [params, setParams] = useSearchParams()
  const current = REPORTS.find((r) => r.id === params.get('report')) ?? REPORTS[0]
  const Report = current.Component
  if (params.get('report') === 'transcript') return <Navigate to="/grades/transcripts" replace />

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        breadcrumbs={[{ label: 'Pilotage' }, { label: 'Rapports' }, { label: current.label }]}
        title="Rapports"
        description="Procès-verbaux de délibération établis sur les notes publiées, et rapports de pilotage de l’année. Les relevés sont dans Notes → Relevés de notes."
        meta={academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
      />

      <nav aria-label="Rapports" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {REPORTS.map((r) => {
          const active = r.id === current.id
          const Icon = r.icon
          return (
            <button
              key={r.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setParams({ report: r.id }, { replace: true })}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
                active ? 'border-brand-500 bg-brand-50/60 dark:border-brand-400 dark:bg-white/[0.05]' : 'border-[var(--app-border)] bg-[var(--app-elevated)] hover:border-[var(--app-border-strong)] hover:bg-[var(--app-hover)]',
              )}
            >
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white dark:bg-brand-500' : 'bg-[var(--app-subtle)] text-[var(--app-muted)]')}>
                <Icon size={15} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-[var(--app-fg)]">{r.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-[var(--app-muted)]">{r.description}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <Report key={current.id} />
    </div>
  )
}
