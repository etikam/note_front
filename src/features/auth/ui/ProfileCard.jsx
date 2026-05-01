import { User } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { formatCohortDisplay } from '@/shared/lib/formatCohortDisplay'

function formatDateFr(value) {
  if (!value) return null
  const s = String(value)
  const d = s.length >= 10 ? new Date(`${s.slice(0, 10)}T12:00:00`) : new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

function DetailRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-zinc-100 dark:border-[var(--app-border)] last:border-0">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 w-32">{label}</dt>
      <dd className="text-xs font-medium text-zinc-800 dark:text-zinc-200 text-right">{value}</dd>
    </div>
  )
}

export function ProfileCard({ profile, type = 'student' }) {
  if (!profile) return null

  const typeLabel = type === 'student' ? 'Étudiant' : 'Enseignant'

  if (type === 'student') {
    const birth = formatDateFr(profile.birth_date)
    const deptLine =
      profile.department_name || profile.department_code
        ? [profile.department_code, profile.department_name].filter(Boolean).join(' — ')
        : profile.department_text || null

    return (
      <div className="rounded-xl border border-zinc-200 dark:border-[var(--app-border)] bg-zinc-50 dark:bg-[var(--app-elevated)] p-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-950/35 dark:text-secondary-200 shrink-0">
            <User size={20} aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {profile.matricule}
              {profile.INE ? ` · INE ${profile.INE}` : null}
            </p>
          </div>
          <Badge tone="success">{typeLabel}</Badge>
        </div>

        <dl>
          <DetailRow label="Genre" value={profile.gender_label || profile.gender || null} />
          <DetailRow label="Date de naissance" value={birth} />
          <DetailRow label="Lieu de naissance" value={profile.birth_place} />
          <DetailRow label="Téléphone" value={profile.phone} />
          <DetailRow label="Département" value={deptLine} />
          <DetailRow label="Niveau" value={profile.level_summary || profile.level_name} />
          <DetailRow label="Cohorte" value={formatCohortDisplay(profile) || null} />
        </dl>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-[var(--app-border)] bg-zinc-50 dark:bg-[var(--app-elevated)] p-4">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-950/35 dark:text-secondary-200 shrink-0">
        <User size={20} aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {profile.first_name} {profile.last_name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {profile.matricule}
          {profile.email_masked ? ` — ${profile.email_masked}` : null}
        </p>
      </div>
      <Badge tone="success">{typeLabel}</Badge>
    </div>
  )
}
