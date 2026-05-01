import { cn } from '@/shared/lib/cn'

const BASE =
  'w-full min-w-[4.5rem] rounded-lg border px-2 py-1.5 text-center text-sm tabular-nums transition-colors ' +
  'border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 ' +
  'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_95%,black)]'

/**
 * Saisie décimale libre : `type="number"` bloque souvent le « . » ou la « , » selon le navigateur / la locale.
 * On garde une chaîne avec au plus un séparateur (point normalisé).
 */
export function sanitizeNoteDecimalInput(raw) {
  if (raw == null) return ''
  let s = String(raw).replace(',', '.')
  s = s.replace(/[^\d.]/g, '')
  const dot = s.indexOf('.')
  if (dot === -1) return s
  const intPart = s.slice(0, dot)
  const frac = s.slice(dot + 1).replace(/\./g, '')
  return intPart + '.' + frac
}

/**
 * @param {{
 *   id: string
 *   label: string
 *   value: string
 *   disabled?: boolean
 *   saving?: boolean
 *   onChange: (v: string) => void
 *   onBlur: () => void
 * }} props
 */
export function NotationNumberInput({ id, label, value, disabled, saving, onChange, onBlur }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled || saving}
        value={value}
        onChange={(e) => onChange(sanitizeNoteDecimalInput(e.target.value))}
        onBlur={onBlur}
        className={cn(
          BASE,
          disabled && 'cursor-not-allowed opacity-45',
          saving && 'opacity-70',
        )}
      />
    </div>
  )
}
