import { useEffect, useMemo, useState } from 'react'
import { Bell, Globe, Mail, MessageSquare, Palette, Save, Trash2, Upload, User2 } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { StudentProfileSection } from '@/features/profile/ui/StudentProfileSection'
import { useStudentProfile } from '@/features/student/hooks/useStudentResources'
import { ThemeModeToggle } from '@/features/theme/ui/ThemeControls'
import { deleteMyPhoto, fetchMyPreferences, patchMyPhoto, patchMyPreferences } from '@/features/auth/api/authApi'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'

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

export function ProfilePage() {
  const { user, refreshMe } = useAuth()
  const isStudent = user?.role === 'student'
  const { data: studentProfile, loading: studentProfileLoading, reload: reloadStudentProfile } =
    useStudentProfile(isStudent)
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingPrefs(true)
      try {
        const data = await fetchMyPreferences()
        if (cancelled) return
        setPrefs({
          ...defaultPrefs,
          ...data,
        })
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

  if (!user) {
    return <p className="text-muted">Non connecté.</p>
  }

  const roleLabel = useMemo(() => {
    if (user.role === 'student') return 'Étudiant'
    if (user.role !== 'teacher') return user.role
    const codes = Array.isArray(user.teacher_role_codes) ? user.teacher_role_codes : []
    const priority = ['general_director', 'study_director', 'department_head', 'program_director', 'teacher']
    return priority.find((code) => codes.includes(code)) ?? 'teacher'
  }, [user])

  const displayName = isStudent && studentProfile
    ? `${studentProfile.first_name} ${studentProfile.last_name}`.trim()
    : user.full_name

  const savePrefs = () => {
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
  }

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('photo', file)
    setUploadingPhoto(true)
    try {
      await patchMyPhoto(formData)
      await refreshMe()
      dispatchToast({ type: 'success', message: 'Photo de profil mise à jour.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message ?? 'Upload photo impossible.' })
    } finally {
      setUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const onDeletePhoto = async () => {
    setUploadingPhoto(true)
    try {
      await deleteMyPhoto()
      await refreshMe()
      dispatchToast({ type: 'success', message: 'Photo de profil supprimée.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message ?? 'Suppression photo impossible.' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-brand-200/70 bg-gradient-to-r from-brand-50 to-secondary-50 px-5 py-5 dark:border-brand-500/30 dark:from-brand-900/35 dark:to-secondary-900/20">
        <h1 className="font-heading text-2xl font-bold text-zinc-900 dark:text-zinc-50">Mon profil</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {isStudent
            ? 'Votre dossier étudiant, coordonnées modifiables et préférences d’interface.'
            : 'Gérez vos informations de compte et vos préférences d’affichage/notifications.'}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
        <Card className="border-zinc-300/90 p-5 dark:border-[var(--app-border)]">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              <User2 size={16} />
            </span>
            <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Identité</h2>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200/90 bg-zinc-50 p-3 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-brand-200 bg-white dark:border-brand-600/40 dark:bg-[var(--app-elevated)]">
              {user.photo_url ? (
                <img src={user.photo_url} alt="Photo profil" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-600 dark:text-brand-300">
                  {(user.full_name || user.matricule || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] dark:text-zinc-200">
                <Upload size={14} />
                {uploadingPhoto ? 'Envoi...' : 'Changer la photo'}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={onPhotoChange}
                  disabled={uploadingPhoto}
                />
              </label>
              {user.photo_url ? (
                <Button type="button" variant="ghost" onClick={onDeletePhoto} disabled={uploadingPhoto}>
                  <Trash2 size={14} />
                  Supprimer
                </Button>
              ) : null}
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Nom complet</dt>
              <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{displayName || '—'}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Matricule</dt>
              <dd className="mt-1 font-mono text-zinc-900 dark:text-zinc-100">
                {studentProfile?.matricule ?? user.matricule ?? '—'}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)] sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Email</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                {studentProfile?.email ?? user.email ?? '—'}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Rôle</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{roleLabel}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Statut</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                {isStudent && studentProfile?.status
                  ? studentProfile.status
                  : user.is_active
                    ? 'Actif'
                    : 'Inactif'}
              </dd>
            </div>
          </dl>
        </Card>

        {isStudent ? (
          <StudentProfileSection
            profile={studentProfile}
            loading={studentProfileLoading}
            onReload={reloadStudentProfile}
          />
        ) : null}
        </div>

        <Card className="border-zinc-300/90 p-5 dark:border-[var(--app-border)]">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-200">
              <Palette size={16} />
            </span>
            <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Préférences</h2>
          </div>

          {loadingPrefs ? (
            <div className="flex min-h-[16rem] items-center justify-center">
              <Spinner label="Chargement des préférences" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200/90 p-3 dark:border-[var(--app-border)]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Thème d’interface</p>
                <ThemeModeToggle />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Globe size={14} /> Langue
                  </span>
                  <select
                    value={prefs.language}
                    onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                    className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </label>
                {!isStudent ? (
                  <label className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <Palette size={14} /> Accent dashboard
                    </span>
                    <select
                      value={prefs.dashboard_accent}
                      onChange={(e) => setPrefs((p) => ({ ...p, dashboard_accent: e.target.value }))}
                      className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
                    >
                      <option value="navy">Navy</option>
                      <option value="indigo">Indigo</option>
                      <option value="orange">Orange</option>
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="rounded-xl border border-zinc-200/90 p-3 dark:border-[var(--app-border)]">
                <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Bell size={14} /> Notifications
                </p>
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={prefs.email_notifications_enabled}
                      onChange={(e) => setPrefs((p) => ({ ...p, email_notifications_enabled: e.target.checked }))}
                    />
                    <Mail size={14} /> Email
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={prefs.sms_notifications_enabled}
                      onChange={(e) => setPrefs((p) => ({ ...p, sms_notifications_enabled: e.target.checked }))}
                    />
                    <MessageSquare size={14} /> SMS
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={prefs.push_notifications_enabled}
                      onChange={(e) => setPrefs((p) => ({ ...p, push_notifications_enabled: e.target.checked }))}
                    />
                    <Bell size={14} /> Push
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={prefs.compact_mode}
                      onChange={(e) => setPrefs((p) => ({ ...p, compact_mode: e.target.checked }))}
                    />
                    Mode compact
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={savePrefs} disabled={savingPrefs}>
                  <Save size={14} />
                  {savingPrefs ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}
