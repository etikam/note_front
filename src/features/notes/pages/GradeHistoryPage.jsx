import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { fetchGradeHistory } from '@/features/notes/api/notesApi'
import { AverageShift, ChangeDiff, SourcePill } from '@/features/notes/ui/GradeHistoryList'
import { SELECT } from '@/features/notes/ui/NotesFilterBar'
import { cn } from '@/shared/lib/cn'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { SearchInput } from '@/shared/ui/SearchInput'
import { ServerTable } from '@/shared/ui/ServerTable'
import { StatusPill } from '@/shared/ui/StatusPill'

const SOURCES = [
  { value: '', label: 'Toutes les sources' },
  { value: 'entry', label: 'Saisie' },
  { value: 'import', label: 'Import du cours' },
  { value: 'admin_import', label: 'Import administratif' },
]

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

/** Journal des modifications de notes : qui a changé quelle note, quand, et son effet. */
export default function GradeHistoryPage() {
  const scopeOptions = useScopeOptions('grades.view')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const debounced = useDebounced(q)
  const programId = params.get('program') ?? ''
  const source = params.get('source') ?? ''
  const page = Number(params.get('page') || 1)
  const [pageSize, setPageSize] = useState(20)
  const [state, setState] = useState({ rows: [], count: 0, loading: true, error: null })

  function set(patch) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v === '' || v == null || (k === 'page' && v === 1)) next.delete(k)
          else next.set(k, String(v))
        }
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    if ((params.get('q') ?? '') !== debounced) set({ q: debounced, page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchGradeHistory({ q: params.get('q') ?? '', program: programId, source, page, pageSize }, { signal: controller.signal })
      .then((d) => setState({ rows: d.results ?? [], count: d.count ?? 0, loading: false, error: null }))
      .catch((err) => !controller.signal.aborted && setState({ rows: [], count: 0, loading: false, error: { message: err?.message || 'Chargement impossible.' } }))
    return () => controller.abort()
  }, [params, programId, source, page, pageSize])

  const columns = [
    {
      key: 'date',
      header: 'Date',
      cell: (r) => <span className="whitespace-nowrap text-[12.5px] tabular-nums text-[var(--app-fg-soft)]">{formatDateTime(r.created_at)}</span>,
    },
    {
      key: 'student',
      header: 'Étudiant · cours',
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-medium">{r.student.name}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">
            <span className="font-mono">{r.student.matricule}</span> · <span className="font-mono">{r.course.code}</span> {r.course.name}
          </span>
        </span>
      ),
    },
    { key: 'changes', header: 'Modification', cell: (r) => <ChangeDiff changes={r.changes} /> },
    { key: 'effect', header: 'Moyenne', cell: (r) => <AverageShift change={r} /> },
    {
      key: 'actor',
      header: 'Par',
      cell: (r) => (
        <span className="flex flex-col items-start gap-1">
          <span className="text-[12.5px]">{r.actor_name ?? 'Système'}</span>
          <span className="flex flex-wrap gap-1">
            <SourcePill change={r} />
            {r.was_published ? <StatusPill tone="warning" dot={false}>Après publication</StatusPill> : null}
          </span>
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[{ label: 'Notes' }, { label: 'Journal' }]}
        title="Journal des notes"
        description="Chaque saisie, import ou correction de note est tracée : ancienne et nouvelle valeur, effet sur la moyenne, auteur et date."
      />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-2">
        <SearchInput value={q} onChange={setQ} placeholder="Étudiant, matricule, cours, auteur" className="w-full max-w-xs" ariaLabel="Rechercher dans le journal" />
        <ScopeSelect
          className={cn(SELECT, 'max-w-[17rem]')}
          options={scopeOptions}
          departmentId=""
          programId={programId}
          onChange={({ programId: p }) => set({ program: p || '', page: 1 })}
          allLabel="Tous les programmes"
        />
        <select className={SELECT} value={source} onChange={(e) => set({ source: e.target.value, page: 1 })} aria-label="Source">
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="ml-auto pr-1 text-[12px] tabular-nums text-[var(--app-muted)]">
          {state.count} modification{state.count > 1 ? 's' : ''}
        </span>
      </div>
      <ServerTable
          columns={columns}
          rows={state.rows}
          loading={state.loading}
          error={state.error}
          empty={{ title: 'Aucune modification', description: 'Les saisies et corrections de notes apparaîtront ici dès qu’elles seront faites.' }}
          footer={
            <Pagination
              page={page}
              pageSize={pageSize}
              count={state.count}
              onPageChange={(p) => set({ page: p })}
              onPageSizeChange={(s) => {
                setPageSize(s)
                set({ page: 1 })
              }}
            />
          }
        />
    </div>
  )
}
