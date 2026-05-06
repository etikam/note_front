import { useEffect, useRef } from 'react'
import { TrendingDown, TrendingUp, CheckCircle } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useGrades } from '@/features/grades/hooks/useGrades'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { PageLoading } from '@/shared/ui/Spinner'

function StatCard({ label, valeur, icon: Icon, couleurIcone }) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${couleurIcone}`}>
          <Icon size={16} strokeWidth={2} aria-hidden />
        </span>
      </div>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums tracking-tight text-[var(--app-fg)]">{valeur}</p>
    </Card>
  )
}

export function StudentStatsPage() {
  const { academicYearId, academicYearLabel } = useAcademicYear()

  const notesHook = useGrades({
    published: true,
    ...(academicYearId ? { academic_year: academicYearId } : {}),
  })

  const prevAnnee = useRef(academicYearId)
  useEffect(() => {
    if (academicYearId && academicYearId !== prevAnnee.current) {
      notesHook.setParams({ published: true, academic_year: academicYearId })
    }
    prevAnnee.current = academicYearId
  }, [academicYearId])

  if (notesHook.loading) return <PageLoading />

  if (notesHook.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-sm text-[var(--app-muted)]">Impossible de charger vos statistiques.</p>
        <Button variant="soft" size="sm" onClick={notesHook.reload}>Réessayer</Button>
      </div>
    )
  }

  const notesPubliees = (notesHook.data?.results ?? notesHook.data ?? []).filter(n => n.published)
  const totalNotes = notesPubliees.length

  if (totalNotes === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] py-16">
        <p className="text-sm text-[var(--app-muted)]">Aucune note publiée pour calculer des statistiques.</p>
      </div>
    )
  }

  const sommeScores = notesPubliees.reduce((acc, n) => acc + n.score, 0)
  const moyenneGenerale = (sommeScores / totalNotes).toFixed(2)
  const noteMax = Math.max(...notesPubliees.map(n => n.score))
  const noteMin = Math.min(...notesPubliees.map(n => n.score))
  const coursValides = notesPubliees.filter(n => n.max_score > 0 && n.score / n.max_score >= 0.5).length
  const tauxValidation = Math.round((coursValides / totalNotes) * 100)

  // Répartition par semestre
  const parSemestre = new Map()
  for (const n of notesPubliees) {
    const semId = n.course?.semester?.id
    const semNom = n.course?.semester?.name ?? `Semestre ${semId}`
    if (!semId) continue
    if (!parSemestre.has(semId)) parSemestre.set(semId, { nom: semNom, scores: [], maxScore: 0 })
    const bucket = parSemestre.get(semId)
    bucket.scores.push(n.score)
    if (n.max_score > bucket.maxScore) bucket.maxScore = n.max_score
  }
  const semestresStats = [...parSemestre.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, { nom, scores, maxScore }]) => ({
      id, nom, maxScore, nbCours: scores.length,
      moyenne: scores.reduce((a, s) => a + s, 0) / scores.length,
    }))

  return (
    <div className="flex flex-col gap-6">
      {/* Hero — moyenne générale */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]" aria-hidden />
        <div className="relative flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
            Moyenne générale{academicYearLabel ? ` · ${academicYearLabel}` : ''}
          </p>
          <p className="font-heading text-5xl font-bold tabular-nums tracking-tight text-[var(--app-fg)] sm:text-6xl">{moyenneGenerale}</p>
          <p className="text-sm text-[var(--app-muted)]">sur 10 — {totalNotes} cours évalué{totalNotes > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Meilleure note" valeur={`${noteMax} /10`} icon={TrendingUp} couleurIcone="bg-brand-500/10 text-brand-600 dark:text-brand-400" />
        <StatCard label="Note la plus basse" valeur={`${noteMin} /10`} icon={TrendingDown} couleurIcone="bg-red-500/10 text-red-600 dark:text-red-400" />
        <StatCard label="Cours validés" valeur={`${coursValides} / ${totalNotes}`} icon={CheckCircle} couleurIcone="bg-secondary-500/10 text-secondary-600 dark:text-secondary-400" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--app-fg)]">Taux de validation</p>
          <p className="text-sm font-bold tabular-nums text-[var(--app-fg)]">{tauxValidation}%</p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--app-border)]">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${tauxValidation}%` }} />
        </div>
      </Card>

      {semestresStats.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">Moyenne par semestre</h2>
          <div className="mt-4 flex flex-col gap-4">
            {semestresStats.map(sem => {
              const ratio = sem.maxScore > 0 ? (sem.moyenne / sem.maxScore) * 100 : 0
              return (
                <div key={sem.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--app-fg)]">{sem.nom}</span>
                    <span className="font-semibold tabular-nums text-[var(--app-fg)]">{sem.moyenne.toFixed(2)} / {sem.maxScore}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--app-border)]">
                    <div className="h-full rounded-full bg-secondary-500 transition-all duration-500" style={{ width: `${Math.min(ratio, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--app-muted)]">{sem.nbCours} cours</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
