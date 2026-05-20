import { useEffect, useState } from 'react'
import { GraduationCap, Save } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { patchStudentProfile } from '@/features/student/api/studentApi'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'

const EDITABLE_FIELDS = [
  { key: 'phone', label: 'Téléphone' },
  { key: 'bio', label: 'Biographie', multiline: true },
  { key: 'birth_place', label: 'Lieu de naissance' },
  { key: 'dad_name', label: 'Nom du père' },
  { key: 'mum_name', label: 'Nom de la mère' },
]

/** Bloc dossier étudiant (lecture scolarité + champs PATCH autorisés). */
export function StudentProfileSection({ profile, loading, onReload }) {
  const { refreshMe } = useAuth()
  const [form, setForm] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
        birth_place: profile.birth_place ?? '',
        dad_name: profile.dad_name ?? '',
        mum_name: profile.mum_name ?? '',
      })
    }
  }, [profile])

  if (loading || !profile) {
    return (
      <Card className="p-8">
        <Spinner size="lg" label="Chargement du dossier étudiant" />
      </Card>
    )
  }

  const onSave = async () => {
    setSaving(true)
    setFieldErrors({})
    try {
      await patchStudentProfile(form)
      dispatchToast({ type: 'success', message: 'Profil mis à jour.' })
      onReload?.()
      await refreshMe()
    } catch (err) {
      const details = err?.details ?? err?.response?.data?.details ?? err?.response?.data
      if (details && typeof details === 'object' && !details.error) {
        setFieldErrors(details)
      } else if (details?.details) {
        setFieldErrors(details.details)
      }
      dispatchToast({ type: 'error', message: err?.message ?? 'Enregistrement impossible.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card className="border-zinc-300/90 p-5 dark:border-[var(--app-border)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            <GraduationCap size={16} aria-hidden />
          </span>
          <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Scolarité</h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Niveau</dt>
            <dd className="mt-1 font-medium">{profile.level_name ?? '—'}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Département</dt>
            <dd className="mt-1">{profile.department_name ?? '—'}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)] sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Cohorte</dt>
            <dd className="mt-1">{profile.cohorte_label || '—'}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">INE</dt>
            <dd className="mt-1 font-mono">{profile.INE}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Statut dossier</dt>
            <dd className="mt-1">{profile.status}</dd>
          </div>
        </dl>
      </Card>

      <Card className="border-zinc-300/90 p-5 dark:border-[var(--app-border)]">
        <h2 className="mb-4 font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Contact & filiation</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Seuls ces champs sont modifiables. Matricule, identité et scolarité sont gérés par l&apos;établissement.
        </p>
        <div className="space-y-4">
          {EDITABLE_FIELDS.map(({ key, label, multiline }) => (
            <div key={key}>
              <label htmlFor={`student-${key}`} className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {label}
              </label>
              {multiline ? (
                <textarea
                  id={`student-${key}`}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
                  value={form[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              ) : (
                <input
                  id={`student-${key}`}
                  type="text"
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
                  value={form[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              )}
              {fieldErrors[key] ? <p className="mt-1 text-xs text-red-600">{String(fieldErrors[key])}</p> : null}
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="button" onClick={onSave} disabled={saving} className="min-h-[44px]">
              <Save size={14} />
              {saving ? 'Enregistrement…' : 'Enregistrer le dossier'}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}
