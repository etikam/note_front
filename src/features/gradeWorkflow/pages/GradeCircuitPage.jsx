import { useCallback, useEffect, useMemo, useState } from 'react'
import { Upload } from 'lucide-react'

import { fetchValidationCircuit, saveValidationCircuit } from '@/features/gradeWorkflow/api/gradeWorkflowApi'
import { STEP_LEVEL_LABELS, STEP_LEVEL_ORDER } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { useAccess } from '@/features/access/model/useAccess'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Field'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'

const DEFAULT_LABELS = {
  program: 'Directeur de programme',
  department: 'Chef de département',
  faculty: 'Directeur des études',
  institution: 'Directeur général',
}

const toDraft = (steps) =>
  Object.fromEntries(
    STEP_LEVEL_ORDER.map((lvl) => {
      const step = steps.find((s) => s.scope_level === lvl)
      return [lvl, { on: Boolean(step), label: step?.label ?? DEFAULT_LABELS[lvl] }]
    }),
  )

const toSteps = (draft) =>
  STEP_LEVEL_ORDER.filter((lvl) => draft[lvl].on).map((lvl) => ({ scope_level: lvl, label: draft[lvl].label.trim() }))

/**
 * Circuit de validation des notes (DG) : niveaux activés, du plus proche du cours au plus large ;
 * la dernière étape publie. Les fiches déjà soumises gardent leur circuit.
 */
export default function GradeCircuitPage() {
  const canEdit = useAccess().can('system.settings')
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const steps = await fetchValidationCircuit()
      setSaved(steps)
      setDraft(toDraft(steps))
    } catch (err) {
      setError(err?.message || 'Chargement impossible.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const steps = useMemo(() => (draft ? toSteps(draft) : []), [draft])
  const dirty = saved && JSON.stringify(steps) !== JSON.stringify(saved)
  const invalid = !steps.length || steps.some((s) => !s.label)

  async function save() {
    setSaving(true)
    try {
      const next = await saveValidationCircuit(steps)
      setSaved(next)
      setDraft(toDraft(next))
      dispatchToast({ type: 'success', message: 'Circuit enregistré : il s’applique aux prochaines soumissions.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Enregistrement impossible.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Administration' }, { label: 'Circuit de validation' }]}
        title="Circuit de validation des notes"
        description="Choisissez les étapes qu’une fiche de notes traverse après sa soumission par l’enseignant. La dernière étape publie les notes. Les fiches déjà en validation gardent le circuit en vigueur au moment de leur soumission."
      />
      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} onRetry={load} />
        </SectionCard>
      ) : !draft ? (
        <SectionCard>
          <SkeletonLines lines={5} />
        </SectionCard>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <SectionCard title="Étapes" description="Une étape par niveau ; à chaque étape, le titulaire du mandat de ce niveau (ou d’un niveau plus large) décide.">
            <ul className="divide-y divide-[var(--app-border)]">
              {STEP_LEVEL_ORDER.map((lvl) => {
                const item = draft[lvl]
                const index = steps.findIndex((s) => s.scope_level === lvl)
                return (
                  <li key={lvl} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="w-40 shrink-0">
                      <Checkbox
                        checked={item.on}
                        disabled={!canEdit}
                        onChange={(on) => setDraft((d) => ({ ...d, [lvl]: { ...d[lvl], on } }))}
                        label={<span className="font-medium">{STEP_LEVEL_LABELS[lvl]}</span>}
                      />
                    </div>
                    <Input
                      value={item.label}
                      disabled={!canEdit || !item.on}
                      onChange={(e) => setDraft((d) => ({ ...d, [lvl]: { ...d[lvl], label: e.target.value } }))}
                      className="min-w-[12rem] flex-1"
                      aria-label={`Intitulé de l’étape ${STEP_LEVEL_LABELS[lvl]}`}
                    />
                    <span className="w-20 shrink-0 text-right text-[12px] text-[var(--app-muted)]">
                      {index >= 0 ? `Étape ${index + 1}` : '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
            {canEdit ? (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDraft(toDraft(saved))} disabled={!dirty || saving}>
                  Annuler
                </Button>
                <Button onClick={save} disabled={!dirty || invalid || saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer le circuit'}
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-[12.5px] text-[var(--app-muted)]">Consultation seule : le circuit est réglé par la direction générale.</p>
            )}
          </SectionCard>

          <SectionCard title="Aperçu">
            <ol className="space-y-3">
              <li className="flex items-center gap-3 text-[13px]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--app-subtle)] text-[11px] font-semibold text-[var(--app-muted)]">0</span>
                Saisie et soumission par l’enseignant
              </li>
              {steps.map((s, i) => {
                const last = i === steps.length - 1
                return (
                  <li key={s.scope_level} className="flex items-center gap-3 text-[13px]">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                        last ? 'bg-brand-600 text-white dark:bg-brand-500' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200',
                      )}
                    >
                      {last ? <Upload size={12} aria-hidden /> : i + 1}
                    </span>
                    <span>
                      {s.label || '—'}
                      {last ? <span className="text-[var(--app-muted)]"> · publie</span> : null}
                    </span>
                  </li>
                )
              })}
            </ol>
            {!steps.length ? <p className="mt-3 text-[12.5px] text-amber-700 dark:text-amber-300">Activez au moins une étape.</p> : null}
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--app-muted)]">
              Un refus fait reculer la fiche d’une étape (à la première étape, elle revient à l’enseignant). Qui publie peut ensuite
              dépublier pour corriger, puis republier.
            </p>
          </SectionCard>
        </div>
      )}
    </div>
  )
}
