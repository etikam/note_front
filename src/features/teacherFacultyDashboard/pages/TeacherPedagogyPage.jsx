import { Navigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { canAccessAcademie } from '@/core/accessControl'
import { PedagogyReferencePanel } from '@/features/teacherFacultyDashboard/pedagogy/PedagogyReferencePanel'

export function TeacherPedagogyPage() {
  const { user } = useAuth()
  const canAccess = canAccessAcademie(user)

  if (!canAccess) {
    return <Navigate to="/teacher/dashboard" replace />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]"
          aria-hidden
        />
        <div className="relative flex items-start gap-3 p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
            <BookOpen size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Référentiel</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">Académie</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
              Années, semestres calendaires, parcours semestriel licence (S1–S6), unités d’enseignement, cours et départements
              — alignés sur l’année du sélecteur global.
            </p>
          </div>
        </div>
      </div>
      <PedagogyReferencePanel syncUrl />
    </div>
  )
}
