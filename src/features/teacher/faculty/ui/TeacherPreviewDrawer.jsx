import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'

import { TEACHER_STATUS } from '@/features/teacher/faculty/facultyList.constants'
import { TeacherMandates } from '@/features/teacher/faculty/ui/TeacherMandates'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { StatusPill } from '@/shared/ui/StatusPill'

const GENDER = { M: 'Masculin', F: 'Féminin' }

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2 text-[13px]">
      <dt className="text-[var(--app-muted)]">{label}</dt>
      <dd className="min-w-0 break-words text-[var(--app-fg)]">{children || '—'}</dd>
    </div>
  )
}

/** Aperçu rapide d'un enseignant depuis l'annuaire (données de la ligne). */
export function TeacherPreviewDrawer({ teacher, onClose }) {
  const t = teacher
  const status = t ? TEACHER_STATUS[t.status] : null
  return (
    <Drawer
      open={Boolean(t)}
      onClose={onClose}
      eyebrow="Enseignant"
      title={t ? `${t.first_name} ${t.last_name}` : ''}
      description={t ? [t.matricule, t.grade_name].filter(Boolean).join(' · ') : null}
      width="md"
      footer={
        t ? (
          <div className="flex w-full justify-end gap-2">
            {t.email ? (
              <Button as="a" href={`mailto:${t.email}`} variant="ghost">
                <Mail size={15} aria-hidden /> Écrire
              </Button>
            ) : null}
            <Button as={Link} to={`/teacher/faculty/${t.id}`}>
              Ouvrir la fiche <ArrowRight size={15} aria-hidden />
            </Button>
          </div>
        ) : null
      }
    >
      {t ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={`${t.first_name} ${t.last_name}`} src={t.photo_url} size="lg" />
            <div className="flex flex-wrap gap-1.5">
              {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
              <StatusPill tone={t.is_active ? 'success' : 'neutral'} dot={false}>
                {t.is_active ? 'Compte activé' : 'Compte non activé'}
              </StatusPill>
            </div>
          </div>
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Mandats</h3>
            <div className="text-[13px]">
              <TeacherMandates mandates={t.mandates} withPeriod />
            </div>
          </section>
          <dl className="divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
            <Row label="Charge de l’année">
              {t.courses_count != null ? `${t.courses_count} cours${t.credits_total ? ` · ${t.credits_total} crédits` : ''}` : null}
            </Row>
            <Row label="E-mail">{t.email}</Row>
            <Row label="Téléphone">{t.phone}</Row>
            <Row label="Sexe">{GENDER[t.gender]}</Row>
          </dl>
        </div>
      ) : null}
    </Drawer>
  )
}
