import { Check, X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

const BADGE = {
  done: 'bg-green-600 text-white ring-green-600 dark:bg-green-500 dark:ring-green-500',
  error: 'bg-red-600 text-white ring-red-600 dark:bg-red-500 dark:ring-red-500',
  current: 'bg-brand-600 text-white ring-brand-600 shadow-[0_0_0_4px_rgb(37_99_235/0.15)] dark:bg-brand-500 dark:ring-brand-500',
  todo: 'bg-[var(--app-elevated)] text-[var(--app-muted)] ring-[var(--app-border-strong)]',
}

/**
 * Étape d'un parcours d'import : pastille numérotée (état), titre, explication, contenu.
 * ``state`` : ``current`` (par défaut), ``done``, ``error`` ou ``todo`` (contenu atténué).
 *
 * @param {{
 *   step: number
 *   title: string
 *   description?: import('react').ReactNode
 *   state?: 'current' | 'done' | 'error' | 'todo'
 *   accent?: string
 *   aside?: import('react').ReactNode
 *   className?: string
 *   children: import('react').ReactNode
 * }} props
 */
export function ImportStepCard({ step, title, description, state = 'current', aside, className, children }) {
  return (
    <section
      aria-label={`Étape ${step} : ${title}`}
      className={cn(
        'rounded-2xl border bg-[var(--app-elevated)] shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors',
        state === 'current' ? 'border-brand-500/40 dark:border-brand-400/40' : 'border-[var(--app-border)]',
        className,
      )}
    >
      <header className="flex items-start gap-3.5 px-5 pt-5 sm:px-6">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums ring-1 ring-inset', BADGE[state] ?? BADGE.current)}>
          {state === 'done' ? <Check size={15} strokeWidth={3} aria-hidden /> : state === 'error' ? <X size={15} strokeWidth={3} aria-hidden /> : step}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="font-heading text-[15.5px] font-semibold tracking-tight text-[var(--app-fg)]">{title}</h2>
          {description ? <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--app-muted)]">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </header>
      <div className={cn('flex flex-col gap-4 px-5 pb-5 pt-4 sm:px-6 sm:pl-[4.25rem]', state === 'todo' && 'opacity-60')}>{children}</div>
    </section>
  )
}
