import { AlertTriangle } from 'lucide-react'

/**
 * Problèmes d'en-têtes bloquants.
 * @param {{ messages: string[] }} props
 */
export function HeaderIssuesAlert({ messages }) {
  if (!messages?.length) return null
  return (
    <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100" role="alert">
      <AlertTriangle className="mt-0.5 shrink-0 text-red-600 dark:text-red-300" size={17} aria-hidden />
      <div>
        <p className="font-semibold">En-têtes à corriger avant l’import</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 leading-relaxed">
          {messages.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
