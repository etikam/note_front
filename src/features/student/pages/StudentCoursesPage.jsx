import { useEffect, useRef, useState } from 'react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useEnrollments } from '@/features/enrollment/hooks/useEnrollments'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { PageLoading } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

const STATUT_CONFIG = {
  approved: { tone: 'success', label: 'Approuvé' },
  pending:  { tone: 'warning', label: 'En attente' },
  rejected: { tone: 'danger',  label: 'Refusé' },
}

export function StudentCoursesPage() {
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [semestreActif, setSemestreActif] = useState('tous')

  const inscriptionsHook = useEnrollments(
    academicYearId ? { academic_year: academicYearId } : {}
  )

  const prevAnnee = useRef(academicYearId)
  useEffect(() => {
    if (academicYearId && academicYearId !== prevAnnee.current) {
      inscriptionsHook.setParams({ academic_year: academicYearId })
    }
    prevAnnee.current = academicYearId
  }, [academicYearId])

  if (inscriptionsHook.loading) return <PageLoading />

  if (inscriptionsHook.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-sm text-[var(--app-muted)]">Impossible de charger vos inscriptions.</p>
        <Button variant="soft" size="sm" onClick={inscriptionsHook.reload}>Réessayer</Button>
      </div>
    )
  }

  const coursInscrits = inscriptionsHook.data?.results ?? inscriptionsHook.data ?? []

  const semestresMap = new Map()
  for (const insc of coursInscrits) {
    const sem = insc.course?.semester
    if (sem && !semestresMap.has(sem.id)) semestresMap.set(sem.id, sem.name)
  }
  const semestresDistincts = [...semestresMap.entries()].sort((a, b) => a[0] - b[0])
  const afficherFiltre = semestresDistincts.length >= 2

  const coursFiltres = semestreActif === 'tous'
    ? coursInscrits
    : coursInscrits.filter(insc => String(insc.course?.semester?.id) === semestreActif)

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
              Inscriptions{academicYearLabel ? ` · ${academicYearLabel}` : ''}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">Mes cours</h1>
          </div>
          {afficherFiltre && (
            <select
              value={semestreActif}
              onChange={e => setSemestreActif(e.target.value)}
              className={cn(
                'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 text-sm text-[var(--app-fg)]',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400'
              )}
            >
              <option value="tous">Tous les semestres</option>
              {semestresDistincts.map(([id, nom]) => (
                <option key={id} value={String(id)}>{nom}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {coursFiltres.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] py-16">
          <p className="text-sm text-[var(--app-muted)]">Aucune inscription pour ce semestre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coursFiltres.map(insc => {
            const cfg = STATUT_CONFIG[insc.status] ?? STATUT_CONFIG.pending
            return (
              <Card key={insc.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-[var(--app-fg)]">{insc.course?.name}</h3>
                  <Badge tone={cfg.tone}>{cfg.label}</Badge>
                </div>
                <div className="flex flex-col gap-1 text-xs text-[var(--app-muted)]">
                  <span>{insc.course?.semester?.name}</span>
                  <span>{insc.course?.credits} crédit{insc.course?.credits > 1 ? 's' : ''}</span>
                  <span>Enseignant : {insc.course?.teacher?.full_name ?? '—'}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
