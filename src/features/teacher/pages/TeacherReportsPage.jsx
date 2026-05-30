import { DetailedReportPage } from '@/features/teacherFacultyDashboard/report/DetailedReportPage'

export function TeacherReportsPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
          Reporting
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">
          Rapports
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
          Tableau statistique détaillé par niveau : effectifs, résultats académiques et abandons.
        </p>
      </header>

      <DetailedReportPage />
    </section>
  )
}
