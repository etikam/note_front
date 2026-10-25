import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  CornerUpLeft,
  FileWarning,
  GraduationCap,
  PenLine,
  Send,
  Undo2,
  Upload,
  UserRoundX,
  UsersRound,
} from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { primaryRole } from '@/features/access/model/access'
import { useAccess } from '@/features/access/model/useAccess'
import { useAuth } from '@/features/auth/model/AuthContext'
import { fetchHomeDashboard } from '@/features/dashboard/api/homeDashboardApi'
import { HorizontalBars, Meter, SheetProgressBar } from '@/features/dashboard/ui/DashboardCharts'
import { EVENT_LABELS, formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton, SkeletonLines } from '@/shared/ui/Skeleton'
import { StatTile } from '@/shared/ui/StatTile'
import { StatusPill } from '@/shared/ui/StatusPill'

const EVENT_ICONS = { submit: Send, approve: CheckCircle2, reject: CornerUpLeft, publish: Upload, unpublish: Undo2 }
const fmtPct = (v) => (v == null ? '—' : `${String(v).replace('.', ',')} %`)
const fmtAvg = (v) => (v == null ? '—' : `${String(v.toFixed(2)).replace('.', ',')} / 10`)

function KpiRow({ data, loading }) {
  const k = data?.kpis ?? {}
  const unassigned = data?.todo?.unassigned_courses ?? 0
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <StatTile icon={GraduationCap} tone="brand" label="Étudiants inscrits" value={k.students ?? 0} hint={loading ? null : `${k.students_active ?? 0} comptes activés`} loading={loading} />
      <StatTile icon={UsersRound} label="Enseignants intervenants" value={k.teachers ?? 0} hint={loading ? null : `sur ${k.programs ?? 0} programme(s)`} loading={loading} />
      <StatTile icon={BookOpen} label="Cours de l’année" value={k.courses ?? 0} hint={loading ? null : unassigned ? `${unassigned} sans enseignant` : 'tous affectés'} tone={unassigned ? 'warning' : 'neutral'} loading={loading} />
      <StatTile icon={PenLine} label="Saisie des notes" value={fmtPct(k.grade_entry_rate)} hint="étudiants notés / inscrits" loading={loading} />
      <StatTile icon={ClipboardCheck} tone="success" label="Fiches publiées" value={fmtPct(k.published_rate)} hint="cours publiés / cours" loading={loading} />
    </div>
  )
}

function TodoItem({ icon: Icon, count, label, to, tone = 'warning', canOpen = true }) {
  const content = (
    <>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          tone === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200',
        )}
      >
        <Icon size={15} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-[13px] text-[var(--app-fg)]">{label}</span>
      <span className="shrink-0 text-[15px] font-semibold tabular-nums text-[var(--app-fg)]">{count}</span>
      {canOpen ? <ArrowRight size={14} className="shrink-0 text-[var(--app-muted)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden /> : null}
    </>
  )
  const cls = 'group flex items-center gap-3 rounded-lg px-2 py-2'
  return canOpen ? (
    <Link to={to} className={cn(cls, 'hover:bg-[var(--app-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]')}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  )
}

