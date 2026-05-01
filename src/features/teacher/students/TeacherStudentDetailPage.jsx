import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  ArrowLeft,
  Ban,
  Bell,
  BookOpen,
  Download,
  FileImage,
  FileText,
  GraduationCap,
  Layers,
  Pencil,
  User,
} from 'lucide-react'

import { useStudentDetail } from '@/features/teacher/students/hooks/useStudentDetail'
import { StudentNotifyModal } from '@/features/teacher/students/ui/StudentNotifyModal'
import { StudentSuspendModal } from '@/features/teacher/students/ui/StudentSuspendModal'
import { formatCohortDisplay } from '@/shared/lib/formatCohortDisplay'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

const ENROLL_STATUS_LABEL = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
}

const GRADE_STATUS_FR = {
  DRAFT: 'Brouillon',
  INCOMPLETE: 'Incomplet',
  NEEDS_MAKEUP: 'Rattrapage',
  PASSED: 'Validé',
  DEBT: 'Dette',
}

function enrollmentBadgeClass(status) {
  switch (status) {
    case 'approved':
      return 'sd-detail__mini-badge sd-detail__mini-badge--ok'
    case 'pending':
      return 'sd-detail__mini-badge sd-detail__mini-badge--pending'
    default:
      return 'sd-detail__mini-badge sd-detail__mini-badge--muted'
  }
}

function studentDetailTabClass(active) {
  return cn(
    'inline-flex min-w-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold tracking-tight transition-colors duration-200 outline-none sm:px-4',
    'rounded-t-md focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600',
    active
      ? 'border-secondary-400 text-secondary-50 shadow-[inset_0_-8px_12px_-10px_rgba(249,115,22,0.35)] dark:border-secondary-300 dark:text-secondary-50'
      : 'border-transparent text-secondary-200/95 hover:border-secondary-400/55 hover:text-secondary-50 dark:text-secondary-200/90',
  )
}

function gradeBadgeClass(status) {
  switch (status) {
    case 'PASSED':
      return 'sd-detail__mini-badge sd-detail__mini-badge--ok'
    case 'DEBT':
    case 'NEEDS_MAKEUP':
      return 'sd-detail__mini-badge sd-detail__mini-badge--pending'
    case 'DRAFT':
    case 'INCOMPLETE':
      return 'sd-detail__mini-badge sd-detail__mini-badge--muted'
    default:
      return 'sd-detail__mini-badge sd-detail__mini-badge--muted'
  }
}

function initials(first, last) {
  const a = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim()
  return a ? a.toUpperCase() : '?'
}

/** Regroupe les lignes de notes par UE (pour fusion verticale de la colonne UE). */
function groupGradesByUe(rows) {
  const groups = new Map()
  for (const r of rows || []) {
    const key = r.ue_code ?? '__none__'
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        ueCode: r.ue_code,
        ueName: r.ue_name,
        rows: [],
      })
    }
    groups.get(key).rows.push(r)
  }
  return [...groups.values()]
}

