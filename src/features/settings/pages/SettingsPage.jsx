import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  Globe,
  Layout,
  Link2,
  Palette,
  PanelLeftClose,
  Save,
  Sparkles,
} from 'lucide-react'

import { fetchMyPreferences, patchMyPreferences } from '@/features/auth/api/authApi'
import { ThemeModeToggle } from '@/features/theme/ui/ThemeControls'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

/** Aligné sur [DashboardLayout](src/app/layouts/DashboardLayout.jsx). */
const SIDEBAR_STORAGE_KEY = 'gestion_ci.sidebar.collapsed'

const SIDEBAR_PREF_EVENT = 'gestion_ci:sidebar-pref-changed'

const defaultPrefs = {
  theme: 'light',
  language: 'fr',
  email_notifications_enabled: true,
  sms_notifications_enabled: false,
  push_notifications_enabled: false,
  compact_mode: false,
  dashboard_accent: 'navy',
  notification_preferences: {},
}

const SECTIONS = [
  { id: 'appearance', label: 'Apparence', icon: Sparkles, desc: 'Thème et densité' },
  { id: 'preferences', label: 'Compte & notifications', icon: Bell, desc: 'Langue, canaux, accent' },
  { id: 'layout', label: 'Navigation', icon: Layout, desc: 'Barre latérale' },
]

function notifySidebarPrefChanged() {
  window.dispatchEvent(new CustomEvent(SIDEBAR_PREF_EVENT))
}

function SwitchRow({ checked, onChange, label, description }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-colors',
        checked
          ? 'border-brand-400/50 bg-brand-500/[0.07] dark:border-brand-500/35'
          : 'border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,transparent)] hover:border-[var(--app-border)]/80',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--app-fg)]">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-[var(--app-muted)]">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--app-border)] text-brand-600 focus:ring-brand-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

