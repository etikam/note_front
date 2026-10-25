import { Link } from 'react-router-dom'

import { useAccess } from '@/features/access/model/useAccess'
import { formatPeriod } from '@/features/admin/model/accessLabels'

/** Mandats actifs d'un enseignant (``teacher.mandates``) ; « Enseignant » s'il n'en a aucun. */
export function TeacherMandates({ mandates, compact = false, withPeriod = false }) {
  const list = Array.isArray(mandates) ? mandates : []
  if (!list.length) return <span className="text-[var(--app-muted)]">Enseignant</span>
  if (compact) {
    return (
      <span className="flex flex-col gap-0.5">
        {list.map((m) => (
          <span key={m.assignment_id} className="line-clamp-1" title={`${m.role_name} · ${m.target_label}`}>
            <span className="text-[var(--app-fg)]">{m.role_name}</span>
            {m.scope_level !== 'institution' ? <span className="text-[var(--app-muted)]"> · {m.target_label}</span> : null}
          </span>
        ))}
      </span>
    )
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {list.map((m) => (
        <li key={m.assignment_id}>
          <span className="font-medium text-[var(--app-fg)]">{m.role_name}</span>
          {m.scope_level !== 'institution' ? <span className="text-[var(--app-fg-soft)]"> · {m.target_label}</span> : null}
          {withPeriod ? <span className="block text-[11.5px] text-[var(--app-muted)]">{formatPeriod(m.starts_on, m.ends_on)}</span> : null}
        </li>
      ))}
    </ul>
  )
}

/** Rappel : les rôles se donnent par nomination ; lien direct si l'utilisateur peut nommer. */
export function MandatesHint() {
  const access = useAccess()
  return (
    <p className="text-[12px] leading-relaxed text-[var(--app-muted)]">
      Les responsabilités (chef de département, directeur de programme…) s’attribuent par nomination, avec un périmètre et
      une période.{' '}
      {access.canManage('access.assign_roles') ? (
        <Link to="/admin/nominations" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Gérer les nominations
        </Link>
      ) : null}
    </p>
  )
}
