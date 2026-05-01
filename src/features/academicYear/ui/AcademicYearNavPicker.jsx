import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CalendarRange, Check, ChevronDown, RotateCcw } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { cn } from '@/shared/lib/cn'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Spinner } from '@/shared/ui/Spinner'

const STATUS_BADGE = {
  ongoing:   'bg-brand-100 text-brand-800 dark:bg-brand-800/60 dark:text-brand-100',
  upcoming:  'bg-secondary-50 text-secondary-800 ring-1 ring-secondary-200 dark:bg-secondary-950/35 dark:text-secondary-200 dark:ring-secondary-700/60',
  completed: 'bg-zinc-100 text-zinc-500 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)] dark:text-zinc-400',
  inactive:  'bg-zinc-100 text-zinc-400 dark:bg-[color-mix(in_srgb,var(--app-elevated)_75%,white)] dark:text-zinc-500',
}

const STATUS_LABEL = {
  ongoing:   'En cours',
  upcoming:  'À venir',
  completed: 'Terminé',
  inactive:  'Inactif',
}

export function AcademicYearNavPicker({ className }) {
  const listId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [yearSwitchModalOpen, setYearSwitchModalOpen] = useState(false)
  const [pendingYearId, setPendingYearId] = useState(null)

  const {
    academicYearId,
    setAcademicYearId,
    academicYears,
    isLoadingYears,
    refreshAcademicYears,
    academicYearLabel,
  } = useAcademicYear()

  useEffect(() => {
    refreshAcademicYears()
  }, [refreshAcademicYears])

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const displayLabel = academicYearLabel ?? (isLoadingYears ? '…' : '—')

  const pendingYearLabel = useMemo(() => {
    if (pendingYearId == null) return ''
    return academicYears.find((y) => String(y.id) === String(pendingYearId))?.year ?? pendingYearId
  }, [pendingYearId, academicYears])

  const closeYearSwitchModal = useCallback(() => {
    setYearSwitchModalOpen(false)
    setPendingYearId(null)
  }, [])

  const pick = useCallback(
    (id) => {
      const next = String(id)
      if (String(academicYearId ?? '') === next) {
        setOpen(false)
        return
      }
      setPendingYearId(next)
      setYearSwitchModalOpen(true)
      setOpen(false)
    },
    [academicYearId]
  )

  const confirmYearSwitch = useCallback(async () => {
    if (pendingYearId == null) return
    setAcademicYearId(pendingYearId)
    window.location.assign('/')
  }, [pendingYearId, setAcademicYearId])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-all',
          'border border-[var(--app-border)] bg-[var(--app-elevated)] text-[var(--app-fg)] hover:bg-[var(--app-nav-hover)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-elevated)]',
          open && 'border-secondary-500 ring-2 ring-secondary-200/80 dark:ring-secondary-700/50',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        disabled={isLoadingYears}
      >
        {isLoadingYears ? (
          <Spinner size="sm" label="Chargement des années" />
        ) : (
          <CalendarRange size={15} className="text-[var(--app-muted)] shrink-0" aria-hidden />
        )}
        <span className="flex items-center gap-1.5">
          <span className="text-[var(--app-muted)] text-xs">Année</span>
          <span className="font-semibold text-[var(--app-fg)]">{displayLabel}</span>
        </span>
        <ChevronDown
          size={14}
          className={cn('text-[var(--app-muted)] transition-transform duration-200 shrink-0', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Année académique"
          className="absolute left-0 top-full mt-2 w-72 z-50 bg-[var(--app-elevated)] rounded-xl border border-[var(--app-border)] shadow-lg overflow-hidden"
        >
          {/* Header panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)]">
            <span className="text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wide">Années académiques</span>
            <button
              type="button"
              className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--app-muted)] hover:text-[var(--app-fg)] hover:bg-[var(--app-nav-hover)] transition-colors"
              onClick={() => refreshAcademicYears()}
              title="Actualiser"
              aria-label="Actualiser la liste"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="p-1 max-h-64 overflow-y-auto">
            {academicYears.length === 0 && !isLoadingYears ? (
              <p className="text-xs text-[var(--app-muted)] px-3 py-4 text-center">
                Aucune année. Exécutez <code className="bg-zinc-100 dark:bg-[color-mix(in_srgb,var(--app-elevated)_75%,white)] px-1 rounded text-[var(--app-fg)]">seed_academic_years</code>.
              </p>
            ) : (
              academicYears.map((y) => {
                const selected = String(academicYearId) === String(y.id)
                return (
                  <button
                    key={y.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      selected
                        ? 'bg-secondary-50 text-secondary-900 dark:bg-secondary-950/35 dark:text-secondary-100'
                        : 'text-[var(--app-fg)] hover:bg-[var(--app-nav-hover)]'
                    )}
                    onClick={() => pick(y.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn(
                        'font-semibold',
                        selected ? 'text-secondary-900 dark:text-secondary-100' : 'text-[var(--app-fg)]'
                      )}>
                        {y.year}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {y.is_current && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary-600 text-white dark:bg-secondary-500 dark:text-white">
                            Courante
                          </span>
                        )}
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          STATUS_BADGE[y.status] ?? STATUS_BADGE.inactive
                        )}>
                          {STATUS_LABEL[y.status] ?? y.status}
                        </span>
                      </div>
                    </div>
                    {selected && <Check size={15} className="text-secondary-700 dark:text-secondary-300 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={yearSwitchModalOpen}
        onClose={closeYearSwitchModal}
        title="Changer d’année académique ?"
        message={
          pendingYearLabel
            ? `Vous basculez vers l’année « ${pendingYearLabel} ». L’application va se recharger et vous serez renvoyé à l’accueil (redirection selon votre profil).`
            : 'L’application va se recharger et vous serez renvoyé à l’accueil (redirection selon votre profil).'
        }
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        variant="primary"
        onConfirm={confirmYearSwitch}
      />
    </div>
  )
}
