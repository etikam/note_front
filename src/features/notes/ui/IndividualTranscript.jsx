import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, Printer, RotateCcw, ShieldCheck, Stamp, X } from 'lucide-react'

import { formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchTranscriptPreview, issueTranscripts } from '@/features/notes/api/notesApi'
import { fmtNote, periodParams, PERIODS } from '@/features/notes/model/notesModel'
import { SELECT } from '@/features/notes/ui/NotesFilterBar'
import { usePrintDocuments } from '@/features/notes/ui/PrintPortal'
import { StudentPicker } from '@/features/notes/ui/StudentPicker'
import { TranscriptDocument } from '@/features/notes/ui/TranscriptDocument'
import { DECISION_TONE } from '@/features/reports/model/reportLabels'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

/** Aperçu A4 dans un cadre « bureau » (défilement horizontal sur petit écran). */
export function PaperPreview({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--app-border)] bg-[repeating-linear-gradient(45deg,var(--app-subtle),var(--app-subtle)_10px,var(--app-canvas)_10px,var(--app-canvas)_20px)] p-4 sm:p-8">
      <div className="min-w-[640px]">{children}</div>
    </div>
  )
}

/** Relevé d'un étudiant : choix de la période, contrôle, délivrance officielle, impression. */
export function IndividualTranscript() {
  const [params, setParams] = useSearchParams()
  const studentId = params.get('student') ?? ''
  const period = params.get('period') ?? ''
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(null) // relevé délivré affiché (numéro + QR)
  const [confirm, setConfirm] = useState(false)
  const [reload, setReload] = useState(0)
  const { print, portal } = usePrintDocuments()

  const set = (patch) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (!v) next.delete(k)
          else next.set(k, String(v))
        }
        return next
      },
      { replace: true },
    )

  useEffect(() => {
    if (!studentId) {
      setData(null)
      return undefined
    }
    const controller = new AbortController()
    setError('')
    fetchTranscriptPreview(studentId, periodParams(period), { signal: controller.signal })
      .then(setData)
      .catch((err) => !controller.signal.aborted && setError(err?.message || 'Chargement impossible.'))
    return () => controller.abort()
  }, [studentId, period, reload])

  useEffect(() => {
    setCurrent(null)
    setData(null)
  }, [studentId, period])

  async function issue() {
    try {
      const res = await issueTranscripts({ students: [Number(studentId)], ...periodParams(period) })
      if (!res.issued.length) {
        dispatchToast({ type: 'error', message: res.skipped[0]?.reason || 'Relevé non délivré.' })
        return
      }
      const issued = res.issued[0]
      dispatchToast({ type: 'success', message: `Relevé ${issued.number} délivré.` })
      setCurrent(issued)
      setReload((n) => n + 1)
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Délivrance impossible.' })
    }
  }

  const doc = (issue) =>
    issue ? (
      <TranscriptDocument document={issue.snapshot.document} transcript={issue.snapshot.transcript} issue={issue} periodLabel={issue.period_label} />
    ) : (
      <TranscriptDocument document={data.document} transcript={data.transcript} periodLabel={data.period_label} />
    )

  const t = data?.transcript
  const name = t ? `${t.student.last_name} ${t.student.first_name}` : ''

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3 xl:sticky xl:top-20 xl:self-start">
        <SectionCard title="Étudiant">
          {studentId && t ? (
            <div className="flex items-center gap-3">
              <Avatar name={name} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-[var(--app-fg)]">{name}</span>
                <span className="block truncate text-[11.5px] text-[var(--app-muted)]">
                  <span className="font-mono">{t.student.matricule}</span> · {t.student.program?.code} · {t.student.level}
                </span>
              </span>
              <button type="button" onClick={() => set({ student: '' })} className="rounded-md p-1 text-[var(--app-muted)] hover:bg-[var(--app-hover)]" aria-label="Changer d’étudiant">
                <X size={15} />
              </button>
            </div>
          ) : (
            <StudentPicker onPick={(r) => set({ student: r.id })} autoFocus />
          )}
          <label className="mt-3 block text-[11.5px] font-medium text-[var(--app-muted)]">
            Période
            <select className={cn(SELECT, 'mt-1 w-full')} value={period} onChange={(e) => set({ period: e.target.value })}>
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </SectionCard>

        {data ? (
          <SectionCard title="Délivrance">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <span className="rounded-lg bg-[var(--app-subtle)] px-2.5 py-2">
                  <span className="block text-[var(--app-muted)]">Moyenne</span>
                  <span className="text-[15px] font-semibold tabular-nums">{fmtNote(t.average)}</span>
                </span>
                <span className="rounded-lg bg-[var(--app-subtle)] px-2.5 py-2">
                  <span className="block text-[var(--app-muted)]">Crédits</span>
                  <span className="text-[15px] font-semibold tabular-nums">
                    {t.credits_earned ?? 0}/{t.credits_attempted ?? 0}
                  </span>
                </span>
              </div>
              <span className="flex flex-wrap gap-1.5">
                <StatusPill tone={DECISION_TONE[t.decision]}>{t.decision_label}</StatusPill>
                {t.mention ? <StatusPill tone="info" dot={false}>Mention {t.mention}</StatusPill> : null}
              </span>
              {data.blockers.length ? (
                <p className="flex gap-2 rounded-lg bg-secondary-50 px-3 py-2 text-[12.5px] text-secondary-800 dark:bg-secondary-500/10 dark:text-secondary-200">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{data.blockers[0]} Le relevé ne peut pas encore être délivré.</span>
                </p>
              ) : (
                <p className="flex gap-2 rounded-lg bg-green-50 px-3 py-2 text-[12.5px] text-green-800 dark:bg-green-500/10 dark:text-green-200">
                  <BadgeCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
                  Toutes les notes sont publiées : le relevé peut être délivré.
                </p>
              )}
              {current ? (
                <Button onClick={() => print(doc(current))}>
                  <Printer size={15} aria-hidden /> Imprimer le relevé {current.number}
                </Button>
              ) : data.can_issue ? (
                <Button onClick={() => setConfirm(true)} disabled={Boolean(data.blockers.length)}>
                  <Stamp size={15} aria-hidden /> Délivrer le relevé officiel
                </Button>
              ) : (
                <p className="text-[12px] text-[var(--app-muted)]">La délivrance est réservée aux responsables habilités (droit « délivrer les relevés officiels »).</p>
              )}
              <Button variant="ghost" onClick={() => print(doc(null))}>
                <Printer size={15} aria-hidden /> Imprimer l’aperçu
              </Button>
            </div>
          </SectionCard>
        ) : null}

        {data?.issued?.length ? (
          <SectionCard title="Déjà délivrés pour cette période">
            <ul className="-my-1 flex flex-col divide-y divide-[var(--app-border)]">
              {data.issued.map((i) => (
                <li key={i.id} className="flex items-center gap-2 py-2 text-[12.5px]">
                  <ShieldCheck size={14} className={i.revoked_at ? 'text-red-500' : 'text-green-600'} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block font-mono font-semibold', i.revoked_at && 'line-through opacity-60')}>{i.number}</span>
                    <span className="text-[11.5px] text-[var(--app-muted)]">
                      {formatDateTime(i.issued_at)}
                      {i.revoked_at ? ' · annulé' : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}
      </aside>

      <section aria-label="Aperçu du relevé" className="min-w-0">
        {!studentId ? (
          <SectionCard>
            <EmptyState
              title="Choisissez un étudiant"
              description="L’aperçu du relevé apparaît ici, au format officiel : notes publiées par semestre et par UE, moyennes, crédits, décision et mention."
            />
          </SectionCard>
        ) : error ? (
          <SectionCard>
            <EmptyState tone="error" title="Chargement impossible" description={error} />
          </SectionCard>
        ) : !data ? (
          <SectionCard>
            <SkeletonLines lines={12} />
          </SectionCard>
        ) : (
          <div className="flex flex-col gap-2">
            {current ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2 text-[12.5px] text-green-800 dark:bg-green-500/10 dark:text-green-200">
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck size={15} aria-hidden /> Relevé officiel {current.number} — code de vérification {current.code}
                </span>
                <button type="button" onClick={() => setCurrent(null)} className="inline-flex items-center gap-1 font-medium hover:underline">
                  <RotateCcw size={13} aria-hidden /> Revenir à l’aperçu
                </button>
              </div>
            ) : null}
            <PaperPreview>{doc(current)}</PaperPreview>
          </div>
        )}
      </section>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Délivrer le relevé officiel ?"
        message={`Le relevé de ${name} (${data?.period_label ?? ''}) reçoit un numéro et un code de vérification. Son contenu est figé : il reste vérifiable en ligne tant qu’il n’est pas annulé.`}
        confirmLabel="Délivrer"
        variant="primary"
        onConfirm={issue}
      />
      {portal}
    </div>
  )
}
