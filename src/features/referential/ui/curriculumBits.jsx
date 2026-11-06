import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, Lock, LockOpen, ShieldCheck, XCircle } from 'lucide-react'

import { apiErrorMessage, postCurriculumAction } from '@/features/curriculum/api/curriculaApi'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { StatusPill } from '@/shared/ui/StatusPill'

export const SEMESTER_CREDITS = 30

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

/** Anneau de progression (validées / total). */
export function ReadinessRing({ validated, total, size = 64, className }) {
  const ratio = total ? validated / total : 0
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-[var(--app-subtle)]" />
        <circle
          cx="32" cy="32" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
          className={cn('transition-[stroke-dashoffset] duration-700', ratio === 1 ? 'stroke-green-500' : 'stroke-brand-500')}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-[13px] font-semibold tabular-nums">
        {validated}/{total}
      </span>
    </div>
  )
}

export function CurriculumStatusPill({ curriculum }) {
  if (!curriculum) return null
  return curriculum.status === 'validated' ? (
    <StatusPill tone="success"><Lock size={11} className="mr-0.5 inline" aria-hidden />Maquette validée</StatusPill>
  ) : curriculum.errors ? (
    <StatusPill tone="danger">Maquette à corriger</StatusPill>
  ) : (
    <StatusPill tone="warning">Maquette en brouillon</StatusPill>
  )
}

export function SemesterChip({ slot }) {
  const ok = slot.credits === SEMESTER_CREDITS
  return (
    <span
      title={`${slot.level_name} · S${slot.semester} : ${slot.units} UE, ${slot.credits} crédits`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums ring-1 ring-inset',
        ok
          ? 'bg-green-50 text-green-800 ring-green-600/20 dark:bg-green-500/10 dark:text-green-200 dark:ring-green-400/20'
          : 'bg-secondary-50 text-secondary-800 ring-secondary-600/20 dark:bg-secondary-500/10 dark:text-secondary-200 dark:ring-secondary-400/25',
      )}
    >
      S{slot.semester}
      <span className="opacity-70">{slot.credits}/{SEMESTER_CREDITS}</span>
    </span>
  )
}

export function ChecksList({ checks, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const errors = checks.filter((c) => c.severity === 'error')
  const warnings = checks.filter((c) => c.severity === 'warning')
  if (!checks.length) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-green-700 dark:text-green-300">
        <CheckCircle2 size={14} aria-hidden /> Maquette cohérente.
      </p>
    )
  }
  return (
    <div className="space-y-1.5">
      {errors.map((c, i) => (
        <p key={`e${i}`} className="flex gap-1.5 text-[12px] leading-snug text-red-800 dark:text-red-200">
          <XCircle size={14} className="mt-px shrink-0" aria-hidden /> {c.message}
        </p>
      ))}
      {warnings.length ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-secondary-800 hover:underline dark:text-secondary-200"
            aria-expanded={open}
          >
            <AlertTriangle size={14} aria-hidden />
            {plural(warnings.length, 'point')} d’attention
            <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
          {open ? (
            <ul className="mt-1 space-y-1 pl-5 text-[11.5px] leading-snug text-[var(--app-fg-soft)]">
              {warnings.map((c, i) => (
                <li key={`w${i}`} className="list-disc">{c.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Valider / rouvrir une maquette, avec une note pour le journal. ``pending = { program: {id, code}, action }``. */
export function CurriculumActionDialog({ pending, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setNote(''), [pending])
  if (!pending) return null
  const { program, action } = pending
  const validate = action === 'validate'
  const submit = async () => {
    setBusy(true)
    try {
      await postCurriculumAction(program.id, action, note)
      dispatchToast({ type: 'success', message: validate ? `Maquette ${program.code} validée.` : `Maquette ${program.code} rouverte.` })
      onDone()
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onClose={busy ? () => {} : onClose}
      icon={validate ? ShieldCheck : LockOpen}
      title={validate ? `Valider la maquette ${program.code}` : `Rouvrir la maquette ${program.code}`}
      description={
        validate
          ? 'Une fois validée, la maquette est verrouillée : niveaux, UE, cours et crédits ne peuvent plus changer. L’affectation des enseignants reste possible.'
          : 'La maquette repasse en brouillon et redevient modifiable. Elle devra être validée à nouveau.'
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button variant={validate ? 'primary' : 'secondary'} onClick={submit} disabled={busy}>
            {busy ? 'Enregistrement…' : validate ? 'Valider la maquette' : 'Rouvrir'}
          </Button>
        </div>
      }
    >
      <label className="block text-[12.5px] font-medium">
        Note pour le journal <span className="font-normal text-[var(--app-muted)]">(facultatif)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder={validate ? 'Ex. Validée en conseil pédagogique du 12 septembre.' : 'Ex. Ajout d’une UE optionnelle en L2.'}
          className="mt-1.5 min-h-[80px] w-full resize-y rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
        />
      </label>
    </Dialog>
  )
}
