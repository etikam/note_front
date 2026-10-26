import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, FileSpreadsheet, Printer } from 'lucide-react'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { fetchDeliberation } from '@/features/reports/api/reportsApi'
import { downloadCsv, downloadPdf, fmtNote } from '@/features/reports/model/reportExport'
import { DECISION_TONE } from '@/features/reports/model/reportLabels'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

/** Colonnes à plat : par UE, ses cours puis la moyenne d'UE. */
function flatColumns(structure) {
  const units = []
  for (const sem of structure) {
    for (const u of sem.units) units.push({ ...u, semester: sem.semester })
  }
  return units
}

export function GradeCell({ cell }) {
  if (!cell) return <span className="text-[var(--app-border-strong)]">·</span>
  if (cell.state !== 'graded') return <span className="text-[var(--app-muted)]" title={cell.state === 'pending' ? 'Fiche non publiée' : 'Note manquante'}>…</span>
  const mark = cell.compensated ? 'C' : cell.status === 'NEEDS_MAKEUP' ? 'R' : cell.status === 'DEBT' ? 'D' : null
  return (
    <span className={cn('tabular-nums', mark === 'D' && 'font-semibold text-red-700 dark:text-red-300', mark === 'R' && 'text-amber-700 dark:text-amber-300')} title={mark === 'C' ? 'Compensé (UE ou semestre validé)' : mark === 'R' ? 'Rattrapage' : mark === 'D' ? 'Dette' : 'Validé'}>
      {fmtNote(cell.average)}
      {mark ? <sup className="ml-0.5 text-[9px] font-bold">{mark}</sup> : null}
    </span>
  )
}

