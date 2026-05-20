import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import { postStudentEnrollment } from '@/features/student/api/studentApi'
import { useEnrollmentCandidates, useStudentCourses } from '@/features/student/hooks/useStudentResources'
import { ENROLLMENT_STATUS_UI, STUDENT_BADGE } from '@/features/student/student.constants'
import { StudentEmptyState } from '@/features/student/ui/StudentEmptyState'
import { StudentPageHeader } from '@/features/student/ui/StudentPageHeader'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

export function StudentEnrollmentsPage() {
  const { data, loading, reload } = useStudentCourses({ page_size: 100 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { data: candidates, loading: loadingCandidates } = useEnrollmentCandidates(search, drawerOpen)

  const rows = data?.results ?? []
  const grouped = {
    pending: rows.filter((r) => r.status === 'pending'),
    approved: rows.filter((r) => r.status === 'approved'),
    rejected: rows.filter((r) => r.status === 'rejected'),
  }

  const requestEnrollment = async (courseId) => {
    setSubmitting(true)
    try {
      await postStudentEnrollment({ course_id: courseId })
      dispatchToast({ type: 'success', message: 'Demande envoyée.' })
      setDrawerOpen(false)
      reload()
    } catch (err) {
      const msg = err?.message ?? err?.response?.data?.message ?? 'Demande impossible.'
      dispatchToast({ type: 'error', message: String(msg) })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!drawerOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <StudentPageHeader
        title="Inscriptions"
        description="Suivez vos demandes et inscrivez-vous aux cours ouverts."
        action={
          <Button type="button" className="min-h-[44px]" onClick={() => setDrawerOpen(true)}>
            <Plus size={18} className="mr-2" aria-hidden />
            Demander une inscription
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" label="Chargement" />
        </div>
      ) : rows.length === 0 ? (
        <StudentEmptyState title="Aucune inscription" description="Demandez votre première inscription à un cours." />
      ) : (
        Object.entries(grouped).map(([status, list]) =>
          list.length === 0 ? null : (
            <section key={status}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--app-muted)]">
                {ENROLLMENT_STATUS_UI[status]?.label ?? status}
              </h2>
              <ul className="space-y-2">
                {list.map((row) => {
                  const ui = ENROLLMENT_STATUS_UI[row.status] ?? ENROLLMENT_STATUS_UI.pending
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{row.course_name}</p>
                        <p className="text-xs text-[var(--app-muted)]">{row.course_code}</p>
                      </div>
                      <span className={cn(STUDENT_BADGE, ui.className)}>{ui.label}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          ),
        )
      )}

      {drawerOpen ? (
        <div className="fixed inset-0 z-[120] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="enroll-drawer-title">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fermer" onClick={() => setDrawerOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-[var(--app-elevated)] shadow-xl">
            <div className="border-b border-[var(--app-border)] p-4">
              <h2 id="enroll-drawer-title" className="font-heading text-lg font-semibold">
                Demander une inscription
              </h2>
              <input
                type="search"
                placeholder="Rechercher un cours…"
                className="mt-3 w-full min-h-[44px] rounded-lg border border-[var(--app-border)] px-3 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingCandidates ? (
                <Spinner label="Recherche" />
              ) : candidates.length === 0 ? (
                <p className="text-sm text-[var(--app-muted)]">Aucun cours éligible.</p>
              ) : (
                <ul className="space-y-2">
                  {candidates.map((c) => (
                    <li key={c.id} className="rounded-lg border border-[var(--app-border)] p-3">
                      <p className="font-medium">{c.code} — {c.name}</p>
                      <p className="text-xs text-[var(--app-muted)]">{c.academic_year}</p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2 min-h-[44px] w-full"
                        disabled={submitting}
                        onClick={() => requestEnrollment(c.id)}
                      >
                        Demander
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
