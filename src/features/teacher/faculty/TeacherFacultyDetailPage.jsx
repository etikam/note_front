import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Pencil,
  Trash2,
  Upload,
  User,
  Users,
} from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { deleteTeacherPhoto, fetchTeacherDetail, patchTeacherPhoto } from '@/features/teacher/faculty/api/teachersApi'
import { TEACHER_ROLE_OPTIONS } from '@/features/teacher/faculty/facultyList.constants'
import { TeacherEditModal } from '@/features/teacher/faculty/ui/TeacherEditModal'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

const TEACHER_STATUS_FR = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
  on_leave: 'En congé',
}

const quickLinkClass =
  'group flex w-full min-w-0 cursor-pointer flex-row items-center gap-2.5 rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_98%,var(--app-canvas))] px-2.5 py-2 text-left transition-all duration-200 hover:border-secondary-400/60 hover:shadow-sm dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:hover:border-secondary-500/35'

function initials(first, last) {
  const a = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim()
  return a ? a.toUpperCase() : '?'
}

function formatTeacherStatus(raw) {
  const key = String(raw ?? '').toLowerCase()
  return TEACHER_STATUS_FR[key] ?? raw ?? '—'
}

function teacherRoleLabel(code) {
  const v = TEACHER_ROLE_OPTIONS.find((o) => o.value === code)
  return v?.label ?? code ?? '—'
}

