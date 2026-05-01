import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

const TONE = {
  error: {
    Icon: AlertCircle,
    className:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/50 dark:text-red-100',
    iconClass: 'text-red-600 dark:text-red-400',
    live: 'assertive',
  },
  success: {
    Icon: CheckCircle2,
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-100',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    live: 'polite',
  },
  info: {
    Icon: Info,
    className:
      'border-secondary-200 bg-secondary-50 text-secondary-900 dark:border-secondary-500/35 dark:bg-secondary-950/30 dark:text-secondary-100',
    iconClass: 'text-secondary-700 dark:text-secondary-300',
    live: 'polite',
  },
}

export function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex w-[min(100%-2rem,22rem)] flex-col gap-2 pointer-events-none p-0"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const tone = TONE[t.type] ?? TONE.error
        const Icon = tone.Icon
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-live={tone.live}
            className={cn(
              'pointer-events-auto flex gap-3 rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-sm',
              tone.className,
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', tone.iconClass)} aria-hidden />
            <p className="flex-1 text-sm leading-snug pr-1">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Fermer la notification"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