export function SettingsPage() {
  const [active, setActive] = useState('appearance')
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [sidebarDefaultCollapsed, setSidebarDefaultCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1' : false,
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingPrefs(true)
      try {
        const data = await fetchMyPreferences()
        if (!cancelled) setPrefs({ ...defaultPrefs, ...data })
      } catch (err) {
        if (!cancelled) dispatchToast({ type: 'error', message: err?.message ?? 'Chargement des préférences impossible.' })
      } finally {
        if (!cancelled) setLoadingPrefs(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const savePrefs = useCallback(() => {
    setSavingPrefs(true)
    ;(async () => {
      try {
        const updated = await patchMyPreferences(prefs)
        setPrefs((p) => ({ ...p, ...updated }))
        dispatchToast({ type: 'success', message: 'Préférences enregistrées.' })
      } catch (err) {
        dispatchToast({ type: 'error', message: err?.message ?? 'Enregistrement impossible.' })
      } finally {
        setSavingPrefs(false)
      }
    })()
  }, [prefs])

  const setSidebarDefault = useCallback((collapsed) => {
    setSidebarDefaultCollapsed(collapsed)
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
    notifySidebarPrefChanged()
    dispatchToast({
      type: 'success',
      message: collapsed ? 'Barre latérale repliée par défaut enregistrée.' : 'Barre latérale dépliée par défaut enregistrée.',
    })
  }, [])

  const selectClass =
    'h-10 w-full rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_96%,transparent)] px-3 text-sm text-[var(--app-fg)] outline-none focus:ring-2 focus:ring-brand-500/40'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.07] via-transparent to-secondary-500/[0.08]"
          aria-hidden
        />
        <div className="relative p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Institution</p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">Paramètres</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
            Personnalisez l’interface, les notifications et le comportement de la navigation. Les changements de compte
            détaillés (photo, identité) restent sur{' '}
            <Link to="/profile" className="font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400">
              Mon profil
            </Link>
            .
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav
          className="shrink-0 lg:w-56"
          aria-label="Sections des paramètres"
        >
          <ul className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              const isActive = active === s.id
              return (
                <li key={s.id} className="shrink-0 lg:w-full">
                  <button
                    type="button"
                    onClick={() => setActive(s.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all lg:px-3.5 lg:py-3',
                      isActive
                        ? 'border-brand-400/50 bg-brand-500/10 text-[var(--app-fg)] shadow-sm dark:border-brand-500/40'
                        : 'border-transparent bg-[color-mix(in_srgb,var(--app-elevated)_92%,transparent)] text-[var(--app-muted)] hover:border-[var(--app-border)] hover:text-[var(--app-fg)]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                        isActive
                          ? 'bg-brand-500/15 text-brand-700 ring-brand-500/20 dark:text-brand-200'
                          : 'bg-[var(--app-canvas)] text-[var(--app-muted)] ring-[var(--app-border)]',
                      )}
                    >
                      <Icon size={18} strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 max-lg:max-w-[10rem]">
                      <span className="block text-sm font-semibold leading-tight">{s.label}</span>
                      <span className="mt-0.5 hidden text-[11px] text-[var(--app-muted)] lg:block">{s.desc}</span>
                    </span>
                    <ChevronRight
                      className={cn('hidden h-4 w-4 shrink-0 text-[var(--app-muted)] lg:block', isActive && 'text-brand-600 dark:text-brand-400')}
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {active === 'appearance' && (
            <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300">
                  <Sparkles size={20} aria-hidden />
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-[var(--app-fg)]">Apparence</h2>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">Thème clair ou sombre pour tout le tableau de bord.</p>
                </div>
              </div>
              <div className="max-w-md rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] p-4">
                <ThemeModeToggle />
              </div>
            </section>
          )}

          {active === 'preferences' && (
            <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-500/12 text-secondary-800 ring-1 ring-secondary-500/20 dark:text-secondary-200">
                    <Bell size={20} aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-[var(--app-fg)]">Compte & notifications</h2>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">Langue, accent visuel et canaux de notification.</p>
                  </div>
                </div>
                <Button type="button" variant="primary" onClick={savePrefs} disabled={savingPrefs || loadingPrefs} className="shrink-0 gap-2">
                  <Save size={16} aria-hidden />
                  {savingPrefs ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </div>

              {loadingPrefs ? (
                <div className="flex min-h-[14rem] items-center justify-center">
                  <Spinner label="Chargement des préférences" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                        <Globe size={14} aria-hidden /> Langue
                      </span>
                      <select
                        value={prefs.language}
                        onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                        <Palette size={14} aria-hidden /> Accent dashboard
                      </span>
                      <select
                        value={prefs.dashboard_accent}
                        onChange={(e) => setPrefs((p) => ({ ...p, dashboard_accent: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="navy">Navy</option>
                        <option value="indigo">Indigo</option>
                        <option value="orange">Orange</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">Notifications</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <SwitchRow
                        label="Courriel"
                        description="Alertes et récapitulatifs par email."
                        checked={prefs.email_notifications_enabled}
                        onChange={(v) => setPrefs((p) => ({ ...p, email_notifications_enabled: v }))}
                      />
                      <SwitchRow
                        label="SMS"
                        description="Messages courts sur mobile."
                        checked={prefs.sms_notifications_enabled}
                        onChange={(v) => setPrefs((p) => ({ ...p, sms_notifications_enabled: v }))}
                      />
                      <SwitchRow
                        label="Notifications push"
                        description="Navigateur ou application."
                        checked={prefs.push_notifications_enabled}
                        onChange={(v) => setPrefs((p) => ({ ...p, push_notifications_enabled: v }))}
                      />
                      <SwitchRow
                        label="Mode compact"
                        description="Listes et cartes plus denses."
                        checked={prefs.compact_mode}
                        onChange={(v) => setPrefs((p) => ({ ...p, compact_mode: v }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {active === 'layout' && (
            <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-500/10 text-zinc-700 ring-1 ring-zinc-500/15 dark:text-zinc-200">
                  <PanelLeftClose size={20} aria-hidden />
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-[var(--app-fg)]">Navigation</h2>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Défaut au chargement : barre latérale repliée ou dépliée (grand écran uniquement).
                  </p>
                </div>
              </div>
              <div className="grid max-w-xl gap-3">
                <SwitchRow
                  label="Replier la barre latérale par défaut"
                  description="Gain de place sur les tableaux ; vous pouvez toujours l’ouvrir via le bouton dans l’en-tête de la barre."
                  checked={sidebarDefaultCollapsed}
                  onChange={setSidebarDefault}
                />
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-[var(--app-muted)]">
                <Link2 size={12} aria-hidden />
                Astuce : le bouton de repli dans la sidebar applique aussi cette préférence automatiquement.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
