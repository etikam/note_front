import { useState } from 'react'

import { COURSE_STATUS, simulateCourse } from '@/features/regulations/model/regulationRules'
import { SectionCard } from '@/shared/ui/SectionCard'
import { StatusPill } from '@/shared/ui/StatusPill'

const INPUT =
  'h-9 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2 text-center text-[13px] tabular-nums text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]'

/** Essai en direct des règles de notation (non enregistrées comprises) sur un jeu de notes. */
export function GradeSimulator({ notation }) {
  const [notes, setNotes] = useState(['4', '6', '3', ''])
  const result = simulateCourse(notes, notation)
  const status = COURSE_STATUS[result.status]
  return (
    <SectionCard title="Simulateur" description="Essayez les règles affichées sur un exemple de notes.">
      <div className="grid grid-cols-4 gap-2">
        {['N1', 'N2', 'N3', 'Rattr.'].map((label, i) => (
          <label key={label} className="flex flex-col gap-1 text-[11.5px] text-[var(--app-muted)]">
            <span>
              {label}
              {i < 3 ? ` (${notation.weights[i]} %)` : ''}
            </span>
            <input
              type="number"
              min={0}
              max={notation.scale_max}
              step={0.25}
              className={INPUT}
              value={notes[i]}
              onChange={(e) => setNotes((n) => n.map((v, j) => (j === i ? e.target.value : v)))}
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-[var(--app-subtle)] px-3 py-2.5">
        <span className="text-[13px] text-[var(--app-fg-soft)]">
          Moyenne{' '}
          <strong className="font-heading text-[18px] tabular-nums text-[var(--app-fg)]">
            {result.average == null ? '—' : String(result.average.toFixed(2)).replace('.', ',')}
          </strong>{' '}
          / {notation.scale_max}
        </span>
        {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
      </div>
      <p className="mt-2 text-[11.5px] text-[var(--app-muted)]">Seuil de validation : {String(notation.pass_mark).replace('.', ',')}.</p>
    </SectionCard>
  )
}
