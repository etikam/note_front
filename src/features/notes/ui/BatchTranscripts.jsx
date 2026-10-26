import { useEffect, useMemo, useState } from 'react'
import { Eye, Printer, Stamp } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { fetchTranscriptBatch, issueTranscripts } from '@/features/notes/api/notesApi'
import { fmtNote } from '@/features/notes/model/notesModel'
import { useNotesFilters } from '@/features/notes/model/useNotesFilters'
import { NotesFilterBar } from '@/features/notes/ui/NotesFilterBar'
import { PaperPreview } from '@/features/notes/ui/IndividualTranscript'
import { usePrintDocuments } from '@/features/notes/ui/PrintPortal'
import { TranscriptDocument } from '@/features/notes/ui/TranscriptDocument'
import { DECISION_TONE } from '@/features/reports/model/reportLabels'
import { useAccess } from '@/features/access/model/useAccess'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Dialog } from '@/shared/ui/Dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

/** Relevés de tout un niveau : contrôle, aperçu, délivrance et impression en lot. */
export function BatchTranscripts() {
  const access = useAccess()
  const { academicYearId } = useAcademicYear()
  const f = useNotesFilters('reports.view')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [preview, setPreview] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const { print, portal } = usePrintDocuments()
  const canIssue = access.canManage('transcripts.issue')

  useEffect(() => {
    if (!f.levelId) {
      setData(null)
      return undefined
    }
    const controller = new AbortController()
    setData(null)
    setError('')
    fetchTranscriptBatch({ level: f.levelId, semester: f.semester }, { signal: controller.signal })
      .then((d) => {
        setData(d)
        setSelected(new Set(d.items.filter((i) => !i.blockers.length).map((i) => i.transcript.student.id)))
      })
      .catch((err) => !controller.signal.aborted && setError(err?.message || 'Chargement impossible.'))
    return () => controller.abort()
  }, [f.levelId, f.semester, academicYearId])

  const items = useMemo(() => data?.items ?? [], [data])
  const ready = useMemo(() => items.filter((i) => !i.blockers.length), [items])
  const chosen = ready.filter((i) => selected.has(i.transcript.student.id))

  const draftDoc = (item) => <TranscriptDocument key={item.transcript.student.id} document={data.document} transcript={item.transcript} periodLabel={data.period_label} />

  async function issueSelected() {
    try {
      const res = await issueTranscripts({ students: chosen.map((i) => i.transcript.student.id), semester: f.semester || undefined })
      dispatchToast({
        type: res.issued.length ? 'success' : 'error',
        message: res.issued.length ? `${res.issued.length} relevé${res.issued.length > 1 ? 's' : ''} délivré${res.issued.length > 1 ? 's' : ''}${res.skipped.length ? ` · ${res.skipped.length} écarté(s)` : ''}.` : res.skipped[0]?.reason || 'Aucun relevé délivré.',
      })
      if (res.issued.length) {
        print(
          res.issued.map((i) => (
            <TranscriptDocument key={i.id} document={i.snapshot.document} transcript={i.snapshot.transcript} issue={i} periodLabel={i.period_label} />
          )),
        )
      }
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Délivrance impossible.' })
      throw err
    }
  }

  const allChosen = ready.length > 0 && chosen.length === ready.length

  return (
    <div className="flex flex-col gap-4">
      <NotesFilterBar filters={f} showPublished={false}>
        {items.length ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => print(items.map(draftDoc))}>
              <Printer size={14} aria-hidden /> Imprimer les aperçus ({items.length})
            </Button>
            {canIssue ? (
              <Button size="sm" onClick={() => setConfirm(true)} disabled={!chosen.length}>
                <Stamp size={14} aria-hidden /> Délivrer et imprimer ({chosen.length})
              </Button>
            ) : null}
          </>
        ) : null}
      </NotesFilterBar>

      {!f.levelId ? (
        <SectionCard>
          <EmptyState title="Choisissez un programme et un niveau" description="Les relevés de tous les étudiants du niveau sont préparés ; seuls ceux dont toutes les notes sont publiées peuvent être délivrés." />
        </SectionCard>
      ) : error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} />
        </SectionCard>
      ) : !data ? (
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      ) : !items.length ? (
        <SectionCard>
          <EmptyState title="Aucun relevé" description="Aucun étudiant de ce niveau n’a de cours sur la période choisie." />
        </SectionCard>
      ) : (
        <SectionCard
          title={`${data.level.program_code} · ${data.level.name} — ${data.period_label}`}
          description={`${ready.length} relevé${ready.length > 1 ? 's' : ''} prêt${ready.length > 1 ? 's' : ''} sur ${items.length} · les autres attendent la publication de notes.`}
          flush
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--app-border)] text-left text-[11.5px] font-semibold text-[var(--app-muted)]">
                <th className="w-10 px-4 py-2">
                  {canIssue ? (
                    <Checkbox
                      checked={allChosen}
                      indeterminate={chosen.length > 0 && !allChosen}
                      onChange={(on) => setSelected(new Set(on ? ready.map((i) => i.transcript.student.id) : []))}
                      label={<span className="sr-only">Tout sélectionner</span>}
                    />
                  ) : null}
                </th>
                <th className="px-2 py-2">Étudiant</th>
                <th className="px-2 py-2 text-right">Moyenne</th>
                <th className="px-2 py-2">Décision</th>
                <th className="px-2 py-2">État</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const t = item.transcript
                const id = t.student.id
                const ok = !item.blockers.length
                return (
                  <tr key={id} className="border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-hover)]">
                    <td className="px-4 py-2">
                      {canIssue ? (
                        <Checkbox
                          checked={selected.has(id)}
                          disabled={!ok}
                          onChange={(on) =>
                            setSelected((prev) => {
                              const next = new Set(prev)
                              if (on) next.add(id)
                              else next.delete(id)
                              return next
                            })
                          }
                          label={<span className="sr-only">Sélectionner {t.student.last_name}</span>}
                        />
                      ) : null}
                    </td>
                    <td className="px-2 py-2">
                      <span className="block font-medium text-[var(--app-fg)]">
                        {t.student.last_name} {t.student.first_name}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--app-muted)]">{t.student.matricule}</span>
                    </td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{fmtNote(t.average)}</td>
                    <td className="px-2 py-2">
                      <StatusPill tone={DECISION_TONE[t.decision]}>{t.decision_label}</StatusPill>
                    </td>
                    <td className="px-2 py-2 text-[12px]">
                      {ok ? <StatusPill tone="success" dot={false}>Prêt</StatusPill> : <span className="text-[var(--app-muted)]">{item.blockers[0]}</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setPreview(item)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--app-fg-soft)] hover:bg-[var(--app-subtle)]"
                      >
                        <Eye size={13} aria-hidden /> Aperçu
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </SectionCard>
      )}

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} title="Aperçu du relevé" size="xl">
        {preview ? <PaperPreview>{draftDoc(preview)}</PaperPreview> : null}
      </Dialog>
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Délivrer ${chosen.length} relevé${chosen.length > 1 ? 's' : ''} officiel${chosen.length > 1 ? 's' : ''} ?`}
        message="Chaque relevé reçoit un numéro et un code de vérification, son contenu est figé. Ils s’ouvrent ensuite à l’impression."
        confirmLabel="Délivrer et imprimer"
        variant="primary"
        onConfirm={issueSelected}
      />
      {portal}
    </div>
  )
}