function formatFrenchCalendarDate(raw) {
  if (!raw) return '—'
  const t = new Date(raw)
  if (Number.isNaN(t.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(t)
}

function DetailQuickLink({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className={quickLinkClass}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 transition-all duration-200 group-hover:bg-secondary-500 group-hover:text-white group-hover:ring-secondary-600 dark:text-secondary-200 dark:ring-secondary-500/25 dark:group-hover:bg-secondary-500">
        <Icon size={16} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-[var(--app-fg)]">{title}</p>
        <p className="truncate text-[11px] text-[var(--app-muted)]">{subtitle}</p>
      </span>
    </Link>
  )
}

export function TeacherFacultyDetailPage() {
  const { teacherId } = useParams()
  const id = Number(teacherId)
  const navigate = useNavigate()
  const { user, refreshMe } = useAuth()
  const canProvision = Boolean(user?.capabilities?.can_provision_teacher)
  const canManageCourses = Boolean(user?.capabilities?.can_manage_courses)

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoInputRef = useRef(null)

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

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

  async function handleTeacherPhotoPick(event) {
    const file = event.target.files?.[0]
    if (!file || !detail?.id) return
    setPhotoBusy(true)
    try {
      const updated = await patchTeacherPhoto(detail.id, file)
      setDetail(updated)
      dispatchToast({ type: 'success', message: 'Photo de profil mise à jour.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message ?? 'Envoi de la photo impossible.' })
    } finally {
      setPhotoBusy(false)
      event.target.value = ''
    }
  }

  async function handleTeacherPhotoRemove() {
    if (!detail?.id) return
    setPhotoBusy(true)
    try {
      const updated = await deleteTeacherPhoto(detail.id)
      setDetail(updated)
      dispatchToast({ type: 'success', message: 'Photo de profil supprimée.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message ?? 'Suppression de la photo impossible.' })
    } finally {
      setPhotoBusy(false)
    }
  }

  if (!canProvision) return null

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="sd-detail sd-detail--center">
        <p className="text-error" role="alert">
          Identifiant invalide.
        </p>
        <Button type="button" variant="ghost" as={Link} to="/teacher/faculty/list">
          Retour à l’annuaire
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="sd-detail sd-detail--center">
        <Spinner size="lg" label="Chargement du dossier" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="sd-detail sd-detail--center">
        <p className="text-error" role="alert">
          {error ?? 'Introuvable.'}
        </p>
        <Button type="button" variant="ghost" onClick={() => navigate('/teacher/faculty/list')}>
          Retour à l’annuaire
        </Button>
      </div>
    )
  }

  const assigned = Array.isArray(detail.assigned_courses) ? detail.assigned_courses : []
  const statusFr = formatTeacherStatus(detail.status)
  const roleFr = teacherRoleLabel(detail.teacher_role)
  const gradeDisplay = detail.grade_name ?? (detail.grade ? String(detail.grade) : '—')
  const accountShort = detail.is_activated ? 'Activé' : 'Non activé'

  return (
    <div className="sd-detail mx-auto w-full max-w-7xl">
      <TeacherEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        teacher={detail}
        onSaved={load}
      />

      <nav className="sd-detail__breadcrumb" aria-label="Fil d’Ariane">
        <button type="button" className="sd-detail__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} aria-hidden />
          Retour
        </button>
        <span className="sd-detail__crumb-muted">Annuaire enseignants</span>
        <span aria-hidden className="sd-detail__crumb-sep">
          /
        </span>
        <span className="sd-detail__crumb-strong">
          {detail.first_name} {detail.last_name}
        </span>
      </nav>

      <header className="sd-detail__hero">
        <div className="sd-detail__hero-main">
          <div className="flex shrink-0 flex-col items-start gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              aria-label="Choisir une nouvelle photo de profil"
              disabled={photoBusy}
              onChange={handleTeacherPhotoPick}
            />
            <div className="relative">
              {detail.photo_url ? (
                <img className="sd-detail__photo" src={detail.photo_url} alt="" />
              ) : (
                <div className="sd-detail__photo sd-detail__photo--placeholder" aria-hidden>
                  {initials(detail.first_name, detail.last_name)}
                </div>
              )}
              {photoBusy ? (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/35"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <Spinner className="h-8 w-8 text-white" />
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 flex-1 min-w-[6.5rem] border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_92%,transparent)] px-2 text-xs"
                disabled={photoBusy}
                onClick={() => photoInputRef.current?.click()}
              >
                <Upload size={14} aria-hidden className="shrink-0" />
                Changer la photo
              </Button>
              {detail.photo_url ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 border border-red-200/80 px-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                  disabled={photoBusy}
                  onClick={() => void handleTeacherPhotoRemove()}
                >
                  <Trash2 size={14} aria-hidden className="shrink-0" />
                  Retirer
                </Button>
              ) : null}
            </div>
          </div>
          <div className="sd-detail__hero-text">
            <div className="sd-detail__name-row">
              <h1 className="sd-detail__title">
                {detail.first_name} {detail.last_name}
              </h1>
              {detail.is_activated ? (
                <span className="sd-detail__pill">Compte activé</span>
              ) : (
                <span className="sd-detail__pill sd-detail__pill--muted">Compte non activé</span>
              )}
            </div>
            <p className="sd-detail__meta">
              <span className="sd-detail__meta-id">{detail.matricule}</span>
              <span className="sd-detail__dot" aria-hidden>
                ·
              </span>
              <span>{roleFr}</span>
            </p>
          </div>
        </div>
        <div className="sd-detail__hero-actions">
          <Button
            type="button"
            variant="primary"
            className="sd-detail__btn-primary"
            onClick={() => setEditModalOpen(true)}
          >
            <Pencil size={18} aria-hidden />
            Modifier le profil
          </Button>
          {canManageCourses ? (
            <Button as={Link} to="/teacher/faculty/course-assignments" variant="ghost" className="sd-btn-outline">
              <BookMarked size={16} aria-hidden />
              Affectations cours
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1 space-y-6">
          <section className="sd-card w-full">
            <h2 className="sd-card__title">
              <User size={18} aria-hidden />
              Informations personnelles & fonction
            </h2>
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
              <dl className="sd-dl">
                <div>
                  <dt>Matricule</dt>
                  <dd>
                    <code className="sd-code">{detail.matricule}</code>
                  </dd>
                </div>
                <div>
                  <dt>Adresse e-mail</dt>
                  <dd>{detail.email ?? '—'}</dd>
                </div>
                <div>
                  <dt>Téléphone</dt>
                  <dd>{detail.phone?.trim() || '—'}</dd>
                </div>
                <div>
                  <dt>Date de naissance</dt>
                  <dd>{formatFrenchCalendarDate(detail.birth_date)}</dd>
                </div>
                <div>
                  <dt>Rôle institutionnel</dt>
                  <dd>{roleFr}</dd>
                </div>
                <div>
                  <dt>Grade / titre</dt>
                  <dd>{gradeDisplay}</dd>
                </div>
              </dl>
              <dl className="sd-dl">
                <div>
                  <dt>Années d&apos;expérience</dt>
                  <dd>{detail.years_of_experience != null ? String(detail.years_of_experience) : '—'}</dd>
                </div>
                <div>
                  <dt>Doctorat</dt>
                  <dd>{detail.has_phd ? 'Oui' : 'Non'}</dd>
                </div>
                <div>
                  <dt>Date d&apos;embauche</dt>
                  <dd>{formatFrenchCalendarDate(detail.hire_date)}</dd>
                </div>
                <div>
                  <dt>Statut RH</dt>
                  <dd>{statusFr}</dd>
                </div>
                <div>
                  <dt>Compte utilisateur</dt>
                  <dd>{detail.is_activated ? 'Activé (connexion possible)' : 'Non activé (pas d’accès)'}</dd>
                </div>
                <div>
                  <dt>Département géré (code)</dt>
                  <dd>
                    <code className="sd-code">{detail.managed_department_code ?? '—'}</code>
                  </dd>
                </div>
                <div>
                  <dt>Fiche créée le</dt>
                  <dd>{formatFrenchCalendarDate(detail.created_at)}</dd>
                </div>
                <div>
                  <dt>Dernière mise à jour</dt>
                  <dd>{formatFrenchCalendarDate(detail.updated_at)}</dd>
                </div>
              </dl>
            </div>
            {detail.bio?.trim() ? (
              <div className="mt-6 border-t border-[var(--app-border)] pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                  Biographie
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-fg)]">
                  {detail.bio.trim()}
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:w-72 xl:w-80" aria-label="Synthèse et actions">
          <div className="sd-card overflow-hidden">
            <div className="mb-3 flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300">
                <GraduationCap size={18} aria-hidden />
              </span>
              <h3 className="text-sm font-semibold text-[var(--app-fg)]">Synthèse</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Cours</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--app-fg)]">{assigned.length}</p>
              </div>
              <div className="rounded-lg border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Statut RH</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[var(--app-fg)]" title={statusFr}>
                  {statusFr}
                </p>
              </div>
              <div className="col-span-2 rounded-lg border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">Compte</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--app-fg)]">{accountShort}</p>
              </div>
            </div>
          </div>

          <div className="sd-card">
            <div className="mb-3 flex items-start gap-2 border-b border-[var(--app-border)] pb-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300">
                <Users size={16} aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-tight text-[var(--app-fg)]">Actions rapides</h3>
                <p className="mt-0.5 text-[10px] leading-snug text-[var(--app-muted)]">Navigation</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => setEditModalOpen(true)} className={cn(quickLinkClass, 'text-left')}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 group-hover:bg-secondary-500 group-hover:text-white dark:text-secondary-200 dark:group-hover:bg-secondary-500">
                  <Pencil size={16} strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight text-[var(--app-fg)]">Modifier</p>
                  <p className="truncate text-[11px] text-[var(--app-muted)]">Fiche enseignant</p>
                </span>
              </button>
              <DetailQuickLink
                to="/teacher/faculty/list#faculty-directory"
                icon={Users}
                title="Annuaire"
                subtitle="Liste"
              />
              <DetailQuickLink to="/teacher/faculty/import-export" icon={Upload} title="Import / Export" subtitle="CSV" />
              {canManageCourses ? (
                <DetailQuickLink
                  to="/teacher/faculty/course-assignments"
                  icon={BookMarked}
                  title="Affectations"
                  subtitle="Cours"
                />
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <section className="sd-card w-full">
        <h2 className="sd-card__title">
          <BookOpen size={18} aria-hidden />
          Cours assignés
        </h2>
        {assigned.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Aucun cours assigné.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {assigned.map((c) => {
              const sem = c.semester_label ?? c.module_label ?? '—'
              const inner = (
                <>
                  <p className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{c.code}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.name}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sem}</p>
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
      </section>

      {!canManageCourses ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Vous n’avez pas les droits pour modifier les affectations de cours.
        </p>
      ) : null}
    </div>
  )
}
