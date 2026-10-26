import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Lock, LockOpen, Pencil } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAccess } from '@/features/access/model/useAccess'
import { fetchRegulation, saveProgramOverrides, saveYearRules, setRegulationLocked } from '@/features/regulations/api/regulationsApi'
import { countOverrides, sameRules } from '@/features/regulations/model/regulationRules'
import { GradeSimulator } from '@/features/regulations/ui/GradeSimulator'
import { RulesForm } from '@/features/regulations/ui/RulesForm'
import { formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Dialog } from '@/shared/ui/Dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Field'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]'

const recomputedMessage = (n) => (n ? ` · ${n} note${n > 1 ? 's' : ''} recalculée${n > 1 ? 's' : ''}` : '')

function ProgramDialog({ program, regulation, onClose, onSaved, readOnly }) {
  const [overrides, setOverrides] = useState({})
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (program) {
      setOverrides(program.overrides ?? {})
      setComment('')
      setError('')
    }
  }, [program])

  async function save(next) {
    setSaving(true)
    setError('')
    try {
      const data = await saveProgramOverrides(regulation.year.id, program.id, next, comment)
      onSaved(data, `Exceptions de ${program.code} enregistrées${recomputedMessage(data.recomputed)}.`)
      onClose()
    } catch (err) {
      setError(err?.message || 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={Boolean(program)}
      onClose={onClose}
      dismissible={!saving}
      size="xl"
      title={program ? `Exceptions — ${program.code} ${program.name !== program.code ? program.name : ''}` : ''}
      description="Cochez les règles qui diffèrent pour ce programme ; les autres suivent le règlement de l’établissement."
      footer={
        readOnly ? (
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        ) : (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" className="text-red-700 dark:text-red-300" disabled={saving || !countOverrides(program?.overrides)} onClick={() => save({})}>
              Supprimer les exceptions
            </Button>
            <div className="flex flex-1 items-center justify-end gap-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motif (optionnel)" className="max-w-xs" />
              <Button onClick={() => save(overrides)} disabled={saving || sameRules(overrides, program?.overrides ?? {})}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        )
      }
    >
      {program ? (
        <>
          <RulesForm mode="override" value={overrides} onChange={setOverrides} base={regulation.rules} readOnly={readOnly} scaleLocked={regulation.has_notes} />
          {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p> : null}
        </>
      ) : null}
    </Dialog>
  )
}

/** Règlement des études d'une année : établissement, exceptions par programme, verrou, historique. */
export default function RegulationPage() {
  const access = useAccess()
  const canEdit = access.can('system.settings')
  const { academicYears, academicYearId } = useAcademicYear()
  const [yearId, setYearId] = useState(academicYearId ? String(academicYearId) : '')
  const [regulation, setRegulation] = useState(null)
  const [draft, setDraft] = useState(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [program, setProgram] = useState(null)
  const [confirmLock, setConfirmLock] = useState(false)

  useEffect(() => {
    if (!yearId && academicYears?.length) setYearId(String(academicYears.find((y) => y.is_current)?.id ?? academicYears[0].id))
  }, [yearId, academicYears])

  const apply = useCallback((data) => {
    setRegulation(data)
    setDraft(data.rules)
    setComment('')
  }, [])

  useEffect(() => {
    if (!yearId) return undefined
    let cancelled = false
    setRegulation(null)
    setError('')
    fetchRegulation(yearId)
      .then((d) => !cancelled && apply(d))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
    return () => {
      cancelled = true
    }
  }, [yearId, apply])

  const dirty = regulation && draft && !sameRules(draft, regulation.rules)
  const readOnly = !canEdit || regulation?.locked
  const programsWithOverrides = useMemo(() => (regulation?.programs ?? []).filter((p) => countOverrides(p.overrides)), [regulation])

  async function save() {
    setSaving(true)
    try {
      const data = await saveYearRules(yearId, draft, comment)
      apply(data)
      dispatchToast({ type: 'success', message: `Règlement enregistré${recomputedMessage(data.recomputed)}.` })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Enregistrement impossible.' })
    } finally {
      setSaving(false)
    }
  }

  async function toggleLock() {
    try {
      const data = await setRegulationLocked(yearId, !regulation.locked)
      apply(data)
      dispatchToast({ type: 'success', message: data.locked ? 'Règlement verrouillé.' : 'Règlement déverrouillé.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Action impossible.' })
      throw err
    }
  }

  return (
    <div>
      <PageHeader
        variant="section"
        title="Règlement des études"
        description="Règles de notation et de délibération de l’année, appliquées en temps réel aux notes, PV et relevés. Chaque programme peut avoir ses exceptions."
        actions={
          <>
            <select className={SELECT} value={yearId} onChange={(e) => setYearId(e.target.value)} aria-label="Année académique">
              {(academicYears ?? []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                  {y.is_current ? ' (courante)' : ''}
                </option>
              ))}
            </select>
            {canEdit && regulation ? (
              <Button variant="ghost" onClick={() => setConfirmLock(true)} disabled={dirty}>
                {regulation.locked ? <LockOpen size={15} aria-hidden /> : <Lock size={15} aria-hidden />}
                {regulation.locked ? 'Déverrouiller' : 'Verrouiller'}
              </Button>
            ) : null}
          </>
        }
      />

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} />
        </SectionCard>
      ) : !regulation || !draft ? (
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      ) : (
        <div className="flex flex-col gap-5">
          {regulation.locked ? (
            <p className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-3 text-[13px] text-[var(--app-fg-soft)]">
              <Lock size={15} aria-hidden /> Règlement verrouillé{regulation.locked_by ? ` par ${regulation.locked_by}` : ''} le {formatDateTime(regulation.locked_at)} : les résultats de l’année sont figés.
            </p>
          ) : !canEdit ? (
            <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-3 text-[13px] text-[var(--app-fg-soft)]">Consultation seule : le règlement est fixé par la direction.</p>
          ) : null}

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <RulesForm value={draft} onChange={setDraft} readOnly={readOnly} scaleLocked={regulation.has_notes} />

            <div className="flex flex-col gap-6 xl:sticky xl:top-20">
              <GradeSimulator notation={draft.notation} />

              <SectionCard title="Exceptions par programme" description={`${programsWithOverrides.length} programme(s) avec des règles propres`} flush>
                <ul className="max-h-72 divide-y divide-[var(--app-border)] overflow-y-auto">
                  {regulation.programs.map((p) => {
                    const n = countOverrides(p.overrides)
                    return (
                      <li key={p.id}>
                        <button type="button" onClick={() => setProgram(p)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[var(--app-hover)]">
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-[var(--app-fg)]">{p.code}</span>
                            <span className="block truncate text-[11.5px] text-[var(--app-muted)]">{p.name}</span>
                          </span>
                          {n ? <StatusPill tone="info">{n} exception{n > 1 ? 's' : ''}</StatusPill> : <Pencil size={13} className="text-[var(--app-muted)]" aria-hidden />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </SectionCard>

              <SectionCard title="Historique" actions={<History size={15} className="text-[var(--app-muted)]" aria-hidden />}>
                {regulation.revisions.length ? (
                  <ol className="space-y-3">
                    {regulation.revisions.map((r) => (
                      <li key={r.id} className="text-[12.5px]">
                        <p className="text-[var(--app-fg)]">
                          <span className="font-medium">{r.action_label}</span>
                          {r.program_code ? <span className="text-[var(--app-muted)]"> · {r.program_code}</span> : <span className="text-[var(--app-muted)]"> · établissement</span>}
                          {r.recomputed ? <span className="text-[var(--app-muted)]"> · {r.recomputed} note(s) recalculée(s)</span> : null}
                        </p>
                        {r.comment ? <p className="mt-0.5 text-[var(--app-fg-soft)]">« {r.comment} »</p> : null}
                        <p className="text-[11px] text-[var(--app-muted)]">
                          {r.actor ? `${r.actor} · ` : ''}
                          {formatDateTime(r.created_at)}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-[12.5px] text-[var(--app-muted)]">Aucune modification : le règlement par défaut s’applique.</p>
                )}
              </SectionCard>
            </div>
          </div>

          {dirty && !readOnly ? (
            <div className="ds-pop-in sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-3 shadow-lg">
              <p className="text-[13px] font-medium text-[var(--app-fg)]">Modifications non enregistrées</p>
              <p className="text-[12px] text-[var(--app-muted)]">Elles s’appliqueront aussitôt aux notes de {regulation.year.label}.</p>
              <div className="ml-auto flex flex-1 items-center justify-end gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motif (ex. décision du conseil)" className="max-w-xs" />
                <Button variant="ghost" onClick={() => setDraft(regulation.rules)} disabled={saving}>
                  Annuler
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ProgramDialog
        program={program}
        regulation={regulation}
        readOnly={readOnly}
        onClose={() => setProgram(null)}
        onSaved={(data, message) => {
          apply(data)
          dispatchToast({ type: 'success', message })
        }}
      />
      <ConfirmModal
        open={confirmLock}
        onClose={() => setConfirmLock(false)}
        title={regulation?.locked ? 'Déverrouiller le règlement ?' : 'Verrouiller le règlement ?'}
        message={
          regulation?.locked
            ? 'Les règles de l’année pourront de nouveau être modifiées, et les résultats recalculés.'
            : 'Après les jurys : plus aucune règle de l’année ne pourra être modifiée tant que le règlement est verrouillé.'
        }
        confirmLabel={regulation?.locked ? 'Déverrouiller' : 'Verrouiller'}
        variant="default"
        onConfirm={toggleLock}
      />
    </div>
  )
}
