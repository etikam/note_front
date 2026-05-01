import { useMemo, useRef } from 'react'
import { cn } from '@/shared/lib/cn'

export function OtpInput({ value, onChange, length = 6, disabled = false }) {
  const refs = useRef([])
  const digits = useMemo(() => {
    const raw = String(value ?? '').replace(/\D/g, '').slice(0, length)
    return Array.from({ length }, (_, index) => raw[index] ?? '')
  }, [length, value])

  function applyNext(rawValue) {
    const normalized = String(rawValue ?? '').replace(/\D/g, '').slice(0, length)
    onChange(normalized)
  }

  function handleChange(index, nextValue) {
    const onlyDigits = String(nextValue ?? '').replace(/\D/g, '')
    if (!onlyDigits) {
      const copy = [...digits]
      copy[index] = ''
      applyNext(copy.join(''))
      return
    }
    if (onlyDigits.length > 1) {
      applyNext(onlyDigits)
      const target = Math.min(onlyDigits.length, length) - 1
      refs.current[target]?.focus()
      return
    }
    const copy = [...digits]
    copy[index] = onlyDigits
    applyNext(copy.join(''))
    if (index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Saisie du code OTP">
      {digits.map((digit, index) => (
        <input
          key={`otp-${index}`}
          ref={(node) => { refs.current[index] = node }}
          className={cn(
            'w-9 sm:w-10 min-w-[2rem] sm:min-w-[2.25rem] h-11 text-center text-xl font-semibold rounded-none border-0 border-b-2 bg-transparent transition-[border-color] duration-150',
            'focus:outline-none focus:ring-0',
            digit
              ? 'border-brand-600 text-brand-800 dark:border-brand-400 dark:text-brand-100'
              : 'border-zinc-300 text-zinc-900 dark:border-[var(--app-border)] dark:text-zinc-100',
            'focus:border-brand-600 dark:focus:border-brand-400',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
        />
      ))}
    </div>
  )
}