export function TeacherStudentDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { validId, loading, error, student } = useStudentDetail(studentId)

  const [mainTab, setMainTab] = useState('history')
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [notifyModalOpen, setNotifyModalOpen] = useState(false)

  const gradesRows = student?.grades_courses ?? []
  const ueGroups = useMemo(() => groupGradesByUe(gradesRows), [gradesRows])

  if (!validId) {
    return (
      <div className="sd-detail sd-detail--center">
        <p className="text-error">Identifiant invalide.</p>
        <Button type="button" variant="ghost" as={Link} to="/teacher/students/list">
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

  if (error || !student) {
    return (
      <div className="sd-detail sd-detail--center">
        <p className="text-error" role="alert">
          {error ?? 'Introuvable.'}
        </p>
        <Button type="button" variant="ghost" onClick={() => navigate('/teacher/students/list')}>
          Retour à l’annuaire
        </Button>
      </div>
    )
  }

  const gpa = student.grade_summary?.average_gpa
  const credits = student.grade_summary?.credits_earned ?? 0
  const passed = student.grade_summary?.passed_courses_count ?? 0
  const notifications = student.notifications ?? []

  return (
    <div className="sd-detail">
      <nav className="sd-detail__breadcrumb" aria-label="Fil d’Ariane">
        <button type="button" className="sd-detail__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} aria-hidden />
          Retour
        </button>
        <span className="sd-detail__crumb-muted">Annuaire étudiants</span>
        <span aria-hidden className="sd-detail__crumb-sep">
          /
        </span>
        <span className="sd-detail__crumb-strong">
          {student.first_name} {student.last_name}
        </span>
      </nav>

      <header className="sd-detail__hero">
        <div className="sd-detail__hero-main">
          {student.photo_url ? (
            <img className="sd-detail__photo" src={student.photo_url} alt="" />
          ) : (
            <div className="sd-detail__photo sd-detail__photo--placeholder" aria-hidden>
              {initials(student.first_name, student.last_name)}
            </div>
          )}
          <div className="sd-detail__hero-text">
            <div className="sd-detail__name-row">
              <h1 className="sd-detail__title">
                {student.first_name} {student.last_name}
              </h1>
              {student.status === 'ACTIVE' ? (
                <span className="sd-detail__pill">Inscription active</span>
              ) : (
                <span className="sd-detail__pill sd-detail__pill--muted">{student.status}</span>
              )}
            </div>
            <p className="sd-detail__meta">
              <span className="sd-detail__meta-id">ID {student.matricule}</span>
              <span className="sd-detail__dot" aria-hidden>
                ·
              </span>
              <span>
                {student.department_name ?? student.department_code ?? 'Département non renseigné'}
              </span>
            </p>
          </div>
        </div>
        <div className="sd-detail__hero-actions">
          <Button type="button" variant="primary" className="sd-detail__btn-primary" title="Bientôt disponible">
            <Pencil size={18} aria-hidden />
            Modifier le profil
          </Button>
          <Button type="button" variant="ghost" className="sd-btn-outline" onClick={() => setSuspendModalOpen(true)}>
            <Ban size={18} aria-hidden />
            Suspendre
          </Button>
        </div>
      </header>

      <div className="sd-detail__grid">
        <section className="sd-card">
          <h2 className="sd-card__title">
            <User size={18} aria-hidden />
            Informations personnelles
          </h2>
          <dl className="sd-dl">
            <div>
              <dt>Adresse e-mail</dt>
              <dd>{student.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd>{student.phone || '—'}</dd>
            </div>
            <div>
              <dt>Date de naissance</dt>
              <dd>{student.birth_date ?? '—'}</dd>
            </div>
            <div>
              <dt>Lieu de naissance</dt>
              <dd>{student.birth_place || '—'}</dd>
            </div>
            <div>
              <dt>Contact d’urgence</dt>
              <dd>
                {[student.dad_name, student.mum_name].filter(Boolean).join(' · ') || '—'}
              </dd>
            </div>
            <div>
              <dt>INE</dt>
              <dd>
                <code className="sd-code">{student.INE}</code>
              </dd>
            </div>
          </dl>
        </section>

        <section className="sd-card sd-card--dark">
          <div className="sd-card--dark__head">
            <GraduationCap size={22} aria-hidden />
            <span>Synthèse académique</span>
          </div>
          <div className="sd-metrics">
            <div>
              <p className="sd-metrics__label">Moyenne (notes publiées)</p>
              <p className="sd-metrics__value">{gpa != null ? gpa.toFixed(2) : '—'}</p>
              <div className="sd-metrics__line" />
            </div>
            <div>
              <p className="sd-metrics__label">Crédits validés</p>
              <p className="sd-metrics__value">{credits}</p>
            </div>
            <div>
              <p className="sd-metrics__label">Cours réussis</p>
              <p className="sd-metrics__value">{passed}</p>
            </div>
            <div>
              <p className="sd-metrics__label">Cohorte</p>
              <p className="sd-metrics__value sd-metrics__value--sm">
                {formatCohortDisplay(student) || '—'}
              </p>
            </div>
          </div>
          <div className="sd-card--dark__watermark" aria-hidden>
            <GraduationCap size={120} strokeWidth={0.8} />
          </div>
        </section>

        <section className="sd-card">
          <h2 className="sd-card__title">
            <FileText size={18} aria-hidden />
            Documents
          </h2>
          {student.documents?.length ? (
            <ul className="sd-docs">
              {student.documents.map((doc) => (
                <li key={doc.id} className="sd-docs__row">
                  <span className="sd-docs__icon">
                    {doc.type === 'image' ? <FileImage size={20} /> : <FileText size={20} />}
                  </span>
                  <span className="sd-docs__name">{doc.label}</span>
                  {doc.url ? (
                    <a className="sd-docs__dl" href={doc.url} download target="_blank" rel="noreferrer">
                      <Download size={18} />
                    </a>
                  ) : (
                    <span className="sd-docs__missing">Manquant</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="sd-muted">Aucun document enregistré pour le moment.</p>
          )}
        </section>
      </div>

      <section className="sd-card sd-card--wide sd-detail__bottom">
        <div
          className="-mx-5 -mt-5 mb-0 overflow-hidden rounded-t-2xl bg-brand-600 shadow-sm ring-1 ring-brand-700/30 dark:bg-brand-600 dark:ring-white/10"
          role="tablist"
          aria-label="Dossier étudiant"
        >
          <nav className="-mb-px flex flex-wrap divide-x divide-secondary-400/50 px-1 sm:px-2">
            <button
              type="button"
              role="tab"
              id="tab-history"
              aria-selected={mainTab === 'history'}
              className={studentDetailTabClass(mainTab === 'history')}
              onClick={() => setMainTab('history')}
            >
              <BookOpen size={17} strokeWidth={2} aria-hidden />
              Historique d’inscriptions
            </button>
            <button
              type="button"
              role="tab"
              id="tab-grades"
              aria-selected={mainTab === 'grades'}
              className={studentDetailTabClass(mainTab === 'grades')}
              onClick={() => setMainTab('grades')}
            >
              <Layers size={17} strokeWidth={2} aria-hidden />
              Notes
            </button>
            <button
              type="button"
              role="tab"
              id="tab-notif"
              aria-selected={mainTab === 'notifications'}
              className={studentDetailTabClass(mainTab === 'notifications')}
              onClick={() => setMainTab('notifications')}
            >
              <Bell size={17} strokeWidth={2} aria-hidden />
              Notifications
            </button>
          </nav>
        </div>

        <div className="sd-tab-panels">
          {mainTab === 'history' ? (
            <div
              className="sd-tab-panel"
              role="tabpanel"
              aria-labelledby="tab-history"
              id="panel-history"
            >
              <div className="sd-table-scroll">
                <table className="sd-table sd-table--compact">
                  <thead>
                    <tr>
                      <th>Année</th>
                      <th>Semestre</th>
                      <th>Cours</th>
                      <th>Statut</th>
                      <th>Crédits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.enrollment_history?.length ? (
                      student.enrollment_history.map((row, i) => (
                        <tr key={`${row.course_code}-${i}`}>
                          <td>{row.academic_year}</td>
                          <td>S{row.semester_number}</td>
                          <td>
                            <span className="sd-table-course">
                              <span className="sd-table-course__code">{row.course_code}</span>
                              {row.course_name}
                            </span>
                          </td>
                          <td>
                            <span className={enrollmentBadgeClass(row.status)}>
                              {ENROLL_STATUS_LABEL[row.status] ?? row.status}
                            </span>
                          </td>
                          <td>{row.credits ?? '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="sd-table__empty">
                          Aucune inscription enregistrée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {mainTab === 'grades' ? (
            <div
              className="sd-tab-panel"
              role="tabpanel"
              aria-labelledby="tab-grades"
              id="panel-grades"
            >
              <div className="sd-table-scroll">
                <table className="sd-table sd-table--compact sd-table--grades-merged">
                  <thead>
                    <tr>
                      <th className="sd-table__th-ue">Unité d’enseignement</th>
                      <th>Matière</th>
                      <th>Année</th>
                      <th>Sem.</th>
                      <th>Note</th>
                      <th>Statut</th>
                      <th>Crédits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ueGroups.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="sd-table__empty">
                          Aucune note enregistrée.
                        </td>
                      </tr>
                    ) : (
                      ueGroups.flatMap((g) =>
                        g.rows.map((row, ri) => (
                          <tr key={`${g.key}-${row.course_code}-${ri}`} className="sd-table__grade-row">
                            {ri === 0 ? (
                              <td rowSpan={g.rows.length} className="sd-table__ue-cell">
                                {g.ueCode ? (
                                  <>
                                    <div className="sd-ue-cell__code">{g.ueCode}</div>
                                    {g.ueName ? <div className="sd-ue-cell__name">{g.ueName}</div> : null}
                                  </>
                                ) : (
                                  <div className="sd-ue-cell__name sd-ue-cell__name--solo">
                                    Sans unité d’enseignement (UE)
                                  </div>
                                )}
                              </td>
                            ) : null}
                            <td>
                              <span className="sd-table-course">
                                <span className="sd-table-course__code">{row.course_code}</span>
                                {row.course_name}
                              </span>
                            </td>
                            <td>{row.academic_year ?? '—'}</td>
                            <td>{row.semester_number != null ? `S${row.semester_number}` : '—'}</td>
                            <td>{row.average != null ? row.average.toFixed(2) : '—'}</td>
                            <td>
                              <span className={gradeBadgeClass(row.status)}>
                                {GRADE_STATUS_FR[row.status] ?? row.status}
                              </span>
                            </td>
                            <td>{row.credits ?? '—'}</td>
                          </tr>
                        )),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {mainTab === 'notifications' ? (
            <div
              className="sd-tab-panel"
              role="tabpanel"
              aria-labelledby="tab-notif"
              id="panel-notif"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-sm text-[var(--app-muted)] m-0 max-w-xl">
                  Envoyez un message à l’étudiant (e-mail, SMS ou WhatsApp). Les canaux seront activés prochainement.
                </p>
                <Button type="button" variant="primary" size="sm" onClick={() => setNotifyModalOpen(true)}>
                  <Bell size={16} aria-hidden />
                  Notifier
                </Button>
              </div>

              {notifications.length ? (
                <ul className="sd-notif-list">
                  {notifications.map((n, i) => (
                    <li key={n.id ?? i} className="sd-notif-item flex flex-wrap items-center justify-between gap-3">
                      <span className="min-w-0 flex-1">
                        {typeof n === 'string' ? n : JSON.stringify(n)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 border border-[var(--app-border)]"
                        onClick={() => setNotifyModalOpen(true)}
                      >
                        Notifier
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="sd-notif-empty border border-dashed border-[var(--app-border)] rounded-xl px-4 py-8">
                  <Bell size={28} aria-hidden className="sd-notif-empty__icon" />
                  <p className="sd-notif-empty__title">Aucune notification</p>
                  <p className="sd-notif-empty__text">
                    L’historique des envois apparaîtra ici. Vous pouvez déjà rédiger une notification pour cet étudiant.
                  </p>
                  <Button
                    type="button"
                    variant="soft"
                    className="mt-4"
                    onClick={() => setNotifyModalOpen(true)}
                  >
                    <Bell size={16} aria-hidden />
                    Notifier l’étudiant
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <StudentSuspendModal
        open={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        studentLabel={`${student.first_name} ${student.last_name} · ${student.matricule}`}
      />
      <StudentNotifyModal
        open={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        studentLabel={`${student.first_name} ${student.last_name} · ${student.matricule}`}
      />
    </div>
  )
}
