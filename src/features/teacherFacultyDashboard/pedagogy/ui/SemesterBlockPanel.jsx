import { useCallback, useState } from 'react'
import { Layers, Power, PowerOff } from 'lucide-react'

import {
  postSemesterBlockActivate,
  postSemesterBlockDeactivate,
} from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

function parityBadgeClass(parity) {
  if (parity === 'even')
    return 'bg-violet-500/15 text-violet-800 ring-1 ring-violet-500/25 dark:bg-violet-400/15 dark:text-violet-100 dark:ring-violet-400/30'
  if (parity === 'odd')
    return 'bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/25 dark:bg-amber-400/15 dark:text-amber-50 dark:ring-amber-400/30'
  return 'bg-[var(--app-muted)]/10 text-[var(--app-muted)] ring-1 ring-[var(--app-border)]'
}

function formatActiveParity(parity) {
  if (parity === 'even') return 'Bloc pair ouvert — S2, S4, S6'
  if (parity === 'odd') return 'Bloc impair ouvert — S1, S3, S5'
  return 'Aucun bloc ouvert'
}

/**
 * @param {{
 *   academicYearId: number | null
 *   academicYearLabel: string | null
 *   activeSemesterParity: 'odd' | 'even' | null | undefined
 *   canCalendar: boolean
 *   onUpdated: () => Promise<void> | void
 * }} props
 */
