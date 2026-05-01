import { useEffect, useId, useState } from 'react'
import { Mail, MessageCircle, MessageSquare, Smartphone, X } from 'lucide-react'

import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

const CHANNELS = [
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Smartphone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
]

/**
 * Modale notification — canal + message (UI seule, pas d’appel API).
 */
export function StudentNotifyModal({ open, onClose, studentLabel }) {
  const titleId = useId()
  const descId = useId()
  const [channel, setChannel] = useState('email')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) {
      setChannel('email')
      setMessage('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative w-full max-w-lg rounded-2xl border shadow-xl',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-500/15 text-secondary-600 dark:text-secondary-400">
              <MessageSquare size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                Notifier l’étudiant
              </h2>
              {studentLabel ? (
                <p className="text-sm text-[var(--app-muted)] truncate">{studentLabel}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[var(--app-nav-hover)] dark:text-zinc-400 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <p id={descId} className="px-5 text-sm text-[var(--app-muted)]">
          Choisissez un canal puis rédigez le message. L’envoi sera activé lorsque les connecteurs seront branchés.
        </p>

        <div className="px-5 py-4 space-y-4">
          <div>
            <span className="block text-xs font-medium text-[var(--app-muted)] mb-2">Canal</span>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Canal de notification">
              {CHANNELS.map(({ id, label, icon: Icon }) => {
                const selected = channel === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChannel(id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all',
                      selected
                        ? 'border-secondary-500 bg-secondary-50 text-secondary-900 ring-2 ring-secondary-500/20 dark:bg-secondary-950/25 dark:text-secondary-100 dark:border-secondary-500'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] dark:text-zinc-300 dark:hover:border-secondary-600'
                    )}
                  >
                    <Icon size={20} className={selected ? 'text-secondary-700 dark:text-secondary-300' : 'opacity-80'} aria-hidden />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="notify-message" className="block text-xs font-medium text-[var(--app-muted)] mb-1.5">
              Message
            </label>
            <textarea
              id="notify-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contenu du message à envoyer…"
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm resize-y min-h-[7rem]',
                'bg-white dark:bg-[var(--app-elevated)] border-zinc-200 dark:border-[var(--app-border)]',
                'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400'
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 pb-5 pt-1 border-t border-[var(--app-border)] mt-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onClose()
            }}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}
