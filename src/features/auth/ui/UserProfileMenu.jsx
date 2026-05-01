import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, UserCircle } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { cn } from '@/shared/lib/cn'

function userDisplayName(user) {
  if (!user) return 'Invité'
  return user.full_name || user.matricule || 'Utilisateur'
}

function userInitials(user) {
  if (!user) return '?'
  const name = user.full_name?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    const a = parts[0]?.[0] ?? ''
    const b = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (a + b).toUpperCase() || '?'
  }
  const m = user.matricule
  if (m && String(m).length >= 2) return String(m).slice(0, 2).toUpperCase()
  return '?'
}

export function UserProfileMenu({ className }) {
  const { user } = useAuth()
  const menuId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e) {
      if (!rootRef.current?.contains(e.target)) close()
    }
    function onKey(e) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  if (!user) return null

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold',
          'bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-white transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-elevated)]'
        )}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        title={userDisplayName(user)}
      >
        {user.photo_url ? (
          <img src={user.photo_url} alt="Profil" className="h-full w-full rounded-full object-cover" />
        ) : (
          userInitials(user)
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Compte"
          className={cn(
            'absolute right-0 top-full mt-2 w-60 z-50',
            'bg-[var(--app-elevated)] rounded-xl border border-[var(--app-border)] shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--app-border)]">
            <UserCircle size={36} className="text-[var(--app-muted)] shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--app-fg)] truncate">{userDisplayName(user)}</p>
              {user.matricule && (
                <p className="text-xs text-[var(--app-muted)] truncate">{user.matricule}</p>
              )}
              {user.email && (
                <p className="text-xs text-[var(--app-muted)] opacity-80 truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-1">
            <Link
              to="/profile"
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--app-fg)] hover:bg-[var(--app-nav-hover)] transition-colors"
              onClick={close}
            >
              <User size={16} className="text-[var(--app-muted)]" aria-hidden />
              <span>Profil</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
