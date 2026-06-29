import { Search } from 'lucide-react'

import { useCohortGradesReport } from '@/features/teacher/students/grades/useCohortGradesReport'
import { LevelGradesTable } from '@/features/teacher/students/grades/ui/LevelGradesTable'
import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

const SELECT_BASE =
  'rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-sm text-zinc-900 dark:text-zinc-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow ' +
  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-brand-950/40'

const INPUT_BASE =
  'rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-sm text-zinc-900 dark:text-zinc-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-500'

export function TeacherStudentGradesPage() {
  const g = useCohortGradesReport()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-600 dark:text-secondary-400 mb-1.5">
          Gestion académique
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Relevé de notes
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
          Notes de tous les étudiants d&apos;une cohorte, par cours et par semestre.
        </p>
      </div>

      {/* Filtres principaux */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Département</label>
          <select
            className={cn(SELECT_BASE, 'h-10 px-3 min-w-[14rem]')}
            value={g.departmentId}
            onChange={(e) => g.setDepartmentId(e.target.value)}
            disabled={g.deptScoped || g.metaLoading}
          >
            <option value="">Tous les départements</option>
            {g.departments.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cohorte</label>
          <select
            className={cn(SELECT_BASE, 'h-10 px-3 min-w-[16rem]')}
            value={g.cohortId}
            onChange={(e) => g.setCohortId(e.target.value)}
            disabled={g.metaLoading}
          >
            <option value="">Choisir une cohorte</option>
            {g.cohorts.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres d'affinage (visibles après chargement) */}
      {g.report && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Matière</label>
            <select
              className={cn(SELECT_BASE, 'h-9 px-3 min-w-[14rem]')}
              value={g.selectedCourseId}
              onChange={(e) => g.setSelectedCourseId(e.target.value)}
            >
              <option value="">Toutes les matières</option>
              {g.courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  S{c.semesterNumber} · {c.tuName} · {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Recherche</label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <input
                type="text"
                className={cn(INPUT_BASE, 'h-9 pl-8 pr-3 min-w-[16rem]')}
                placeholder="Matricule, nom ou prénom…"
                value={g.searchQuery}
                onChange={(e) => g.setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {!g.cohortId ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Choisissez une cohorte pour afficher le relevé de notes.
        </div>
      ) : g.loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" label="Chargement du relevé" />
        </div>
      ) : g.error ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 px-5 py-4 text-sm text-red-700 dark:border-red-900/40 dark:text-red-200"
          role="alert"
        >
          <span>{g.error}</span>
          <button className="font-medium underline-offset-2 hover:underline" type="button" onClick={g.reload}>
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {g.report && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 -mb-2">
              {g.report.cohort.label}
              {g.report.department ? ` · ${g.report.department.name}` : ''}
              {` · ${g.report.students.length} étudiant${g.report.students.length > 1 ? 's' : ''}`}
            </p>
          )}
          <LevelGradesTable
            report={g.report}
            selectedCourseId={g.selectedCourseId}
            searchQuery={g.searchQuery}
          />
        </>
      )}
    </div>
  )
}
