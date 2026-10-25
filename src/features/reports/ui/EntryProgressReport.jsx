import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'

import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { SheetProgressBar } from '@/features/dashboard/ui/DashboardCharts'
import { SHEET_STATUS, formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchEntryProgress } from '@/features/reports/api/reportsApi'
import { downloadCsv } from '@/features/reports/model/reportExport'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]'

/** Où en sont les fiches de notes : en saisie (notes manquantes), en validation (étape), publiées. */
export function EntryProgressReport() {
  const navigate = useNavigate()
  const scopeOptions = useScopeOptions('reports.view')
  const [programId, setProgramId] = useState('')
  const [status, setStatus] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError('')
    fetchEntryProgress({ program: programId })
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
    return () => {
      cancelled = true
    }
  }, [programId])

  const rows = useMemo(() => (data?.courses ?? []).filter((r) => !status || r.status === status), [data, status])

  const columns = [
    {
      key: 'course',
      header: 'Cours',
      sortValue: (r) => r.code,
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-medium">{r.name}</span>
          <span className="font-mono text-[11.5px] text-[var(--app-muted)]">{r.code}</span>
        </span>
      ),
    },
    {
      key: 'program',
      header: 'Programme · niveau',
      sortValue: (r) => `${r.program_code} ${r.level_name ?? ''}`,
      cell: (r) => (
        <span className="flex flex-col">
          <span>{r.program_code}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">{r.level_name ?? '—'}{r.semester ? ` · S${r.semester}` : ''}</span>
        </span>
      ),
    },
    { key: 'teacher', header: 'Enseignant', sortValue: (r) => r.teacher_name ?? '', cell: (r) => r.teacher_name ?? <span className="text-amber-700 dark:text-amber-300">Sans enseignant</span> },
    {
      key: 'status',
      header: 'État',
      sortValue: (r) => r.status,
      cell: (r) => (
        <span className="flex flex-col items-start gap-0.5">
          <StatusPill tone={SHEET_STATUS[r.status]?.tone}>{SHEET_STATUS[r.status]?.label ?? r.status}</StatusPill>
          {r.status === 'review' ? <span className="text-[11.5px] text-[var(--app-muted)]">{r.step_label} · {r.step_index + 1}/{r.steps_count}</span> : null}
        </span>
      ),
    },
    {
      key: 'missing',
      header: 'Notes manquantes',
      align: 'right',
      sortValue: (r) => r.missing,
      cell: (r) => (r.enrolled ? <span className={r.missing ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-[var(--app-muted)]'}>{r.missing}<span className="font-normal text-[var(--app-muted)]">/{r.enrolled}</span></span> : <span className="text-[var(--app-muted)]">aucun inscrit</span>),
    },
    {
      key: 'dates',
      header: 'Soumise · publiée',
      sortValue: (r) => r.published_at ?? r.submitted_at ?? '',
      cell: (r) => (
        <span className="flex flex-col text-[11.5px] text-[var(--app-fg-soft)]">
          <span>{r.submitted_at ? formatDateTime(r.submitted_at) : '—'}</span>
          <span className="text-[var(--app-muted)]">{r.published_at ? formatDateTime(r.published_at) : ''}</span>
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Fiches de notes de l’année">{data ? <SheetProgressBar counts={data.counts} /> : <Skeleton className="h-16 w-full" />}</SectionCard>
      <div className="flex flex-wrap items-center gap-2">
        <ScopeSelect className={cn(SELECT, 'max-w-[16rem]')} options={scopeOptions} departmentId="" programId={programId} onChange={({ programId: p }) => setProgramId(p || '')} allLabel="Tous les programmes" />
        <select className={SELECT} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="État">
          <option value="">Tous les états</option>
          {Object.entries(SHEET_STATUS).map(([k, s]) => (
            <option key={k} value={k}>
              {s.label}
            </option>
          ))}
        </select>
        {rows.length ? (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() =>
              downloadCsv(
                'avancement_saisie.csv',
                ['Code', 'Cours', 'Programme', 'Niveau', 'Enseignant', 'État', 'Étape', 'Inscrits', 'Notes manquantes', 'Soumise le', 'Publiée le'],
                rows.map((r) => [r.code, r.name, r.program_code, r.level_name, r.teacher_name, SHEET_STATUS[r.status]?.label, r.step_label, r.enrolled, r.missing, formatDateTime(r.submitted_at), formatDateTime(r.published_at)]),
              )
            }
          >
            <FileSpreadsheet size={14} aria-hidden /> Excel (CSV)
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        loading={!data && !error}
        error={error ? { message: error } : null}
        onRowClick={(r) => navigate(`/teacher/courses/${r.id}?tab=grades`)}
        initialSort={{ key: 'program', dir: 'asc' }}
        empty={{ title: 'Aucune fiche', description: 'Les cours de l’année apparaîtront ici.' }}
      />
    </div>
  )
}
