import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SHEET_STATUS } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchCoursesList, fetchModules, fetchTeachingUnits } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Avatar } from '@/shared/ui/Avatar'
import { Pagination } from '@/shared/ui/Pagination'
import { SearchInput } from '@/shared/ui/SearchInput'
import { ServerTable } from '@/shared/ui/ServerTable'
import { StatusPill } from '@/shared/ui/StatusPill'

const PAGE_SIZE = 25
const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

/** Cours de l'année (programme courant) : UE, niveau, module, enseignant et état de la fiche de notes. */
export function CoursesTab({ academicYearId, programId }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [ordering, setOrdering] = useState('code')
  const [page, setPage] = useState(1)
  const [modules, setModules] = useState([])
  const [units, setUnits] = useState([])
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!academicYearId) return
    fetchModules(academicYearId).then(setModules).catch(() => setModules([]))
    fetchTeachingUnits({ academic_year_id: academicYearId, ...(programId ? { program: programId } : {}) })
      .then(setUnits)
      .catch(() => setUnits([]))
  }, [academicYearId, programId])

  useEffect(() => {
    setPage(1)
  }, [debounced, moduleId, unitId, programId, ordering, academicYearId])

  const params = useMemo(
    () => ({
      academic_year_id: academicYearId,
      page,
      page_size: PAGE_SIZE,
      ordering,
      ...(programId ? { program_id: programId } : {}),
      ...(moduleId ? { module_id: moduleId } : {}),
      ...(unitId ? { teaching_unit_id: unitId } : {}),
      ...(debounced ? { search: debounced } : {}),
    }),
    [academicYearId, page, ordering, programId, moduleId, unitId, debounced],
  )

  const load = useCallback(async () => {
    if (!academicYearId) return
    setLoading(true)
    setError('')
    try {
      setData(await fetchCoursesList(params, { skipErrorToast: true }))
    } catch (err) {
      setError(err?.message || 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [params, academicYearId])

  useEffect(() => {
    void load()
  }, [load])

  const columns = [
    {
      key: 'course',
      header: 'Cours',
      orderingField: 'code',
      cell: (c) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--app-fg)]">{c.name}</span>
          <span className="font-mono text-[11.5px] text-[var(--app-muted)]">{c.code}</span>
        </span>
      ),
    },
    {
      key: 'ue',
      header: 'UE',
      orderingField: 'teaching_unit__code',
      cell: (c) => <span className="block max-w-[14rem] truncate text-[var(--app-fg-soft)]" title={c.teaching_unit_name}>{c.teaching_unit_code}</span>,
    },
    {
      key: 'level',
      header: 'Niveau · période',
      cell: (c) => (
        <span className="flex flex-col">
          <span>{c.level_name ?? '—'}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">
            {c.module_label ?? '—'}
            {c.semester ? ` · S${c.semester}` : ''}
          </span>
        </span>
      ),
    },
    { key: 'credits', header: 'Crédits', align: 'right', cell: (c) => <span className="tabular-nums">{c.credits ?? '—'}</span> },
    {
      key: 'teacher',
      header: 'Enseignant',
      cell: (c) =>
        c.teacher_name ? (
          <span className="flex items-center gap-2">
            <Avatar name={c.teacher_name} size="xs" />
            <span className="truncate">{c.teacher_name}</span>
          </span>
        ) : (
          <StatusPill tone="warning">Sans enseignant</StatusPill>
        ),
    },
    {
      key: 'sheet',
      header: 'Fiche de notes',
      cell: (c) => {
        const s = SHEET_STATUS[c.grade_sheet_status]
        return s ? <StatusPill tone={s.tone}>{s.label}</StatusPill> : '—'
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Code ou intitulé du cours" className="w-full sm:w-64" />
        <select className={SELECT} value={moduleId} onChange={(e) => setModuleId(e.target.value)} aria-label="Module">
          <option value="">Tous les modules</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              Module {m.number}
            </option>
          ))}
        </select>
        <select className={`${SELECT} max-w-[16rem]`} value={unitId} onChange={(e) => setUnitId(e.target.value)} aria-label="UE">
          <option value="">Toutes les UE</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} — {u.name}
            </option>
          ))}
        </select>
      </div>
      <ServerTable
        columns={columns}
        rows={data.results ?? []}
        loading={loading}
        error={error ? { message: error, onRetry: load } : null}
        ordering={ordering}
        onOrderingChange={(o) => setOrdering(o ?? 'code')}
        onRowClick={(c) => navigate(`/teacher/courses/${c.id}`)}
        empty={{ title: 'Aucun cours', description: 'Les cours s’ajoutent depuis l’onglet UE : ouvrez une UE pour offrir ses cours sur un module.' }}
        footer={<Pagination page={page} pageSize={PAGE_SIZE} count={data.count ?? 0} onPageChange={setPage} />}
      />
    </div>
  )
}
