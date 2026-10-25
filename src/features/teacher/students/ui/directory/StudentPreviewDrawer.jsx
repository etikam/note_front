import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'

import { STUDENT_STATUS } from '@/features/teacher/students/ui/directory/studentDirectory.constants'
import { formatCohortDisplay } from '@/shared/lib/formatCohortDisplay'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { StatusPill } from '@/shared/ui/StatusPill'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDate = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d)
}
const GENDER = { M: 'Masculin', F: 'Féminin' }

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2 text-[13px]">
      <dt className="text-[var(--app-muted)]">{label}</dt>
      <dd className="min-w-0 break-words text-[var(--app-fg)]">{children || '—'}</dd>
    </div>
  )
}

/** Aperçu rapide d'un étudiant depuis l'annuaire (données de la ligne). */
export function StudentPreviewDrawer({ student, onClose }) {
  const s = student
  const status = s ? STUDENT_STATUS[s.status] : null
  return (
    <Drawer
      open={Boolean(s)}
      onClose={onClose}
      eyebrow="Étudiant"
      title={s ? `${s.first_name} ${s.last_name}` : ''}
      description={s ? [s.matricule, s.program_code, s.level_name].filter(Boolean).join(' · ') : null}
      width="md"
      footer={
        s ? (
          <div className="flex w-full justify-end gap-2">
            {s.email ? (
              <Button as="a" href={`mailto:${s.email}`} variant="ghost">
                <Mail size={15} aria-hidden /> Écrire
              </Button>
            ) : null}
            <Button as={Link} to={`/teacher/students/${s.id}`}>
              Ouvrir le dossier <ArrowRight size={15} aria-hidden />
            </Button>
          </div>
        ) : null
      }
    >
      {s ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={`${s.first_name} ${s.last_name}`} src={s.photo_url} size="lg" />
            <div className="min-w-0">
              {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
              <p className="mt-1.5 font-mono text-[12px] text-[var(--app-muted)]">INE {s.INE || '—'}</p>
            </div>
          </div>
          <dl className="divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
            <Row label="Programme">{s.program_name ? `${s.program_code} — ${s.program_name}` : s.program_code}</Row>
            <Row label="Niveau">{s.level_name}</Row>
            <Row label="Cohorte">{formatCohortDisplay(s)}</Row>
            <Row label="Département">{s.department_name}</Row>
            <Row label="E-mail">{s.email}</Row>
            <Row label="Sexe">{GENDER[s.gender]}</Row>
            <Row label="Naissance">{fmtDate(s.birth_date)}</Row>
            <Row label="Dossier créé">{fmtDate(s.created_at)}</Row>
          </dl>
        </div>
      ) : null}
    </Drawer>
  )
}
