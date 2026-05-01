import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Unlink } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import {
  deleteCourseAssignment,
  fetchCourseAssignmentDetail,
} from '@/features/teacher/faculty/api/courseAssignmentsApi'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'

const ROLE_LABEL = {
  teacher: 'Enseignant',
  department_head: 'Chef de département',
  study_director: 'Directeur des études',
  program_director: 'Directeur de programme',
  general_director: 'Directeur général',
}

function formatDt(iso) {
  if (!iso) return '—'
  const s = String(iso)
  const d = s.length >= 10 ? new Date(`${s.slice(0, 10)}T12:00:00`) : new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function Row({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--app-border)] py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-right">{value}</dd>
    </div>
  )
}

export function TeacherFacultyCourseAssignmentDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManageCourses = Boolean(user?.capabilities?.can_manage_courses)

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const load = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const d = await fetchCourseAssignmentDetail(courseId)
      setDetail(d)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (canManageCourses) load()
  }, [canManageCourses, load])

  if (!canManageCourses) {
    return <Navigate to="/teacher/faculty/list" replace />
  }

  if (!courseId) {
    return <Navigate to="/teacher/faculty/course-assignments" replace />
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Chargement" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to="/teacher/faculty/course-assignments"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-600 hover:text-brand-600 dark:text-zinc-400"
        >
          <ArrowLeft size={16} aria-hidden />
          Retour aux affectations
        </Link>
        <p className="text-sm text-orange-800 dark:text-orange-200">{error ?? 'Affectation introuvable.'}</p>
      </div>
    )
  }

  const roleKey = detail.teacher_role != null ? String(detail.teacher_role) : ''
  const roleLabel = ROLE_LABEL[roleKey] ?? roleKey

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/teacher/faculty/course-assignments"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-600 hover:text-brand-600 dark:text-zinc-400"
        >
          <ArrowLeft size={16} aria-hidden />
          Retour aux affectations
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="text-red-700 dark:text-red-300" onClick={() => setConfirmOpen(true)}>
            <Unlink size={16} aria-hidden />
            Retirer l’enseignant
          </Button>
        </div>
      </div>

      <header className="border-b border-[var(--app-border)] pb-6">
        <p className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">{detail.code}</p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {detail.name}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-brand-950/45 dark:text-zinc-200">
            <BookOpen size={14} aria-hidden />
            {detail.credits} crédits ECTS
          </span>
          {detail.semester_label ? <span>{detail.semester_label}</span> : null}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Cours</h2>
          <dl className="mt-2">
            <Row label="Département" value={[detail.department_code, detail.department_name].filter(Boolean).join(' — ')} />
            <Row label="Unité d’enseignement" value={[detail.teaching_unit_code, detail.teaching_unit_name].filter(Boolean).join(' — ')} />
            <Row label="Niveau" value={detail.level_name} />
            <Row label="Année académique" value={detail.academic_year_year} />
            <Row label="Semestre" value={detail.semester_number != null ? `S${detail.semester_number}` : null} />
            <Row label="Description" value={detail.description} />
          </dl>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Enseignant affecté</h2>
          <dl className="mt-2">
            <Row label="Nom" value={detail.teacher_name} />
            <Row label="Matricule" value={detail.teacher_matricule} />
            <Row label="E-mail" value={detail.teacher_email} />
            <Row label="Rôle" value={roleLabel} />
            <Row label="Statut" value={detail.teacher_status} />
          </dl>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Traçabilité</h2>
        <dl className="mt-2">
          <Row label="Créé le" value={formatDt(detail.created_at)} />
          <Row label="Mis à jour le" value={formatDt(detail.updated_at)} />
        </dl>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Retirer l’enseignant de ce cours ?"
        message="L’enseignant ne sera plus affecté à cette matière. Vous pourrez assigner un autre enseignant depuis la liste des affectations."
        confirmLabel="Retirer"
        onConfirm={async () => {
          try {
            await deleteCourseAssignment(String(detail.id))
            dispatchToast({ type: 'success', message: 'Affectation retirée.' })
            navigate('/teacher/faculty/course-assignments')
          } catch (e) {
            dispatchToast({ type: 'error', message: e?.message ?? 'Action impossible.' })
            throw e
          }
        }}
      />
    </div>
  )
}
