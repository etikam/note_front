import { useEffect, useMemo, useState } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { fr } from 'react-day-picker/locale/fr'

import {
  frDateToIso,
  isoDateToFr,
  isoFieldToLocalDate,
  localDateToIsoField,
} from '@/shared/lib/datesFr'
import { cn } from '@/shared/lib/cn'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/Popover'

/**
 * Date FR : **saisie directe** (jj/mm/aaaa) + calendrier **react-day-picker**
 * (listes mois / année, pas seulement flèches mois par mois).
 * `value` / `onChange` : `YYYY-MM-DD` ou `''`.
 */
export function DateInputFr({
  value,
  onChange,
  className,
  id,
  name,
  disabled,
  autoComplete = 'off',
  'aria-invalid': ariaInvalid,
  placeholderText = 'jj/mm/aaaa',
  isClearable = true,
  ...rest
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => (value ? isoDateToFr(value) : ''))

  const selected = value ? isoFieldToLocalDate(value) : undefined

  const { startMonth, endMonth } = useMemo(() => {
    const y = new Date().getFullYear()
    return {
      startMonth: new Date(y - 120, 0),
      endMonth: new Date(y + 20, 11),
    }
  }, [])

  useEffect(() => {
    setText(value ? isoDateToFr(value) : '')
  }, [value])

  function commitText(raw) {
    const t = (raw ?? '').trim()
    if (!t) {
      onChange('')
      return
    }
    const iso = frDateToIso(t)
    if (iso) {
      onChange(iso)
      setText(isoDateToFr(iso))
    } else {
      setText(value ? isoDateToFr(value) : '')
    }
  }

  return (
    <div
      className={cn(
        'flex h-9 w-full min-w-0 items-stretch gap-1 rounded-lg border text-sm transition-colors',
        'border-[var(--app-border)] bg-[var(--app-elevated)]',
        'focus-within:ring-2 focus-within:ring-brand-500 dark:focus-within:ring-brand-400',
        disabled && 'opacity-60',
        className,
      )}
    >
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={placeholderText}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        lang="fr-FR"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commitText(text)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitText(text)
            e.currentTarget.blur()
          }
        }}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-zinc-900 outline-none dark:text-zinc-100',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
          !text && 'text-zinc-500',
        )}
        {...rest}
      />

      {isClearable && Boolean(value) && !disabled ? (
        <button
          type="button"
          tabIndex={-1}
          className="shrink-0 px-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          aria-label="Effacer la date"
          onClick={() => {
            onChange('')
            setText('')
          }}
        >
          <X className="size-4" />
        </button>
      ) : null}

      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            className="shrink-0 rounded-r-lg border-l border-[var(--app-border)] px-2.5 text-brand-600 hover:bg-zinc-50 dark:text-brand-400 dark:hover:bg-white/5"
            aria-label="Ouvrir le calendrier"
          >
            <CalendarIcon className="size-4" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="end">
          <DayPicker
            mode="single"
            locale={fr}
            weekStartsOn={1}
            captionLayout="dropdown"
            navLayout="after"
            startMonth={startMonth}
            endMonth={endMonth}
            defaultMonth={selected ?? new Date()}
            selected={selected}
            onSelect={(d) => {
              const iso = d ? localDateToIsoField(d) : ''
              onChange(iso)
              setText(iso ? isoDateToFr(iso) : '')
              setOpen(false)
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