function TodoCard({ todo, access, loading }) {
  if (loading) {
    return (
      <SectionCard title="À faire">
        <SkeletonLines lines={4} />
      </SectionCard>
    )
  }
  const canAssignRoles = access.canManage('access.assign_roles')
  const items = [
    todo.to_validate && { icon: ClipboardCheck, count: todo.to_validate, label: 'Fiches de notes à valider', to: '/teacher/validations', tone: 'brand' },
    todo.to_republish && { icon: Upload, count: todo.to_republish, label: 'Fiches corrigées à republier', to: '/teacher/validations', tone: 'brand' },
    todo.incomplete_drafts && { icon: FileWarning, count: todo.incomplete_drafts, label: 'Fiches en saisie avec des notes manquantes', to: '/teacher/reports?report=progress', canOpen: access.canManage('reports.view') },
    todo.unassigned_courses && {
      icon: BookOpen,
      count: todo.unassigned_courses,
      label: 'Cours sans enseignant',
      to: '/teacher/faculty/course-assignments',
      canOpen: access.canManage('courses.assign'),
    },
    todo.vacant_programs + todo.vacant_departments > 0 && {
      icon: UserRoundX,
      count: todo.vacant_programs + todo.vacant_departments,
      label: `Postes de responsable vacants (${[...todo.vacancies.departments, ...todo.vacancies.programs].map((v) => v.code).slice(0, 4).join(', ')}${todo.vacant_programs + todo.vacant_departments > 4 ? '…' : ''})`,
      to: '/settings/nominations?new=1',
      canOpen: canAssignRoles,
    },
  ].filter(Boolean)

  return (
    <SectionCard title="À faire" description={items.length ? `${items.length} point(s) d’attention` : null}>
      {items.length ? (
        <div className="-mx-2 flex flex-col">
          {items.map((it) => (
            <TodoItem key={it.label} {...it} />
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-[var(--app-muted)]">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" aria-hidden /> Tout est à jour.
        </p>
      )}
    </SectionCard>
  )
}

function ActivityCard({ activity, loading }) {
  return (
    <SectionCard title="Activité récente" description="Fiches de notes de votre périmètre">
      {loading ? (
        <SkeletonLines lines={5} />
      ) : !activity.length ? (
        <p className="text-[13px] text-[var(--app-muted)]">Aucune fiche soumise pour l’instant.</p>
      ) : (
        <ol className="space-y-3">
          {activity.map((e) => {
            const Icon = EVENT_ICONS[e.action] ?? PenLine
            return (
              <li key={e.id} className="flex gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    e.action === 'reject' || e.action === 'unpublish'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-[var(--app-subtle)] text-[var(--app-muted)]',
                  )}
                >
                  <Icon size={12} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 text-[12.5px]">
                  <p className="truncate text-[var(--app-fg)]">
                    <Link to={`/teacher/courses/${e.course_id}?tab=grades`} className="font-medium hover:underline">
                      {e.course_code}
                    </Link>{' '}
                    <span className="text-[var(--app-fg-soft)]">{(EVENT_LABELS[e.action] ?? e.action).toLowerCase()}</span>
                    {e.step_label ? <span className="text-[var(--app-muted)]"> · {e.step_label}</span> : null}
                  </p>
                  <p className="truncate text-[11.5px] text-[var(--app-muted)]">
                    {e.actor ? `${e.actor} · ` : ''}
                    {formatDateTime(e.created_at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </SectionCard>
  )
}

export default function HomeDashboardPage() {
  const { user } = useAuth()
  const access = useAccess()
  const navigate = useNavigate()
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchHomeDashboard())
    } catch (err) {
      setError(err?.message || 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, academicYearId])

  const mandate = primaryRole(user)
  const scopeLabel = access.scopeOf('stats.view')?.institution ? 'Toute l’institution' : mandate?.target_label || 'Votre périmètre'

  const levelGroups = useMemo(() => {
    const groups = new Map()
    for (const row of data?.levels ?? []) {
      if (!groups.has(row.program_code)) groups.set(row.program_code, [])
      groups.get(row.program_code).push({ key: `${row.program_code}-${row.level}`, label: row.level, value: row.students })
    }
    return [...groups.entries()]
  }, [data])

  const programColumns = [
    {
      key: 'program',
      header: 'Programme',
      sortValue: (p) => p.code,
      cell: (p) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--app-fg)]">{p.code}</span>
          {p.name !== p.code ? <span className="truncate text-[11.5px] text-[var(--app-muted)]">{p.name}</span> : null}
        </span>
      ),
    },
    { key: 'students', header: 'Étudiants', align: 'right', sortValue: (p) => p.students, cell: (p) => p.students },
    { key: 'courses', header: 'Cours', align: 'right', sortValue: (p) => p.courses, cell: (p) => p.courses },
    {
      key: 'published',
      header: 'Fiches publiées',
      sortValue: (p) => (p.courses ? p.published_courses / p.courses : 0),
      cell: (p) => <Meter value={p.published_courses} max={p.courses} label={`${p.published_courses} / ${p.courses}`} />,
    },
    {
      key: 'unassigned',
      header: 'Sans ens.',
      align: 'right',
      sortValue: (p) => p.unassigned_courses,
      cell: (p) => (
        <span className={p.unassigned_courses ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-[var(--app-muted)]'}>{p.unassigned_courses}</span>
      ),
    },
    {
      key: 'pass',
      header: 'Réussite',
      align: 'right',
      sortValue: (p) => p.pass_rate ?? -1,
      cell: (p) =>
        p.pass_rate == null ? (
          <span className="text-[var(--app-muted)]">—</span>
        ) : (
          <span title={`Dettes ${fmtPct(p.debt_rate)} · rattrapages ${fmtPct(p.makeup_rate)} · ${p.graded} notes publiées`}>{fmtPct(p.pass_rate)}</span>
        ),
    },
    { key: 'avg', header: 'Moyenne', align: 'right', sortValue: (p) => p.average ?? -1, cell: (p) => fmtAvg(p.average) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[{ label: 'Pilotage' }, { label: 'Tableau de bord' }]}
        title="Tableau de bord"
        description={`${scopeLabel} · indicateurs de l’année, avancement des notes et points d’attention.`}
        meta={academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
        actions={
          <>
            {access.canManage('reports.view') ? (
              <Button as={Link} to="/teacher/reports" variant="ghost">
                Rapports
              </Button>
            ) : null}
            {access.canManageAny('grades.validate', 'grades.publish') ? (
              <Button as={Link} to="/teacher/validations">
                <ClipboardCheck size={15} aria-hidden /> Valider des notes
                {data?.todo?.to_validate ? (
                  <span className="rounded-full bg-white/25 px-1.5 text-[11px] font-semibold tabular-nums">{data.todo.to_validate}</span>
                ) : null}
              </Button>
            ) : null}
          </>
        }
      />

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} onRetry={load} />
        </SectionCard>
      ) : (
        <>
          <KpiRow data={data} loading={loading} />

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <SectionCard title="Avancement des fiches de notes" description="Un cours = une fiche : saisie, validation par le circuit, publication.">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <SheetProgressBar counts={data.sheets.counts} />
                  {data.sheets.review_by_step.length ? (
                    <div className="mt-5 border-t border-[var(--app-border)] pt-4">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">En validation, par étape</p>
                      <ul className="flex flex-wrap gap-2">
                        {data.sheets.review_by_step.map((s) => (
                          <li key={s.label} className="rounded-lg border border-[var(--app-border)] px-3 py-1.5 text-[12.5px]">
                            <span className="text-[var(--app-fg-soft)]">{s.label}</span>
                            <span className="ml-2 font-semibold tabular-nums text-[var(--app-fg)]">{s.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </SectionCard>
            <TodoCard todo={data?.todo ?? {}} access={access} loading={loading} />
          </div>

          <SectionCard
            title="Programmes"
            description="Réussite et moyenne calculées sur les notes publiées uniquement."
            flush
          >
            <DataTable
              columns={programColumns}
              rows={data?.programs ?? []}
              loading={loading}
              onRowClick={(p) => navigate(`/structure?node=program:${p.id}`)}
              initialSort={{ key: 'program', dir: 'asc' }}
              empty={{ title: 'Aucun programme', description: 'Les programmes de votre périmètre apparaîtront ici.' }}
            />
          </SectionCard>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <SectionCard title="Effectifs par niveau" description="Étudiants inscrits (hors exclus et diplômés)">
              {loading ? (
                <SkeletonLines lines={5} />
              ) : !levelGroups.length ? (
                <p className="text-[13px] text-[var(--app-muted)]">Aucun étudiant inscrit pour l’instant.</p>
              ) : (
                <div className="space-y-5">
                  {levelGroups.map(([program, rows]) => (
                    <div key={program}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">{program}</p>
                      <HorizontalBars rows={rows} valueLabel={(v) => `${v} étudiant${v > 1 ? 's' : ''}`} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            <ActivityCard activity={data?.activity ?? []} loading={loading} />
          </div>
        </>
      )}
    </div>
  )
}
