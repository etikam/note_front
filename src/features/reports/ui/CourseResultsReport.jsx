import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { SHEET_STATUS } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchCourseResults } from '@/features/reports/api/reportsApi'
import { downloadCsv, fmtNote } from '@/features/reports/model/reportExport'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'
const pct = (v) => (v == null ? '—' : `${String(v).replace('.', ',')} %`)

/** Distribution des moyennes publiées par tranche d'un point (0–1, …, 9–10), une seule teinte. */
function Distribution({ bins, scaleMax = 10, passMark = 5 }) {
  const max = Math.max(1, ...bins)
  const total = bins.reduce((a, b) => a + b, 0)
  if (!total) return <span className="text-[var(--app-muted)]">—</span>
  return (
    <span className="flex h-6 items-end gap-[2px]" role="img" aria-label={`Distribution des ${total} notes publiées`}>
      {bins.map((n, i) => (
        <span
          key={i}
          title={`${(i * scaleMax) / 10} à ${((i + 1) * scaleMax) / 10} : ${n} note(s)`}
          className={cn('w-1.5 rounded-t-[2px]', (i + 1) * (scaleMax / 10) <= passMark ? 'bg-zinc-400 dark:bg-zinc-500' : 'bg-brand-500 dark:bg-brand-400')}
          style={{ height: `${n ? Math.max(12, (100 * n) / max) : 4}%`, opacity: n ? 1 : 0.25 }}
        />
      ))}
    </span>
  )
}

/** Résultats par cours (notes publiées) : moyenne, réussite, rattrapages, dettes, distribution. */
export function CourseResultsReport() {
  const navigate = useNavigate()
  const scopeOptions = useScopeOptions('reports.view')
  const [programId, setProgramId] = useState('')
  const [levels, setLevels] = useState([])
  const [levelId, setLevelId] = useState('')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLevelId('')
    if (!programId) return setLevels([])
    fetchLevels({ program: programId }).then(setLevels).catch(() => setLevels([]))
  }, [programId])

  useEffect(() => {
    let cancelled = false
    setRows(null)
    setError('')
    fetchCourseResults({ program: programId, level: levelId })
      .then((r) => !cancelled && setRows(r))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
    return () => {
      cancelled = true
    }
  }, [programId, levelId])

  function exportCsv() {
    downloadCsv(
      'resultats_par_cours.csv',
      ['Code', 'Cours', 'Programme', 'Niveau', 'Semestre', 'Enseignant', 'Fiche', 'Inscrits', 'Notes publiées', 'Moyenne', 'Réussite %', 'Rattrapages', 'Dettes'],
      rows.map((r) => [r.code, r.name, r.program_code, r.level_name, r.semester, r.teacher_name, SHEET_STATUS[r.sheet_status]?.label, r.enrolled, r.graded, r.average, r.pass_rate, r.makeup, r.debt]),
    )
  }

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
          <span className="text-[11.5px] text-[var(--app-muted)]">
            {r.level_name ?? '—'}
            {r.semester ? ` · S${r.semester}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'sheet',
      header: 'Fiche',
      sortValue: (r) => r.sheet_status,
      cell: (r) => {
        const s = SHEET_STATUS[r.sheet_status]
        return s ? <StatusPill tone={s.tone}>{s.label}</StatusPill> : null
      },
    },
    { key: 'graded', header: 'Notés', align: 'right', sortValue: (r) => r.graded, cell: (r) => <span className="tabular-nums">{r.graded}<span className="text-[var(--app-muted)]">/{r.enrolled}</span></span> },
    { key: 'avg', header: 'Moyenne', align: 'right', sortValue: (r) => r.average ?? -1, cell: (r) => <span className="font-semibold tabular-nums">{fmtNote(r.average)}</span> },
    { key: 'pass', header: 'Réussite', align: 'right', sortValue: (r) => r.pass_rate ?? -1, cell: (r) => <span className="tabular-nums">{pct(r.pass_rate)}</span> },
    { key: 'makeup', header: 'Rattr.', align: 'right', sortValue: (r) => r.makeup, cell: (r) => <span className={r.makeup ? 'text-amber-700 dark:text-amber-300' : 'text-[var(--app-muted)]'}>{r.makeup}</span> },
    { key: 'debt', header: 'Dettes', align: 'right', sortValue: (r) => r.debt, cell: (r) => <span className={r.debt ? 'font-semibold text-red-700 dark:text-red-300' : 'text-[var(--app-muted)]'}>{r.debt}</span> },
    { key: 'dist', header: 'Distribution', cell: (r) => <Distribution bins={r.distribution} scaleMax={r.scale_max} passMark={r.pass_mark} /> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ScopeSelect className={cn(SELECT, 'max-w-[16rem]')} options={scopeOptions} departmentId="" programId={programId} onChange={({ programId: p }) => setProgramId(p || '')} allLabel="Tous les programmes" />
        <select className={SELECT} value={levelId} onChange={(e) => setLevelId(e.target.value)} disabled={!levels.length} aria-label="Niveau">
          <option value="">Tous les niveaux</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {rows?.length ? (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={exportCsv}>
            <FileSpreadsheet size={14} aria-hidden /> Excel (CSV)
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        rows={rows ?? []}
        loading={rows == null && !error}
        error={error ? { message: error } : null}
        onRowClick={(r) => navigate(`/teacher/courses/${r.id}?tab=grades`)}
        initialSort={{ key: 'program', dir: 'asc' }}
        empty={{ title: 'Aucun cours', description: 'Les cours de l’année de votre périmètre apparaîtront ici.' }}
      />
      <p className="text-[12px] text-[var(--app-muted)]">Calculs sur les notes publiées uniquement. Distribution : moyennes par dixième du barème, en gris sous le seuil de validation.</p>
    </div>
  )
}