export function DeliberationReport() {
  const { academicYearLabel } = useAcademicYear()
  const scopeOptions = useScopeOptions('reports.view')
  const [programId, setProgramId] = useState('')
  const [levels, setLevels] = useState([])
  const [levelId, setLevelId] = useState('')
  const [semester, setSemester] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (scopeOptions.loading || programId) return
    const locked = defaultScope(scopeOptions)
    if (locked.programId) setProgramId(locked.programId)
  }, [scopeOptions, programId])

  useEffect(() => {
    setLevelId('')
    setData(null)
    if (!programId) return setLevels([])
    fetchLevels({ program: programId }).then(setLevels).catch(() => setLevels([]))
  }, [programId])

  useEffect(() => {
    if (!levelId) return undefined
    let cancelled = false
    setLoading(true)
    setError('')
    fetchDeliberation({ level: levelId, semester })
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [levelId, semester])

  const units = useMemo(() => (data ? flatColumns(data.structure) : []), [data])
  const title = data ? `PV de délibération — ${data.program.code} · ${data.level.name}${data.semester ? ` · S${data.semester}` : ' · année complète'}` : ''

  function exportCsv() {
    const header = ['Matricule', 'Nom', 'Prénom']
    for (const u of units) {
      for (const c of u.courses) header.push(`${c.code} (${c.credits ?? ''} cr.)`)
      header.push(`Moy. ${u.code}`)
    }
    header.push('Moyenne', 'Crédits acquis', 'Décision')
    const rows = data.students.map((s) => {
      const row = [s.matricule, s.last_name, s.first_name]
      for (const u of units) {
        for (const c of u.courses) {
          const cell = s.cells[c.id]
          row.push(cell?.state === 'graded' ? cell.average : cell ? 'en attente' : '')
        }
        row.push(s.units[String(u.id)] ?? '')
      }
      row.push(s.average ?? '', s.credits_earned ?? '', s.decision_label)
      return row
    })
    downloadCsv(`PV_${data.program.code}_${data.level.name}_${data.semester ? `S${data.semester}` : 'annee'}.csv`, header, rows)
  }

  function exportPdf() {
    const head = [['N°', 'Matricule', 'Nom et prénom', ...units.flatMap((u) => [...u.courses.map((c) => c.code), `Moy. ${u.code}`]), 'Moy.', 'Cr.', 'Décision']]
    const body = data.students.map((s, i) => [
      i + 1,
      s.matricule,
      `${s.last_name} ${s.first_name}`,
      ...units.flatMap((u) => [
        ...u.courses.map((c) => {
          const cell = s.cells[c.id]
          if (!cell) return ''
          if (cell.state !== 'graded') return '…'
          return `${fmtNote(cell.average)}${cell.compensated ? ' C' : cell.status === 'NEEDS_MAKEUP' ? ' R' : cell.status === 'DEBT' ? ' D' : ''}`
        }),
        fmtNote(s.units[String(u.id)]),
      ]),
      fmtNote(s.average),
      s.credits_earned ?? '',
      s.decision_label,
    ])
    downloadPdf(`PV_${data.program.code}_${data.level.name}.pdf`, {
      title: 'Procès-verbal de délibération',
      subtitle: [
        `${data.department.name} — ${data.program.code} ${data.program.name}`,
        `${data.level.name} · ${data.semester ? `Semestre ${data.semester}` : 'Année complète'} · Année ${data.academic_year}`,
        data.complete ? 'Toutes les fiches de notes sont publiées.' : `Provisoire : ${data.courses_published}/${data.courses_total} fiches publiées.`,
      ],
      tables: [{ head, body }],
      orientation: 'landscape',
      footer: `Admis : ${data.summary.admitted} · Admis avec dette : ${data.summary.admitted_debt} · Rattrapage : ${data.summary.makeup} · Ajournés : ${data.summary.repeat ?? 0} · En attente : ${data.summary.pending}    Le président du jury : ______________________`,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ScopeSelect className={cn(SELECT, 'max-w-[16rem]')} options={scopeOptions} departmentId="" programId={programId} onChange={({ programId: p }) => setProgramId(p || '')} allLabel="Choisir un programme" />
        <select className={SELECT} value={levelId} onChange={(e) => setLevelId(e.target.value)} disabled={!levels.length} aria-label="Niveau">
          <option value="">{programId ? 'Choisir un niveau' : 'Niveau'}</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select className={SELECT} value={semester} onChange={(e) => setSemester(e.target.value)} aria-label="Semestre">
          <option value="">Année complète</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              Semestre {n}
            </option>
          ))}
        </select>
        {data?.students?.length ? (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={exportCsv}>
              <FileSpreadsheet size={14} aria-hidden /> Excel (CSV)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.print()}>
              <Printer size={14} aria-hidden /> Imprimer
            </Button>
            <Button size="sm" onClick={exportPdf}>
              <Download size={14} aria-hidden /> PDF
            </Button>
          </div>
        ) : null}
      </div>

      {!levelId ? (
        <SectionCard>
          <EmptyState title="Choisissez un programme et un niveau" description={`Le PV rassemble les notes publiées de ${academicYearLabel ?? 'l’année'} pour chaque étudiant du niveau.`} />
        </SectionCard>
      ) : loading ? (
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      ) : error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} />
        </SectionCard>
      ) : data ? (
        <SectionCard
          title={title}
          description={`${data.department.name} · Année ${data.academic_year} · ${data.summary.students} étudiant(s)`}
          actions={data.complete ? <StatusPill tone="success">Définitif</StatusPill> : <StatusPill tone="warning">Provisoire</StatusPill>}
          flush
        >
          {!data.complete ? (
            <p className="flex items-center gap-2 border-b border-[var(--app-border)] bg-amber-50 px-4 py-2 text-[12.5px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              <AlertTriangle size={14} aria-hidden /> {data.courses_published} fiche(s) publiée(s) sur {data.courses_total} : les cours non publiés apparaissent « … » et les étudiants concernés « en attente ».
            </p>
          ) : null}
          {!data.students.length ? (
            <EmptyState compact title="Aucun étudiant inscrit" description="Aucune inscription approuvée aux cours de ce niveau pour cette période." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-[var(--app-subtle)] text-[11px] text-[var(--app-muted)]">
                  <tr className="border-b border-[var(--app-border)]">
                    <th rowSpan={2} className="sticky left-0 z-[1] min-w-[14rem] bg-[var(--app-subtle)] px-3 py-2 text-left font-semibold uppercase tracking-wider">
                      Étudiant
                    </th>
                    {units.map((u) => (
                      <th key={u.id} colSpan={u.courses.length + 1} className="border-l border-[var(--app-border)] px-2 py-1.5 text-center font-semibold" title={u.name}>
                        {u.semester ? `S${u.semester} · ` : ''}
                        {u.code} <span className="font-normal">({u.credits} cr.)</span>
                      </th>
                    ))}
                    <th rowSpan={2} className="border-l border-[var(--app-border)] px-3 py-2 text-right font-semibold uppercase">Moy.</th>
                    <th rowSpan={2} className="px-3 py-2 text-right font-semibold uppercase">Crédits</th>
                    <th rowSpan={2} className="px-3 py-2 text-left font-semibold uppercase">Décision</th>
                  </tr>
                  <tr className="border-b border-[var(--app-border)]">
                    {units.flatMap((u) => [
                      ...u.courses.map((c) => (
                        <th key={c.id} className="border-l border-[var(--app-border)] px-2 py-1.5 text-center font-mono font-medium" title={`${c.name} · ${c.credits ?? '?'} cr.${c.published ? '' : ' · fiche non publiée'}`}>
                          {c.code}
                          {!c.published ? <span className="ml-0.5 text-amber-600">•</span> : null}
                        </th>
                      )),
                      <th key={`avg-${u.id}`} className="border-l border-[var(--app-border)] px-2 py-1.5 text-center font-semibold">
                        Moy.
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-hover)]">
                      <td className="sticky left-0 z-[1] bg-[var(--app-elevated)] px-3 py-2">
                        <span className="block font-medium text-[var(--app-fg)]">
                          {s.last_name} {s.first_name}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--app-muted)]">{s.matricule}</span>
                      </td>
                      {units.flatMap((u) => [
                        ...u.courses.map((c) => (
                          <td key={c.id} className="border-l border-[var(--app-border)] px-2 py-2 text-center">
                            <GradeCell cell={s.cells[c.id]} />
                          </td>
                        )),
                        <td key={`avg-${u.id}`} className="border-l border-[var(--app-border)] bg-[var(--app-subtle)]/50 px-2 py-2 text-center font-semibold tabular-nums">
                          {fmtNote(s.units[String(u.id)])}
                        </td>,
                      ])}
                      <td className="border-l border-[var(--app-border)] px-3 py-2 text-right font-semibold tabular-nums">{fmtNote(s.average)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {s.credits_earned ?? 0}
                        <span className="text-[var(--app-muted)]">/{s.credits_attempted ?? 0}</span>
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill tone={DECISION_TONE[s.decision]}>{s.decision_label}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--app-border)] px-4 py-3 text-[12.5px] text-[var(--app-fg-soft)]">
            <span>
              Admis <strong className="tabular-nums text-[var(--app-fg)]">{data.summary.admitted}</strong>
            </span>
            <span>
              Admis avec dette <strong className="tabular-nums text-[var(--app-fg)]">{data.summary.admitted_debt}</strong>
            </span>
            <span>
              Rattrapage <strong className="tabular-nums text-[var(--app-fg)]">{data.summary.makeup}</strong>
            </span>
            <span>
              Ajournés <strong className="tabular-nums text-[var(--app-fg)]">{data.summary.repeat ?? 0}</strong>
            </span>
            <span>
              En attente <strong className="tabular-nums text-[var(--app-fg)]">{data.summary.pending}</strong>
            </span>
            {data.summary.pass_rate != null ? (
              <span className="ml-auto">
                Taux d’admission <strong className="tabular-nums text-[var(--app-fg)]">{String(data.summary.pass_rate).replace('.', ',')} %</strong>
              </span>
            ) : null}
            <span className="w-full text-[11.5px] text-[var(--app-muted)]">C : compensé · R : rattrapage · D : dette · … : fiche non publiée · · : non inscrit. Moyennes pondérées par les crédits, décisions selon le règlement des études de l’année.</span>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
