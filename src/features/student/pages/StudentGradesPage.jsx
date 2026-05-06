import { useEffect, useRef, useState } from 'react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useGrades } from '@/features/grades/hooks/useGrades'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { PageLoading } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

export function StudentGradesPage() {
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [semestreActif, setSemestreActif] = useState('tous')

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
        <p className="text-sm text-[var(--app-muted)]">Impossible de charger vos notes.</p>
        <Button variant="soft" size="sm" onClick={notesHook.reload}>Réessayer</Button>
      </div>
    )
  }

  const notes = notesHook.data?.results ?? notesHook.data ?? []

  const semestresMap = new Map()
  for (const n of notes) {
    const sem = n.course?.semester
    if (sem && !semestresMap.has(sem.id)) semestresMap.set(sem.id, sem.name)
  }
  const semestresDistincts = [...semestresMap.entries()].sort((a, b) => a[0] - b[0])
  const afficherFiltre = semestresDistincts.length >= 2

  const notesVisibles = semestreActif === 'tous'
    ? notes
    : notes.filter(n => String(n.course?.semester?.id) === semestreActif)

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
              Relevé de notes{academicYearLabel ? ` · ${academicYearLabel}` : ''}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">
              Mes notes
            </h1>
          </div>
          {afficherFiltre && (
            <select
              value={semestreActif}
              onChange={e => setSemestreActif(e.target.value)}
              className={cn(
                'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 text-sm text-[var(--app-fg)]',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400',
                'transition-colors'
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

      {notesVisibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] py-16 text-center">
          <p className="text-sm text-[var(--app-muted)]">Aucune note publiée pour ce semestre.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] bg-[var(--app-canvas)]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">Cours</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">Semestre</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">Crédits</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">Note</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">Mention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {notesVisibles.map(note => {
                  const ratio = note.max_score > 0 ? note.score / note.max_score : 0
                  const valide = ratio >= 0.5
                  return (
                    <tr key={note.id} className="transition-colors hover:bg-[var(--app-canvas)]/50">
                      <td className="px-4 py-3 font-medium text-[var(--app-fg)]">{note.course?.name}</td>
                      <td className="px-4 py-3 text-[var(--app-muted)]">{note.course?.semester?.name}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-[var(--app-fg)]">{note.course?.credits}</td>
                      <td className="px-4 py-3 text-center tabular-nums font-semibold text-[var(--app-fg)]">
                        {note.score} / {note.max_score}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={valide ? 'success' : 'danger'}>
                          {valide ? 'Validé' : 'Non validé'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col divide-y divide-[var(--app-border)] sm:hidden">
            {notesVisibles.map(note => {
              const ratio = note.max_score > 0 ? note.score / note.max_score : 0
              const valide = ratio >= 0.5
              return (
                <div key={note.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[var(--app-fg)]">{note.course?.name}</p>
                    <Badge tone={valide ? 'success' : 'danger'}>
                      {valide ? 'Validé' : 'Non validé'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--app-muted)]">
                    <span>{note.course?.semester?.name}</span>
                    <span>{note.course?.credits} crédit{note.course?.credits > 1 ? 's' : ''}</span>
                    <span className="font-semibold tabular-nums text-[var(--app-fg)]">
                      {note.score} / {note.max_score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
