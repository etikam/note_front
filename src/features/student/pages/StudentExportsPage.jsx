import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useGrades } from '@/features/grades/hooks/useGrades'
import { apiClient } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Spinner, PageLoading } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'

export function StudentExportsPage() {
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [enCoursExport, setEnCoursExport] = useState(false)

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

  async function lancerExport() {
    if (!academicYearId) return
    setEnCoursExport(true)
    try {
      const response = await apiClient.get('/api/v1/grades/export/', {
        params: { academic_year: academicYearId },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const lien = document.createElement('a')
      lien.href = url
      lien.setAttribute('download', `releve_${academicYearLabel ?? academicYearId}.pdf`)
      document.body.appendChild(lien)
      lien.click()
      lien.remove()
      window.URL.revokeObjectURL(url)
      dispatchToast({ type: 'success', message: 'Relevé téléchargé.' })
    } catch {
      dispatchToast({ type: 'error', message: 'Impossible de générer le relevé.' })
    } finally {
      setEnCoursExport(false)
    }
  }

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

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">
              Export{academicYearLabel ? ` · ${academicYearLabel}` : ''}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">Relevé de notes</h1>
          </div>
          {academicYearId ? (
            <Button variant="primary" size="sm" onClick={lancerExport} disabled={enCoursExport}>
              {enCoursExport
                ? <><Spinner size="sm" variant="inverse" /> Export en cours…</>
                : <><Download size={15} /> Télécharger en PDF</>}
            </Button>
          ) : (
            <p className="text-xs text-[var(--app-muted)]">Aucune année académique active.</p>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] py-16">
          <p className="text-sm text-[var(--app-muted)]">Aucune note publiée à exporter.</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {notes.map(note => (
                  <tr key={note.id} className="transition-colors hover:bg-[var(--app-canvas)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--app-fg)]">{note.course?.name}</td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">{note.course?.semester?.name}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-[var(--app-fg)]">{note.course?.credits}</td>
                    <td className="px-4 py-3 text-center tabular-nums font-semibold text-[var(--app-fg)]">{note.score} / {note.max_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col divide-y divide-[var(--app-border)] sm:hidden">
            {notes.map(note => (
              <div key={note.id} className="flex flex-col gap-1 p-4">
                <p className="font-medium text-[var(--app-fg)]">{note.course?.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--app-muted)]">
                  <span>{note.course?.semester?.name}</span>
                  <span>{note.course?.credits} crédit{note.course?.credits > 1 ? 's' : ''}</span>
                  <span className="font-semibold tabular-nums text-[var(--app-fg)]">{note.score} / {note.max_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
