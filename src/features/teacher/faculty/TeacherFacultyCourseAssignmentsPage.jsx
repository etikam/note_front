import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { UserPlus, UserRoundX } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAccess } from '@/features/access/model/useAccess'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { deleteCourseAssignment, fetchCourseAssignmentModules, fetchCourseAssignmentsList } from '@/features/teacher/faculty/api/courseAssignmentsApi'
import { QuickAssignDrawer } from '@/features/teacher/faculty/ui/QuickAssignDrawer'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Pagination } from '@/shared/ui/Pagination'
import { SectionCard } from '@/shared/ui/SectionCard'
import { ServerTable } from '@/shared/ui/ServerTable'
import { StatusPill } from '@/shared/ui/StatusPill'

const PAGE_SIZE = 20
const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

/** Affectation des cours de l'année : cours sans enseignant à traiter, cours déjà affectés. */
export function TeacherFacultyCourseAssignmentsPage() {
  const access = useAccess()
  const navigate = useNavigate()
  const canAssign = access.canManage('courses.assign')
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const scopeOptions = useScopeOptions('courses.assign', { enabled: canAssign })
  const [searchParams, setSearchParams] = useSearchParams()
  const state = searchParams.get('state') === 'assigned' ? 'assigned' : 'unassigned'
  const [scope, setScope] = useState(() => ({ departmentId: '', programId: searchParams.get('program') ?? '' }))
  const [moduleId, setModuleId] = useState('')
  const [modules, setModules] = useState([])
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [counts, setCounts] = useState({ assigned: null, unassigned: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assigning, setAssigning] = useState(null)
  const [unassigning, setUnassigning] = useState(null)

  useEffect(() => {
    if (scopeOptions.loading) return
    const locked = defaultScope(scopeOptions)
    if (locked.departmentId || locked.programId) setScope((s) => (s.departmentId || s.programId ? s : locked))
  }, [scopeOptions])

  const scopeParams = useMemo(() => {
    if (scope.programId) return { program_id: scope.programId }
    if (scope.departmentId) return { department_id: scope.departmentId }
    return {}
  }, [scope])

  useEffect(() => {
    if (!academicYearId) return undefined
    let cancelled = false
    fetchCourseAssignmentModules({ academic_year_id: academicYearId, ...scopeParams })
      .then((rows) => !cancelled && setModules(Array.isArray(rows) ? rows : []))
      .catch(() => !cancelled && setModules([]))
    return () => {
      cancelled = true
    }
  }, [academicYearId, scopeParams])

  useEffect(() => {
    setPage(1)
  }, [state, moduleId, scopeParams, academicYearId])

  const baseParams = useMemo(() => {
    const p = { academic_year_id: academicYearId, ...scopeParams }
    if (moduleId) p.module_id = moduleId
    return p
  }, [academicYearId, scopeParams, moduleId])

  const load = useCallback(async () => {
    if (!academicYearId || !canAssign) return
    setLoading(true)
    setError('')
    try {
      const other = state === 'assigned' ? 'unassigned' : 'assigned'
      const [body, otherBody] = await Promise.all([
        fetchCourseAssignmentsList({ ...baseParams, state, page, page_size: PAGE_SIZE }),
        fetchCourseAssignmentsList({ ...baseParams, state: other, page: 1, page_size: 1 }),
      ])
      setData(body)
      setCounts({ [state]: body?.count ?? 0, [other]: otherBody?.count ?? 0 })
    } catch (err) {
      setError(err?.message || 'Chargement impossible.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [academicYearId, canAssign, baseParams, state, page])

  useEffect(() => {
    void load()
  }, [load])

  if (!canAssign) return <Navigate to="/teacher/faculty/list" replace />

  const rows = data?.results ?? []
  const setState = (next) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'unassigned') params.delete('state')
    else params.set('state', next)
    setSearchParams(params, { replace: true })
  }

  const columns = [
    {
      key: 'course',
      header: 'Cours',
      cell: (c) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--app-fg)]">{c.name}</span>
          <span className="font-mono text-[11.5px] text-[var(--app-muted)]">
            {c.code}
            {c.teaching_unit_code ? ` · ${c.teaching_unit_code}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'program',
      header: 'Programme · niveau',
      cell: (c) => (
        <span className="flex flex-col">
          <span>{c.program_code}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">{c.level_name ?? '—'}</span>
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      cell: (c) => (
        <span className="text-[var(--app-fg-soft)]">
          {c.module_label ?? '—'}
          {c.semester ? ` · S${c.semester}` : ''}
        </span>
      ),
    },
    { key: 'credits', header: 'Crédits', align: 'right', cell: (c) => <span className="tabular-nums">{c.credits ?? '—'}</span> },
    {
      key: 'teacher',
      header: 'Enseignant',
      cell: (c) =>
        c.teacher_id ? (
          <span className="flex items-center gap-2">
            <Avatar name={c.teacher_name} size="xs" />
            <span className="truncate">{c.teacher_name}</span>
          </span>
        ) : (
          <StatusPill tone="warning">Sans enseignant</StatusPill>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) =>
        c.teacher_id ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setUnassigning(c)
            }}
          >
            <UserRoundX size={14} aria-hidden /> Retirer
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setAssigning(c)
            }}
          >
            <UserPlus size={14} aria-hidden /> Affecter
          </Button>
        ),
    },
  ]

  const tabs = [
    { id: 'unassigned', label: 'Sans enseignant', count: counts.unassigned },
    { id: 'assigned', label: 'Affectés', count: counts.assigned },
  ]

  return (
    <div className="flex flex-col gap-4">
      {!academicYearId ? (
        <SectionCard>
          <EmptyState title="Aucune année académique sélectionnée" description="Choisissez une année dans la barre du haut pour afficher les cours." />
        </SectionCard>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="État des cours">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={state === t.id}
                  onClick={() => setState(t.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors',
                    state === t.id ? 'bg-[var(--app-fg)] text-[var(--app-canvas)]' : 'text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]',
                  )}
                >
                  {t.label}
                  {t.count != null ? <span className="ml-1.5 tabular-nums opacity-70">{t.count}</span> : null}
                </button>
              ))}
            </div>
            <p className="text-[12.5px] text-[var(--app-muted)]">Année {academicYearLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ScopeSelect className={cn(SELECT, 'max-w-[15rem]')} options={scopeOptions} departmentId={scope.departmentId} programId={scope.programId} onChange={setScope} allLabel="Tous les programmes" />
            <select className={SELECT} value={moduleId} onChange={(e) => setModuleId(e.target.value)} aria-label="Module">
              <option value="">Tous les modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <ServerTable
            columns={columns}
            rows={rows}
            loading={loading}
            error={error ? { message: error, onRetry: load } : null}
            onRowClick={(c) => (c.teacher_id ? navigate(`/teacher/faculty/course-assignments/${c.id}`) : setAssigning(c))}
            empty={
              state === 'unassigned'
                ? { title: 'Tous les cours ont un enseignant', description: 'Rien à affecter pour ce filtre.' }
                : { title: 'Aucun cours affecté', description: 'Les cours affectés de l’année apparaîtront ici.' }
            }
            footer={<Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />}
          />

          {access.canAny('teachers.view') ? (
            <p className="text-[12.5px] text-[var(--app-muted)]">
              Charge de chaque enseignant : voir l’
              <Link to="/teacher/faculty/list" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                annuaire
              </Link>
              .
            </p>
          ) : null}
        </>
      )}

      <QuickAssignDrawer
        course={assigning}
        onClose={() => setAssigning(null)}
        onAssigned={(c, t) => {
          dispatchToast({ type: 'success', message: `${c.code} confié à ${t.full_name}.` })
          void load()
        }}
      />
      <ConfirmModal
        open={unassigning != null}
        onClose={() => setUnassigning(null)}
        title="Retirer l’enseignant de ce cours ?"
        message={unassigning ? `${unassigning.teacher_name} ne sera plus affecté à « ${unassigning.name} ».` : ''}
        confirmLabel="Retirer"
        onConfirm={async () => {
          try {
            await deleteCourseAssignment(unassigning.id)
            dispatchToast({ type: 'success', message: 'Affectation retirée.' })
            await load()
          } catch (err) {
            dispatchToast({ type: 'error', message: err?.message ?? 'Action impossible.' })
            throw err
          }
        }}
      />
    </div>
  )
}
