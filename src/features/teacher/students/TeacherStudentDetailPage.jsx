import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Award, Ban, Bell, BookOpen, Download, FileImage, FileText, GraduationCap, Layers, Pencil, Sigma } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { useStudentDetail } from '@/features/teacher/students/hooks/useStudentDetail'
import { STUDENT_STATUS } from '@/features/teacher/students/ui/directory/studentDirectory.constants'
import { StudentEditModal } from '@/features/teacher/students/ui/StudentEditModal'
import { StudentNotifyModal } from '@/features/teacher/students/ui/StudentNotifyModal'
import { StudentSuspendModal } from '@/features/teacher/students/ui/StudentSuspendModal'
import { formatCohortDisplay } from '@/shared/lib/formatCohortDisplay'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatTile } from '@/shared/ui/StatTile'
import { StatusPill } from '@/shared/ui/StatusPill'
import { Tabs } from '@/shared/ui/Tabs'

const ENROLL_STATUS = {
  pending: { label: 'En attente', tone: 'warning' },
  approved: { label: 'Approuvée', tone: 'success' },
  rejected: { label: 'Refusée', tone: 'danger' },
}

const GRADE_STATUS = {
  PASSED: { label: 'Validé', tone: 'success' },
  DEBT: { label: 'Dette', tone: 'danger' },
  NEEDS_MAKEUP: { label: 'Rattrapage', tone: 'warning' },
  INCOMPLETE: { label: 'Incomplet', tone: 'neutral' },
  DRAFT: { label: 'Brouillon', tone: 'neutral' },
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDate = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : dateFmt.format(d)
}
const fmtNote = (v) => (v == null ? '—' : Number(v).toFixed(2).replace('.', ','))

function groupGradesByUe(rows) {
  const groups = new Map()
  for (const r of rows || []) {
    const key = r.ue_code ?? '__none__'
    if (!groups.has(key)) groups.set(key, { key, ueCode: r.ue_code, ueName: r.ue_name, rows: [] })
    groups.get(key).rows.push(r)
  }
  return [...groups.values()]
}

function Info({ label, children, mono = false }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 text-[13px]">
      <dt className="text-[var(--app-muted)]">{label}</dt>
      <dd className={mono ? 'min-w-0 break-words font-mono text-[12.5px] text-[var(--app-fg)]' : 'min-w-0 break-words text-[var(--app-fg)]'}>{children || '—'}</dd>
    </div>
  )
}

const TH = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--app-muted)]'
const TD = 'px-4 py-2.5 align-middle text-[13px] text-[var(--app-fg)]'

