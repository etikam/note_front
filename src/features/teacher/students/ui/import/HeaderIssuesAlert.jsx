import { AlertTriangle } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/**
 * @param {{ messages: string[] }} props
 */
export function HeaderIssuesAlert({ messages }) {
  if (!messages?.length) return null
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm',
        'border-orange-200 bg-orange-50/95 text-orange-950',
        'dark:border-orange-800/60 dark:bg-orange-950/35 dark:text-orange-100',
      )}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" size={18} aria-hidden />
      <ul className="list-inside list-disc space-y-1 leading-relaxed">
        {messages.map((msg) => (
          <li key={msg}>{msg}</li>
        ))}
      </ul>
    </div>
  )
}
