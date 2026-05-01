import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ClipboardList, ExternalLink, X } from 'lucide-react'

import { patchCourseEnrollment } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

function initials(first, last) {
  const a = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim()
  return a ? a.toUpperCase() : '?'
}

/**
 * @param {{ courseId: string, enrollments: Array<Record<string, unknown>>, onUpdated: () => void }} props
 */
export function CourseEnrollmentRequestsSection({ courseId, enrollments = [], onUpdated }) {
  const pending = useMemo(() => enrollments.filter((e) => e.status === 'pending'), [enrollments])
  const [busyId, setBusyId] = useState(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectComment, setRejectComment] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const rejectTitleId = useId()
  const rejectDescId = useId()

  useEffect(() => {
    if (!rejectTarget) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !rejectSubmitting) setRejectTarget(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rejectTarget, rejectSubmitting])

  const runPatch = useCallback(
    async (enrollmentId, body) => {
      setBusyId(enrollmentId)
      try {
        await patchCourseEnrollment(courseId, enrollmentId, body)
        dispatchToast({
          type: 'success',
          message: body.status === 'approved' ? 'Inscription approuvée.' : 'Demande refusée.',
        })
        onUpdated?.()
      } catch (e) {
        const msg = e?.response?.data?.detail || e?.response?.data?.status?.[0] || "Impossible de mettre à jour l'inscription."
        dispatchToast({ type: 'error', message: typeof msg === 'string' ? msg : "Impossible de mettre à jour l'inscription." })
      } finally {
        setBusyId(null)
      }
    },
    [courseId, onUpdated],
  )

  const handleApprove = useCallback((row) => runPatch(row.id, { status: 'approved' }), [runPatch])

  const openReject = useCallback((row) => {
    setRejectTarget(row)
    setRejectComment('')
  }, [])

  const confirmReject = useCallback(async () => {
    if (!rejectTarget) return
    setRejectSubmitting(true)
    try {
      await patchCourseEnrollment(courseId, rejectTarget.id, {
        status: 'rejected',
        comments: rejectComment.trim() || '',
      })
      dispatchToast({ type: 'success', message: 'Demande refusée.' })
      setRejectTarget(null)
      setRejectComment('')
      onUpdated?.()
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.response?.data?.status?.[0] || 'Impossible de refuser cette demande.'
      dispatchToast({ type: 'error', message: typeof msg === 'string' ? msg : 'Impossible de refuser cette demande.' })
    } finally {
      setRejectSubmitting(false)
    }
  }, [rejectTarget, rejectComment, courseId, onUpdated])

  const handleAcceptAll = useCallback(async () => {
    if (pending.length === 0) return
    setBulkBusy(true)
    try {
      for (const row of pending) {
        await patchCourseEnrollment(courseId, row.id, { status: 'approved' })
      }
      dispatchToast({ type: 'success', message: `${pending.length} demande(s) approuvée(s).` })
      onUpdated?.()
    } catch (e) {
      const msg = e?.response?.data?.detail || "Une erreur s'est produite pendant le traitement groupé."
      dispatchToast({ type: 'error', message: typeof msg === 'string' ? msg : 'Traitement groupé incomplet.' })
      onUpdated?.()
    } finally {
      setBulkBusy(false)
    }
  }, [courseId, pending, onUpdated])

  if (pending.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50/95 via-white to-emerald-50/20',
          'dark:border-[var(--app-border)] dark:from-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:via-[var(--app-elevated)] dark:to-emerald-950/15',
          'px-6 py-16 text-center',
        )}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <ClipboardList size={28} strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Aucune demande en attente</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Lorsque des étudiants demandent à rejoindre ce cours, leurs demandes apparaîtront ici pour validation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
          'dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]',
        )}
      >
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Demandes à traiter</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {pending.length} demande{pending.length > 1 ? 's' : ''} en attente de validation
          </p>
        </div>
        <Button type="button" variant="primary" disabled={bulkBusy} onClick={handleAcceptAll} className="shrink-0">
          {bulkBusy ? 'Traitement…' : `Tout accepter (${pending.length})`}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]">
        <table className="w-full min-w-[56rem] text-left text-[13px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100/95 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400">
              <th className="py-3 pl-4 pr-2 w-14" scope="col">
                <span className="sr-only">Photo</span>
              </th>
              <th className="py-3 pr-3" scope="col">
                Étudiant
              </th>
              <th className="py-3 pr-3 w-[9rem]" scope="col">
                Matricule
              </th>
              <th className="py-3 pr-3 w-[8rem]" scope="col">
                Niveau
              </th>
              <th className="py-3 pr-3 min-w-[8rem]" scope="col">
                Cohorte
              </th>
              <th className="py-3 pr-3 w-[9rem]" scope="col">
                Demandé le
              </th>
              <th className="py-3 pr-4 text-right" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[var(--app-border)]">
            {pending.map((row) => {
              const loading = busyId === row.id
              return (
                <tr key={row.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]">
                  <td className="py-3 pl-4 align-middle">
                    {row.photo_url ? (
                      <img
                        src={row.photo_url}
                        alt=""
                        className="size-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-700"
                      />
                    ) : (
                      <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
                        {initials(row.first_name, row.last_name)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 align-middle">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {row.first_name} {row.last_name}
                    </p>
                    <Link
                      to={`/teacher/students/${row.student_id}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Fiche étudiant
                      <ExternalLink size={12} className="opacity-70" aria-hidden />
                    </Link>
                  </td>
                  <td className="py-3 pr-3 align-middle font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{row.matricule}</td>
                  <td className="py-3 pr-3 align-middle text-xs">
                    <span className="font-mono font-semibold text-secondary-800 dark:text-secondary-200">
                      {row.level_compact || row.level_name || '—'}
                    </span>
                    {row.department_code ? (
                      <span className="text-zinc-400"> ({row.department_code})</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 align-middle text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-[12rem]" title={row.cohorte_label || ''}>
                    {row.cohorte_label || '—'}
                  </td>
                  <td className="py-3 pr-3 align-middle text-xs tabular-nums text-zinc-500">
                    {row.enrolled_at ? new Date(row.enrolled_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                  <td className="py-3 pr-4 text-right align-middle">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={loading || bulkBusy}
                        onClick={() => handleApprove(row)}
                        className="gap-1"
                      >
                        <Check size={14} aria-hidden />
                        Accepter
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="softSecondary"
                        disabled={loading || bulkBusy}
                        onClick={() => openReject(row)}
                        className="gap-1 text-red-700 dark:text-red-300"
                      >
                        <X size={14} aria-hidden />
                        Refuser
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rejectTarget ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => !rejectSubmitting && setRejectTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={rejectTitleId}
            aria-describedby={rejectDescId}
            className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--app-border)] px-5 py-4">
              <h2 id={rejectTitleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Refuser l’inscription
              </h2>
              <p id={rejectDescId} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Refuser la demande de{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {rejectTarget.first_name} {rejectTarget.last_name}
                </strong>{' '}
                ({rejectTarget.matricule}) ?
              </p>
              <label className="mt-4 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Motif (optionnel)
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  rows={3}
                  disabled={rejectSubmitting}
                  className={cn(
                    'mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm',
                    'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_95%,black)]',
                  )}
                  placeholder="Commentaire enregistré sur la demande…"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3">
              <Button type="button" variant="ghost" disabled={rejectSubmitting} onClick={() => setRejectTarget(null)}>
                Annuler
              </Button>
              <Button type="button" variant="danger" disabled={rejectSubmitting} onClick={confirmReject}>
                {rejectSubmitting ? 'En cours…' : 'Refuser'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