function GradesTable({ rows }) {
  const groups = useMemo(() => groupGradesByUe(rows), [rows])
  if (!groups.length) return <EmptyState compact icon={Layers} title="Aucune note" description="Les notes saisies pour cet étudiant apparaîtront ici." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead className="bg-[var(--app-subtle)]">
          <tr className="border-b border-[var(--app-border)]">
            <th className={TH}>Matière</th>
            <th className={TH}>Année · module</th>
            <th className={`${TH} text-right`}>Moyenne</th>
            <th className={TH}>Résultat</th>
            <th className={`${TH} text-right`}>Crédits</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <GroupRows key={g.key} group={g} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GroupRows({ group }) {
  return (
    <>
      <tr className="border-b border-[var(--app-border)] bg-[var(--app-subtle)]/60">
        <td colSpan={5} className="px-4 py-1.5 text-[12px] font-semibold text-[var(--app-fg-soft)]">
          {group.ueCode ? (
            <>
              <span className="font-mono">{group.ueCode}</span>
              {group.ueName ? <span className="font-normal text-[var(--app-muted)]"> · {group.ueName}</span> : null}
            </>
          ) : (
            'Sans unité d’enseignement'
          )}
        </td>
      </tr>
      {group.rows.map((r, i) => {
        const st = GRADE_STATUS[r.status]
        return (
          <tr key={`${r.course_code}-${i}`} className="border-b border-[var(--app-border)] last:border-0">
            <td className={TD}>
              <span className="font-mono text-[11.5px] text-[var(--app-muted)]">{r.course_code}</span> {r.course_name}
            </td>
            <td className={`${TD} text-[var(--app-fg-soft)]`}>
              {r.academic_year ?? '—'}
              {r.module_number != null ? ` · M${r.module_number}` : ''}
            </td>
            <td className={`${TD} text-right font-semibold tabular-nums`}>{fmtNote(r.average)}</td>
            <td className={TD}>
              <span className="flex flex-wrap items-center gap-1.5">
                {st ? <StatusPill tone={st.tone}>{st.label}</StatusPill> : r.status}
                {!r.published ? (
                  <StatusPill tone="neutral" dot={false} title="Fiche du cours non publiée">
                    Non publiée
                  </StatusPill>
                ) : null}
              </span>
            </td>
            <td className={`${TD} text-right tabular-nums`}>{r.credits ?? '—'}</td>
          </tr>
        )
      })}
    </>
  )
}

function EnrollmentsTable({ rows }) {
  if (!rows?.length) return <EmptyState compact icon={BookOpen} title="Aucune inscription" description="Les inscriptions aux cours apparaîtront ici." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <thead className="bg-[var(--app-subtle)]">
          <tr className="border-b border-[var(--app-border)]">
            <th className={TH}>Cours</th>
            <th className={TH}>Année · module</th>
            <th className={TH}>Statut</th>
            <th className={`${TH} text-right`}>Crédits</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const st = ENROLL_STATUS[r.status]
            return (
              <tr key={`${r.course_code}-${i}`} className="border-b border-[var(--app-border)] last:border-0">
                <td className={TD}>
                  <span className="font-mono text-[11.5px] text-[var(--app-muted)]">{r.course_code}</span> {r.course_name}
                </td>
                <td className={`${TD} text-[var(--app-fg-soft)]`}>
                  {r.academic_year} · M{r.module_number}
                </td>
                <td className={TD}>{st ? <StatusPill tone={st.tone}>{st.label}</StatusPill> : r.status}</td>
                <td className={`${TD} text-right tabular-nums`}>{r.credits ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function TeacherStudentDetailPage() {
  const { studentId } = useParams()
  const { validId, loading, error, student, reload } = useStudentDetail(studentId)
  const access = useAccess()
  const canEdit = access.canManage('students.edit_dossier')
  const [tab, setTab] = useState('grades')
  const [modal, setModal] = useState(null)

  const crumbs = [{ label: 'Étudiants', to: '/teacher/students/list' }, { label: student ? `${student.first_name} ${student.last_name}` : 'Dossier' }]

  if (!validId || error || (!loading && !student)) {
    return (
      <div>
        <PageHeader breadcrumbs={crumbs} title="Dossier étudiant" />
        <SectionCard>
          <EmptyState
            tone="error"
            title={!validId ? 'Identifiant invalide' : 'Dossier introuvable'}
            description={error || 'Ce dossier n’existe pas ou n’est pas dans votre périmètre.'}
            action={
              <Button as={Link} to="/teacher/students/list" variant="ghost" size="sm">
                Retour à l’annuaire
              </Button>
            }
          />
        </SectionCard>
      </div>
    )
  }

  if (loading || !student) {
    return (
      <div>
        <PageHeader breadcrumbs={crumbs} title="Dossier étudiant" />
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      </div>
    )
  }

  const s = student
  const status = STUDENT_STATUS[s.status]
  const summary = s.grade_summary ?? {}
  const label = `${s.first_name} ${s.last_name} · ${s.matricule}`
  const enrollments = s.enrollment_history ?? []
  const pendingEnrollments = enrollments.filter((e) => e.status === 'pending').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={crumbs}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={`${s.first_name} ${s.last_name}`} src={s.photo_url} size="md" />
            {s.first_name} {s.last_name}
          </span>
        }
        description={[s.program_code ? `${s.program_code}${s.program_name && s.program_name !== s.program_code ? ` — ${s.program_name}` : ''}` : s.department_name, s.level_name, formatCohortDisplay(s)].filter(Boolean).join(' · ') || 'Sans niveau rattaché'}
        meta={
          <>
            {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
            <span className="font-mono text-[12px] text-[var(--app-muted)]">{s.matricule}</span>
            <span className="text-[12px] text-[var(--app-muted)]">{s.is_activated ? 'Compte activé' : 'Compte non activé'}</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setModal('notify')}>
              <Bell size={15} aria-hidden /> Notifier
            </Button>
            {canEdit ? (
              <>
                <Button variant="ghost" className="text-red-700 dark:text-red-300" onClick={() => setModal('suspend')}>
                  <Ban size={15} aria-hidden /> Suspendre
                </Button>
                <Button onClick={() => setModal('edit')}>
                  <Pencil size={15} aria-hidden /> Modifier
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Sigma} tone="brand" label="Moyenne générale" value={summary.average_gpa != null ? `${fmtNote(summary.average_gpa)} / 10` : '—'} hint="notes publiées" />
        <StatTile icon={Award} tone="success" label="Crédits validés" value={summary.credits_earned ?? 0} />
        <StatTile icon={GraduationCap} label="Cours réussis" value={summary.passed_courses_count ?? 0} />
        <StatTile icon={BookOpen} tone={pendingEnrollments ? 'warning' : 'neutral'} label="Inscriptions" value={enrollments.length} hint={pendingEnrollments ? `${pendingEnrollments} en attente` : null} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard flush>
          <Tabs
            className="px-2"
            value={tab}
            onChange={setTab}
            ariaLabel="Dossier étudiant"
            tabs={[
              { id: 'grades', label: 'Notes', icon: Layers, count: s.grades_courses?.length ?? 0 },
              { id: 'enrollments', label: 'Inscriptions', icon: BookOpen, count: enrollments.length },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ]}
          />
          {tab === 'grades' ? <GradesTable rows={s.grades_courses} /> : null}
          {tab === 'enrollments' ? <EnrollmentsTable rows={enrollments} /> : null}
          {tab === 'notifications' ? (
            <EmptyState
              compact
              icon={Bell}
              title={(s.notifications ?? []).length ? `${s.notifications.length} notification(s)` : 'Aucune notification envoyée'}
              description="L’historique des envois (e-mail, SMS, WhatsApp) apparaîtra ici."
              action={
                <Button size="sm" variant="soft" onClick={() => setModal('notify')}>
                  <Bell size={14} aria-hidden /> Notifier l’étudiant
                </Button>
              }
            />
          ) : null}
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title="Informations personnelles">
            <dl className="-my-2 divide-y divide-[var(--app-border)]">
              <Info label="INE" mono>
                {s.INE}
              </Info>
              <Info label="E-mail">{s.email}</Info>
              <Info label="Téléphone">{s.phone}</Info>
              <Info label="Naissance">{[fmtDate(s.birth_date), s.birth_place].filter(Boolean).join(' · ')}</Info>
              <Info label="Parents">{[s.dad_name, s.mum_name].filter(Boolean).join(' · ')}</Info>
              <Info label="Entrée">{s.entered_academic_year_year}</Info>
              <Info label="Dossier créé">{fmtDate(s.created_at)}</Info>
            </dl>
          </SectionCard>
          <SectionCard title="Documents">
            {s.documents?.length ? (
              <ul className="-my-1 divide-y divide-[var(--app-border)]">
                {s.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 py-2 text-[13px]">
                    {doc.type === 'image' ? <FileImage size={16} className="text-[var(--app-muted)]" aria-hidden /> : <FileText size={16} className="text-[var(--app-muted)]" aria-hidden />}
                    <span className="min-w-0 flex-1 truncate">{doc.label}</span>
                    {doc.url ? (
                      <a href={doc.url} download target="_blank" rel="noreferrer" className="rounded-md p-1 text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]" aria-label={`Télécharger ${doc.label}`}>
                        <Download size={15} />
                      </a>
                    ) : (
                      <StatusPill tone="warning" dot={false}>
                        Manquant
                      </StatusPill>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[var(--app-muted)]">Aucun document enregistré.</p>
            )}
          </SectionCard>
        </div>
      </div>

      <StudentSuspendModal open={modal === 'suspend'} onClose={() => setModal(null)} studentLabel={label} />
      <StudentEditModal open={modal === 'edit'} onClose={() => setModal(null)} student={s} onSaved={reload} />
      <StudentNotifyModal open={modal === 'notify'} onClose={() => setModal(null)} studentLabel={label} />
    </div>
  )
}
