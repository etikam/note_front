import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Award, BookOpen, Camera, GraduationCap, Layers, Pencil, ShieldCheck, Trash2 } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { deleteTeacherPhoto, fetchTeacherDetail, patchTeacherPhoto } from '@/features/teacher/faculty/api/teachersApi'
import { TEACHER_STATUS } from '@/features/teacher/faculty/facultyList.constants'
import { MandatesHint, TeacherMandates } from '@/features/teacher/faculty/ui/TeacherMandates'
import { TeacherEditModal } from '@/features/teacher/faculty/ui/TeacherEditModal'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatTile } from '@/shared/ui/StatTile'
import { StatusPill } from '@/shared/ui/StatusPill'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDate = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : dateFmt.format(d)
}
const GENDER = { M: 'Masculin', F: 'Féminin' }

function Info({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2 text-[13px]">
      <dt className="text-[var(--app-muted)]">{label}</dt>
      <dd className="min-w-0 break-words text-[var(--app-fg)]">{children || '—'}</dd>
    </div>
  )
}

export function TeacherFacultyDetailPage() {
  const { teacherId } = useParams()
  const id = Number(teacherId)
  const navigate = useNavigate()
  const access = useAccess()
  const canEdit = access.canGlobal('teachers.provision')
  const canAssign = access.canManage('courses.assign')
  const { academicYearLabel } = useAcademicYear()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoInput = useRef(null)
  const validId = Number.isFinite(id) && id > 0

  const load = useCallback(async () => {
    if (!validId) return
    setLoading(true)
    setError('')
    try {
      setDetail(await fetchTeacherDetail(id))
    } catch (err) {
      setError(err?.message || 'Chargement impossible.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [id, validId])

  useEffect(() => {
    void load()
  }, [load])

  async function changePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoBusy(true)
    try {
      setDetail(await patchTeacherPhoto(detail.id, file))
      dispatchToast({ type: 'success', message: 'Photo mise à jour.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message ?? 'Envoi de la photo impossible.' })
    } finally {
      setPhotoBusy(false)
      event.target.value = ''
    }
  }

  async function removePhoto() {
    setPhotoBusy(true)
    try {
      setDetail(await deleteTeacherPhoto(detail.id))
      dispatchToast({ type: 'success', message: 'Photo supprimée.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message ?? 'Suppression impossible.' })
    } finally {
      setPhotoBusy(false)
    }
  }

  const courses = useMemo(() => (Array.isArray(detail?.assigned_courses) ? detail.assigned_courses : []), [detail])
  const currentYear = academicYearLabel
  const yearCourses = currentYear ? courses.filter((c) => c.module_label?.startsWith(currentYear)) : courses
  const yearCredits = yearCourses.reduce((n, c) => n + (Number(c.credits) || 0), 0)
  const programs = new Set(yearCourses.map((c) => c.program_code).filter(Boolean))

  const crumbs = [{ label: 'Enseignants', to: '/teacher/faculty/list' }, { label: detail ? `${detail.first_name} ${detail.last_name}` : 'Fiche' }]

  if (!validId || error || (!loading && !detail)) {
    return (
      <div>
        <PageHeader breadcrumbs={crumbs} title="Fiche enseignant" />
        <SectionCard>
          <EmptyState
            tone="error"
            title={!validId ? 'Identifiant invalide' : 'Fiche introuvable'}
            description={error || 'Cette fiche n’existe pas ou n’est pas dans votre périmètre.'}
            action={
              <Button as={Link} to="/teacher/faculty/list" variant="ghost" size="sm">
                Retour à l’annuaire
              </Button>
            }
          />
        </SectionCard>
      </div>
    )
  }
  if (loading || !detail) {
    return (
      <div>
        <PageHeader breadcrumbs={crumbs} title="Fiche enseignant" />
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      </div>
    )
  }

  const d = detail
  const status = TEACHER_STATUS[d.status]
  const columns = [
    {
      key: 'course',
      header: 'Cours',
      sortValue: (c) => c.code,
      cell: (c) => (
        <span className="flex flex-col">
          <span className="font-medium">{c.name}</span>
          <span className="font-mono text-[11.5px] text-[var(--app-muted)]">{c.code}</span>
        </span>
      ),
    },
    {
      key: 'program',
      header: 'Programme · niveau',
      sortValue: (c) => c.program_code ?? '',
      cell: (c) => (
        <span className="flex flex-col">
          <span>{c.program_code ?? '—'}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">{c.level_name ?? '—'}</span>
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Année · module',
      sortValue: (c) => c.module_label ?? '',
      cell: (c) => (
        <span className="text-[var(--app-fg-soft)]">
          {c.module_label ?? '—'}
          {c.semester ? ` · S${c.semester}` : ''}
        </span>
      ),
    },
    { key: 'credits', header: 'Crédits', align: 'right', sortValue: (c) => Number(c.credits) || 0, cell: (c) => c.credits ?? '—' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={crumbs}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={`${d.first_name} ${d.last_name}`} src={d.photo_url} size="md" />
            {d.first_name} {d.last_name}
          </span>
        }
        description={[d.grade_name, d.has_phd ? 'Docteur' : null, d.mandates?.length ? d.mandates.map((m) => m.role_name).join(', ') : 'Enseignant'].filter(Boolean).join(' · ')}
        meta={
          <>
            {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
            <span className="font-mono text-[12px] text-[var(--app-muted)]">{d.matricule}</span>
            <span className="text-[12px] text-[var(--app-muted)]">{d.is_activated ? 'Compte activé' : 'Compte non activé'}</span>
          </>
        }
        actions={
          <>
            {canAssign ? (
              <Button as={Link} to="/teacher/faculty/course-assignments" variant="ghost">
                <BookOpen size={15} aria-hidden /> Affectations
              </Button>
            ) : null}
            {canEdit ? (
              <Button onClick={() => setEditOpen(true)}>
                <Pencil size={15} aria-hidden /> Modifier
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={BookOpen} tone="brand" label={currentYear ? `Cours en ${currentYear}` : 'Cours affectés'} value={yearCourses.length} hint={currentYear ? `${courses.length} au total` : null} />
        <StatTile icon={Layers} label="Crédits de l’année" value={yearCredits} />
        <StatTile icon={GraduationCap} label="Programmes" value={programs.size} hint={[...programs].join(', ') || null} />
        <StatTile icon={Award} label="Expérience" value={d.years_of_experience != null ? `${d.years_of_experience} an${d.years_of_experience > 1 ? 's' : ''}` : '—'} hint={d.hire_date ? `depuis le ${fmtDate(d.hire_date)}` : null} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard title="Cours affectés" description="Toutes années confondues" flush>
          <DataTable
            className="rounded-none border-0"
            columns={columns}
            rows={courses}
            onRowClick={canAssign ? (c) => navigate(`/teacher/faculty/course-assignments/${c.id}`) : undefined}
            initialSort={{ key: 'module', dir: 'desc' }}
            empty={{ title: 'Aucun cours affecté', description: canAssign ? 'Affectez-lui des cours depuis l’onglet Affectations.' : undefined }}
          />
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title="Mandats" actions={<ShieldCheck size={16} className="text-[var(--app-muted)]" aria-hidden />}>
            <div className="text-[13px]">
              <TeacherMandates mandates={d.mandates} withPeriod />
            </div>
            <div className="mt-3 border-t border-[var(--app-border)] pt-3">
              <MandatesHint />
            </div>
          </SectionCard>

          <SectionCard
            title="Informations"
            actions={
              canEdit ? (
                <div className="flex gap-1">
                  <input ref={photoInput} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={changePhoto} disabled={photoBusy} aria-label="Nouvelle photo" />
                  <Button size="sm" variant="ghost" onClick={() => photoInput.current?.click()} disabled={photoBusy} title="Changer la photo">
                    <Camera size={14} aria-hidden />
                  </Button>
                  {d.photo_url ? (
                    <Button size="sm" variant="ghost" onClick={removePhoto} disabled={photoBusy} title="Retirer la photo" className="text-red-700 dark:text-red-300">
                      <Trash2 size={14} aria-hidden />
                    </Button>
                  ) : null}
                </div>
              ) : null
            }
          >
            <dl className="-my-2 divide-y divide-[var(--app-border)]">
              <Info label="E-mail">{d.email}</Info>
              <Info label="Téléphone">{d.phone}</Info>
              <Info label="Sexe">{GENDER[d.gender]}</Info>
              <Info label="Naissance">{fmtDate(d.birth_date)}</Info>
              <Info label="Embauche">{fmtDate(d.hire_date)}</Info>
              <Info label="Fiche créée">{fmtDate(d.created_at)}</Info>
            </dl>
            {d.bio?.trim() ? <p className="mt-3 whitespace-pre-wrap border-t border-[var(--app-border)] pt-3 text-[13px] leading-relaxed text-[var(--app-fg-soft)]">{d.bio.trim()}</p> : null}
          </SectionCard>
        </div>
      </div>

      {canEdit ? <TeacherEditModal open={editOpen} onClose={() => setEditOpen(false)} teacher={d} onSaved={load} /> : null}
    </div>
  )
}