export function SemesterBlockPanel({ academicYearId, academicYearLabel, activeSemesterParity, canCalendar, onUpdated }) {
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(/** @type {null | { kind: 'even' | 'odd' | 'deactivate' }} */ (null))

  const runActivate = useCallback(
    async (parity) => {
      if (!academicYearId) return
      setBusy(true)
      try {
        const data = await postSemesterBlockActivate(academicYearId, parity)
        const parts = [
          `Progressions : ${data.advanced ?? 0}`,
          `non éligibles : ${data.not_eligible ?? 0}`,
          `inscriptions créées : ${data.enrollments_created ?? 0}`,
        ]
        if (data.skipped_no_level) parts.push(`sans niveau : ${data.skipped_no_level}`)
        dispatchToast({
          type: 'success',
          message: `Bloc ${parity === 'even' ? 'pair' : 'impair'} activé. ${parts.join(' · ')}`,
        })
        await onUpdated?.()
      } catch (err) {
        const d = err?.response?.data
        const msg =
          typeof d?.detail === 'string'
            ? d.detail
            : d?.parity?.[0] ?? err?.message ?? 'Activation impossible.'
        dispatchToast({ type: 'error', message: msg })
        throw err
      } finally {
        setBusy(false)
      }
    },
    [academicYearId, onUpdated],
  )

  const runDeactivate = useCallback(async () => {
    if (!academicYearId) return
    setBusy(true)
    try {
      await postSemesterBlockDeactivate(academicYearId)
      dispatchToast({
        type: 'success',
        message: 'Bloc semestriel fermé (indicateur uniquement — pas d’annulation des progressions déjà enregistrées).',
      })
      await onUpdated?.()
    } catch (err) {
      const d = err?.response?.data
      const msg = typeof d?.detail === 'string' ? d.detail : err?.message ?? 'Erreur.'
      dispatchToast({ type: 'error', message: msg })
      throw err
    } finally {
      setBusy(false)
    }
  }, [academicYearId, onUpdated])

  if (!academicYearId) {
    return (
      <Card className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] p-6 dark:bg-white/[0.03]">
        <p className="text-sm text-[var(--app-muted)]">Sélectionnez une année académique pour gérer les blocs S1–S6.</p>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-[var(--app-border)] p-5 sm:p-6 shadow-sm overflow-hidden">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-500/[0.07] via-transparent to-violet-500/[0.06]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-400/15 dark:text-brand-200 dark:ring-brand-400/25">
              <Layers size={22} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-sm font-semibold text-[var(--app-fg)]">Parcours licence — blocs semestriels</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
                S1–S2 (L1), S3–S4 (L2), S5–S6 (L3). L’activation d’un <strong className="font-semibold text-[var(--app-fg)]">bloc pair</strong>{' '}
                fait passer les étudiants éligibles de S1→S2, S3→S4, S5→S6 et les inscrit aux cours du semestre d’arrivée (champ « Semestre
                programme » sur chaque cours). Le <strong className="font-semibold text-[var(--app-fg)]">bloc impair</strong> fait S2→S3 et S4→S5.
                Les positions semestrielles des étudiants pour l’année doivent être renseignées avant activation.
              </p>
              <p className="mt-2 text-[11px] font-medium text-[var(--app-muted)]">
                Année cible :{' '}
                <span className="text-[var(--app-fg)]">{academicYearLabel ?? `#${academicYearId}`}</span>
              </p>
            </div>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
              parityBadgeClass(activeSemesterParity ?? null),
            )}
          >
            {formatActiveParity(activeSemesterParity ?? null)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_96%,var(--app-canvas))] p-4 dark:bg-white/[0.04]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">Bloc pair</p>
          <p className="mt-1.5 text-xs text-[var(--app-muted)]">Progression depuis les positions impaires S1, S3, S5.</p>
          {canCalendar ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-3 w-full sm:w-auto bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400"
              disabled={busy}
              onClick={() => setConfirm({ kind: 'even' })}
            >
              <Power size={14} className="opacity-90" aria-hidden />
              Activer le bloc pair
            </Button>
          ) : null}
        </div>
        <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_96%,var(--app-canvas))] p-4 dark:bg-white/[0.04]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">Bloc impair</p>
          <p className="mt-1.5 text-xs text-[var(--app-muted)]">Progression depuis S2 et S4 (S6 inchangé ici).</p>
          {canCalendar ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-3 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
              disabled={busy}
              onClick={() => setConfirm({ kind: 'odd' })}
            >
              <Power size={14} className="opacity-90" aria-hidden />
              Activer le bloc impair
            </Button>
          ) : null}
        </div>
      </div>

      {canCalendar ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--app-border)] pt-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[var(--app-muted)] hover:text-red-600 dark:hover:text-red-400"
            disabled={busy || !activeSemesterParity}
            onClick={() => setConfirm({ kind: 'deactivate' })}
          >
            <PowerOff size={14} aria-hidden />
            Fermer le bloc ouvert
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[var(--app-muted)]">Lecture seule — réservé aux profils habilités sur le calendrier académique.</p>
      )}

      <ConfirmModal
        open={confirm != null && confirm.kind === 'even'}
        onClose={() => setConfirm(null)}
        title="Activer le bloc pair ?"
        message="Les étudiants concernés passeront en S2, S4 ou S6 s’ils sont éligibles (≤ 2 dettes sur les semestres de même parité déjà suivis). Les inscriptions aux cours du semestre d’arrivée seront créées lorsque le cours a un « Semestre programme » renseigné."
        confirmLabel="Activer"
        variant="default"
        onConfirm={() => runActivate('even')}
      />
      <ConfirmModal
        open={confirm != null && confirm.kind === 'odd'}
        onClose={() => setConfirm(null)}
        title="Activer le bloc impair ?"
        message="Progression S2→S3 et S4→S5 pour les étudiants éligibles, avec inscriptions automatiques aux cours cibles."
        confirmLabel="Activer"
        variant="default"
        onConfirm={() => runActivate('odd')}
      />
      <ConfirmModal
        open={confirm != null && confirm.kind === 'deactivate'}
        onClose={() => setConfirm(null)}
        title="Fermer le bloc semestriel ?"
        message="L’indicateur de bloc ouvert sera effacé. Ceci n’annule pas les changements de semestre ni les inscriptions déjà effectuées."
        confirmLabel="Fermer"
        variant="danger"
        onConfirm={runDeactivate}
      />
    </Card>
  )
}
