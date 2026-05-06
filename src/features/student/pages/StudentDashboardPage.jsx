import { useEffect, useRef } from 'react'
import { BookOpen, GraduationCap, LineChart, ListChecks } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useGrades } from '@/features/grades/hooks/useGrades'
import { useEnrollments } from '@/features/enrollment/hooks/useEnrollments'
import { Button } from '@/shared/ui/Button'
import { PageLoading } from '@/shared/ui/Spinner'

function KpiCard({ label, valeur, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary-500/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 dark:text-secondary-300 dark:ring-secondary-500/20">
          <Icon size={17} strokeWidth={2} aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums tracking-tight text-[var(--app-fg)]">{valeur}</p>
    </div>
  )
}

export function StudentDashboardPage() {
  const { user } = useAuth()
  const { academicYearId, academicYearLabel } = useAcademicYear()

  const inscriptionsHook = useEnrollments(
    academicYearId ? { academic_year: academicYearId } : {}
  )
  const notesHook = useGrades(
    academicYearId ? { academic_year: academicYearId } : {}
  )

  const prevAnnee = useRef(academicYearId)
  useEffect(() => {
    if (academicYearId && academicYearId !== prevAnnee.current) {
      const filtres = { academic_year: academicYearId }
      inscriptionsHook.setParams(filtres)
      notesHook.setParams(filtres)
    }
    prevAnnee.current = academicYearId
  }, [academicYearId])

  if (inscriptionsHook.loading || notesHook.loading) return <PageLoading />

  if (inscriptionsHook.error || notesHook.error) {
    const retenter = () => {
      inscriptionsHook.reload()
      notesHook.reload()
    }
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-sm text-[var(--app-muted)]">Impossible de charger vos données.</p>
        <Button variant="soft" size="sm" onClick={retenter}>Réessayer</Button>
      </div>
    )
  }

  const listeInscriptions = inscriptionsHook.data?.results ?? inscriptionsHook.data ?? []
  const listeNotes = notesHook.data?.results ?? notesHook.data ?? []

  const approuvees = listeInscriptions.filter(i => i.status === 'approved').length
  const enAttente = listeInscriptions.filter(i => i.status === 'pending').length

  const notesPubliees = listeNotes.filter(n => n.published)
  const nbPubliees = notesPubliees.length
  const moyenneCalc = nbPubliees > 0
    ? (notesPubliees.reduce((acc, n) => acc + n.score, 0) / nbPubliees).toFixed(2)
    : '0.00'

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]"
          aria-hidden
        />
        <div className="relative p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
            Espace étudiant{academicYearLabel ? ` · ${academicYearLabel}` : ''}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">
            Bienvenue, {user?.full_name ?? 'Étudiant'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
            Matricule{' '}
            <span className="font-medium text-[var(--app-fg)]">{user?.matricule ?? '—'}</span>
            {' — '}Retrouvez ici vos inscriptions et vos notes publiées.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Inscriptions approuvées" valeur={approuvees} icon={ListChecks} />
        <KpiCard label="Inscriptions en attente" valeur={enAttente} icon={GraduationCap} />
        <KpiCard label="Notes publiées" valeur={nbPubliees} icon={BookOpen} />
        <KpiCard label="Moyenne générale" valeur={`${moyenneCalc} /10`} icon={LineChart} />
      </div>
    </div>
  )
}
