import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookMarked, BookOpen, ChevronRight } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { fetchTeacherDetail } from '@/features/teacher/faculty/api/teachersApi'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'

export function TeacherFacultyDetailPage() {
  const { teacherId } = useParams()
  const id = Number(teacherId)
  const { user } = useAuth()
  const canProvision = Boolean(user?.capabilities?.can_provision_teacher)
  const canManageCourses = Boolean(user?.capabilities?.can_manage_courses)

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Identifiant invalide.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const d = await fetchTeacherDetail(id)
      setDetail(d)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (canProvision) load()
  }, [canProvision, load])

  if (!canProvision) return null

  if (!Number.isFinite(id) || id <= 0) {
    return <p className="text-error text-sm">Identifiant invalide.</p>
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
      <div className="space-y-4">
        <Link
          to="/teacher/faculty/list"
          className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400"
        >
          <ArrowLeft size={14} aria-hidden />
          Retour au dashboard
        </Link>
        <p className="text-error text-sm">{error ?? 'Introuvable.'}</p>
      </div>
    )
  }

  const assigned = Array.isArray(detail.assigned_courses) ? detail.assigned_courses : []

  return (
    <div className="flex flex-col gap-8">
      <Link
        to="/teacher/faculty/list"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-600 hover:text-brand-600 dark:text-zinc-400"
      >
        <ArrowLeft size={16} aria-hidden />
        Retour au dashboard
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {detail.first_name} {detail.last_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {detail.matricule} · {detail.email} · {detail.teacher_role} · {detail.status}
          {detail.is_activated ? ' · Compte activé' : ' · Compte non activé'}
        </p>
        {canManageCourses ? (
          <Button as={Link} to="/teacher/faculty/course-assignments" variant="ghost" className="mt-3">
            <BookMarked size={14} aria-hidden />
            Gérer les affectations dans l’onglet Affectations cours
          </Button>
        ) : null}
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Cours assignés</h2>
        {assigned.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Aucun cours assigné.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {assigned.map((c) => {
              const inner = (
                <>
                  <p className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{c.code}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.name}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{c.semester_label}</p>
                  {canManageCourses ? (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                      Fiche affectation
                      <ChevronRight size={14} aria-hidden />
                    </span>
                  ) : null}
                </>
              )
              return canManageCourses ? (
                <Link
                  key={c.id}
                  to={`/teacher/faculty/course-assignments/${c.id}`}
                  className="block rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,white)] p-4 transition-colors hover:border-brand-400/50 hover:bg-[var(--app-nav-hover)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,black)] dark:hover:border-brand-500/40"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={c.id}
                  className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,white)] p-4 dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,black)]"
                >
                  <BookOpen size={14} className="mb-2 text-zinc-400" aria-hidden />
                  {inner}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {!canManageCourses ? (
        <p className="text-sm text-zinc-500">
          Vous n’avez pas les droits pour modifier les affectations de cours.
        </p>
      ) : null}
    </div>
  )
}
