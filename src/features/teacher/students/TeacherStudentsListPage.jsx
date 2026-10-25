import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, RotateCcw, UserPlus, X } from 'lucide-react'

import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { useStudents } from '@/features/teacher/students/hooks/useStudents'
import { StudentPreviewDrawer } from '@/features/teacher/students/ui/directory/StudentPreviewDrawer'
import { STATUS_TABS, STUDENT_STATUS } from '@/features/teacher/students/ui/directory/studentDirectory.constants'
import { StudentEnrollModal } from '@/features/teacher/students/ui/StudentEnrollModal'
import { formatCohortDisplay } from '@/shared/lib/formatCohortDisplay'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Pagination } from '@/shared/ui/Pagination'
import { SearchInput } from '@/shared/ui/SearchInput'
import { ServerTable } from '@/shared/ui/ServerTable'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

const pct = (part, total) => (total ? Math.round((100 * part) / total) : 0)

function SummaryStrip({ stats }) {
  if (!stats) return null
  const c = stats.cohort ?? {}
  const a = stats.accounts ?? {}
  const items = [
    { label: 'Étudiants', value: c.total ?? 0 },
    { label: 'Femmes', value: c.female_count ?? 0, hint: `${pct(c.female_count, c.total)} %` },
    { label: 'Comptes activés', value: (c.total ?? 0) - (a.pending_activation ?? 0), hint: `${a.pending_activation ?? 0} à activer` },
    { label: 'Inscriptions en attente', value: stats.enrollments?.pending ?? 0, warn: (stats.enrollments?.pending ?? 0) > 0 },
  ]
  return (
    <dl className="grid grid-cols-2 divide-[var(--app-border)] overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] sm:grid-cols-4 sm:divide-x">
      {items.map((it) => (
        <div key={it.label} className="px-4 py-3">
          <dt className="text-[11.5px] text-[var(--app-muted)]">{it.label}</dt>
          <dd className="mt-0.5 flex items-baseline gap-2">
            <span className={cn('font-heading text-[20px] font-semibold tabular-nums', it.warn ? 'text-amber-700 dark:text-amber-300' : 'text-[var(--app-fg)]')}>{it.value}</span>
            {it.hint ? <span className="text-[11.5px] text-[var(--app-muted)]">{it.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function TeacherStudentsListPage() {
  const ts = useStudents()
  const [selected, setSelected] = useState(() => new Set())
  const [preview, setPreview] = useState(null)
  const [enrollOpen, setEnrollOpen] = useState(false)

  useEffect(() => {
    setSelected(new Set())
  }, [ts.page, ts.pageSize, ts.ordering, ts.q, ts.programId, ts.departmentId, ts.levelId, ts.status, ts.cohorteId, ts.filterAcademicYearId])

  const selectedRows = useMemo(() => ts.results.filter((r) => selected.has(r.id)), [ts.results, selected])
  const selectedDepartments = new Set(selectedRows.map((r) => r.department_code).filter(Boolean))
  const canEnroll = selectedRows.length > 0 && selectedDepartments.size === 1
  const enrollDepartment = canEnroll ? ts.departments.find((d) => d.code === selectedRows[0].department_code) : null
  const accounts = ts.stats?.accounts

  const columns = [
    {
      key: 'name',
      header: 'Étudiant',
      orderingField: 'last_name',
      cell: (s) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={`${s.first_name} ${s.last_name}`} src={s.photo_url} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-[var(--app-fg)]">
              {s.last_name} {s.first_name}
            </span>
            <span className="block truncate font-mono text-[11.5px] text-[var(--app-muted)]">{s.matricule}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'program',
      header: 'Programme · niveau',
      orderingField: 'level__program__code',
      cell: (s) =>
        s.program_code ? (
          <span className="flex flex-col">
            <span>{s.program_code}</span>
            <span className="text-[11.5px] text-[var(--app-muted)]">{s.level_name ?? '—'}</span>
          </span>
        ) : (
          <span className="text-[var(--app-muted)]">Sans niveau</span>
        ),
    },
    {
      key: 'cohort',
      header: 'Cohorte',
      orderingField: 'cohorte__promotion_number',
      cell: (s) => <span className="text-[var(--app-fg-soft)]">{formatCohortDisplay(s) || '—'}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (s) => <span className="block max-w-[14rem] truncate text-[var(--app-fg-soft)]">{s.email || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      orderingField: 'status',
      cell: (s) => {
        const st = STUDENT_STATUS[s.status]
        return st ? <StatusPill tone={st.tone}>{st.label}</StatusPill> : s.status
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <SummaryStrip stats={ts.stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Statut du dossier">
          {STATUS_TABS.map((t) => {
            const count = t.id ? accounts?.[STUDENT_STATUS[t.id].statKey] : ts.stats?.cohort?.total
            const active = ts.status === t.id
            return (
              <button
                key={t.id || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => ts.setStatus(t.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors',
                  active ? 'bg-[var(--app-fg)] text-[var(--app-canvas)]' : 'text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]',
                )}
              >
                {t.label}
                {count != null ? <span className="ml-1.5 tabular-nums opacity-70">{count}</span> : null}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={ts.exportCsv}>
            <Download size={14} aria-hidden /> Exporter
          </Button>
          {ts.canImport ? (
            <Button as={Link} to="/teacher/students/import-export" size="sm">
              <UserPlus size={14} aria-hidden /> Ajouter des étudiants
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={ts.q} onChange={ts.setQ} placeholder="Nom, matricule, INE…" className="w-full sm:w-72" />
        <ScopeSelect
          className={cn(SELECT, 'max-w-[15rem]')}
          options={ts.scopeOptions}
          departmentId={ts.departmentId}
          programId={ts.programId}
          onChange={ts.setScope}
          allLabel="Tous les programmes"
        />
        <select className={SELECT} value={ts.levelId} onChange={(e) => ts.setLevelId(e.target.value)} disabled={!ts.levels.length} aria-label="Niveau">
          <option value="">{ts.levels.length ? 'Tous les niveaux' : 'Niveau'}</option>
          {ts.levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select className={SELECT} value={ts.cohorteId} onChange={(e) => ts.setCohorteId(e.target.value)} disabled={!ts.cohorts.length} aria-label="Cohorte">
          <option value="">Toutes les cohortes</option>
          {ts.cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label || `Promotion ${c.promotion_number}`}
            </option>
          ))}
        </select>
        <select className={SELECT} value={ts.filterAcademicYearId} onChange={(e) => ts.setFilterAcademicYearId(e.target.value)} aria-label="Année d’entrée">
          <option value="">Toutes les années d’entrée</option>
          {ts.academicYears.map((y) => (
            <option key={y.id} value={y.id}>
              Entrée {y.year}
            </option>
          ))}
        </select>
        {ts.activeFilterCount ? (
          <button type="button" onClick={ts.resetFilters} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]">
            <RotateCcw size={13} aria-hidden /> Réinitialiser
          </button>
        ) : null}
      </div>

      <ServerTable
        columns={columns}
        rows={ts.results}
        loading={ts.loading}
        error={ts.error ? { message: ts.error, onRetry: ts.load } : null}
        ordering={ts.ordering}
        onOrderingChange={(o) => ts.setOrdering(o ?? '-created_at')}
        onRowClick={setPreview}
        activeRowId={preview?.id}
        selection={{ ids: selected, onChange: setSelected }}
        empty={{
          title: ts.activeFilterCount ? 'Aucun étudiant ne correspond' : 'Aucun étudiant',
          description: ts.activeFilterCount ? 'Modifiez ou réinitialisez les filtres.' : 'Les étudiants de votre périmètre apparaîtront ici.',
        }}
        footer={
          <Pagination
            page={ts.page}
            pageSize={ts.pageSize}
            count={ts.count}
            onPageChange={ts.setPage}
            onPageSizeChange={ts.setPageSize}
            pageSizeOptions={[20, 50, 100]}
          />
        }
      />

      {selected.size ? (
        <div className="ds-pop-in sticky bottom-4 z-20 mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-2.5 shadow-lg">
          <span className="text-[13px] text-[var(--app-fg)]">
            <span className="font-semibold tabular-nums">{selected.size}</span> sélectionné{selected.size > 1 ? 's' : ''}
            {!canEnroll && selectedRows.length ? (
              <span className="ml-2 text-[12px] text-amber-700 dark:text-amber-300">Inscription groupée : un seul département à la fois</span>
            ) : null}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X size={14} aria-hidden /> Désélectionner
            </Button>
            <Button size="sm" onClick={() => setEnrollOpen(true)} disabled={!canEnroll}>
              Inscrire aux cours
            </Button>
          </div>
        </div>
      ) : null}

      <StudentPreviewDrawer student={preview} onClose={() => setPreview(null)} />
      <StudentEnrollModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        selectedStudentIds={[...selected]}
        selectedCount={selected.size}
        departmentId={enrollDepartment?.id ?? null}
        departmentCode={enrollDepartment?.code ?? ''}
        departmentName={enrollDepartment?.name ?? ''}
        academicYearId={ts.filterAcademicYearId}
        onSubmitted={() => {
          setSelected(new Set())
          ts.load()
        }}
      />
    </div>
  )
}
