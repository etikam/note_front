import { Fragment, useEffect, useMemo, useState } from 'react'
import { Building2, FileSpreadsheet, Layers } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { DECISION_LABEL, DECISION_ORDER, fmtNote, fmtPct } from '@/features/notes/model/notesModel'
import { DecisionBar, Metric } from '@/features/notes/ui/GradeVisuals'
import { Toggle } from '@/features/notes/ui/NotesFilterBar'
import { fetchLevelStatistics } from '@/features/reports/api/reportsApi'
import { downloadCsv } from '@/features/reports/model/reportExport'
import { useReportFilters } from '@/features/reports/model/useReportFilters'
import { ReportFilterBar } from '@/features/reports/ui/ReportFilterBar'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'

/** Effectif ventilé : total en gras, filles / garçons dessous. */
function Split({ value, strong = false, tone }) {
  if (!value) return <span className="text-[var(--app-muted)]">—</span>
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className={cn('tabular-nums', strong ? 'text-[14px] font-semibold text-[var(--app-fg)]' : 'text-[13px] text-[var(--app-fg)]', value.total && tone)}>{value.total}</span>
      <span className="whitespace-nowrap text-[10.5px] tabular-nums text-[var(--app-muted)]">
        F {value.F} · G {value.M}
      </span>
    </span>
  )
}

function Rate({ value }) {
  if (value?.total == null) return <span className="text-[var(--app-muted)]">—</span>
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className="text-[14px] font-semibold tabular-nums text-[var(--app-fg)]">{fmtPct(value.total)}</span>
      <span className="whitespace-nowrap text-[10.5px] tabular-nums text-[var(--app-muted)]">
        F {fmtPct(value.F)} · G {fmtPct(value.M)}
      </span>
    </span>
  )
}

const decisionsOf = (d) => Object.fromEntries(DECISION_ORDER.map((k) => [k, d[k]?.total ?? 0]))

const COLUMNS = [
  { key: 'enrolled', label: 'Inscrits' },
  { key: 'evaluated', label: 'Évalués' },
  { key: 'admitted', label: 'Admis', decision: true },
  { key: 'admitted_debt', label: 'Avec dette', decision: true, tone: 'text-secondary-700 dark:text-secondary-300' },
  { key: 'makeup', label: 'Rattrapage', decision: true, tone: 'text-orange-700 dark:text-orange-300' },
  { key: 'repeat', label: 'Ajournés', decision: true, tone: 'text-red-700 dark:text-red-300' },
  { key: 'pending', label: 'En attente', decision: true },
]

/** Statistiques par niveau : effectifs, décisions du jury, réussite par sexe, moyennes, abandons. */
export function LevelStatisticsReport() {
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const f = useReportFilters('stats.view')
  const [publishedOnly, setPublishedOnly] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    fetchLevelStatistics(f.query, { publishedOnly })
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
    return () => {
      cancelled = true
    }
  }, [f.query, publishedOnly, academicYearId])

  // Département → programme → niveaux, pour un tableau imbriqué.
  const groups = useMemo(() => {
    const depts = new Map()
    for (const row of data?.levels ?? []) {
      if (!depts.has(row.department.id)) depts.set(row.department.id, { department: row.department, programs: new Map() })
      const programs = depts.get(row.department.id).programs
      if (!programs.has(row.program.id)) programs.set(row.program.id, { program: row.program, levels: [] })
      programs.get(row.program.id).levels.push(row)
    }
    return [...depts.values()].map((d) => ({ ...d, programs: [...d.programs.values()] }))
  }, [data])

  function exportCsv() {
    const split = (v) => [v.total, v.F, v.M]
    downloadCsv(
      `statistiques_niveaux_${academicYearLabel ?? ''}.csv`,
      [
        'Département', 'Programme', 'Niveau',
        ...['Inscrits', 'Évalués', ...DECISION_ORDER.map((k) => DECISION_LABEL[k]), 'Abandons'].flatMap((h) => [h, `${h} F`, `${h} G`]),
        'Réussite %', 'Réussite F %', 'Réussite G %', 'Moyenne', 'Moyenne F', 'Moyenne G',
      ],
      data.levels.map((r) => [
        r.department.code, r.program.code, r.label,
        ...split(r.enrolled), ...split(r.evaluated), ...DECISION_ORDER.flatMap((k) => split(r.decisions[k])), ...split(r.abandon),
        r.success_rate.total, r.success_rate.F, r.success_rate.M, r.average.total, r.average.F, r.average.M,
      ]),
    )
  }

  const t = data?.totals
  const colCount = COLUMNS.length + 5

  return (
    <div className="flex flex-col gap-4">
      <ReportFilterBar filters={f}>
        <Toggle checked={publishedOnly} onChange={setPublishedOnly} label="Publiées uniquement" hint="Décisions calculées sur les seules notes publiées (comme le PV)." />
        {data?.levels?.length ? (
          <Button size="sm" variant="ghost" onClick={exportCsv}>
            <FileSpreadsheet size={14} aria-hidden /> Excel (CSV)
          </Button>
        ) : null}
      </ReportFilterBar>

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} />
        </SectionCard>
      ) : !data ? (
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      ) : !data.levels.length ? (
        <SectionCard>
          <EmptyState title="Aucun niveau" description="Aucun niveau de votre périmètre ne correspond à ces filtres." />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Inscrits" value={t.enrolled.total} hint={`${t.enrolled.F} filles · ${t.enrolled.M} garçons`} />
              <Metric label="Taux de réussite" value={fmtPct(t.success_rate.total)} hint={`F ${fmtPct(t.success_rate.F)} · G ${fmtPct(t.success_rate.M)}`} />
              <Metric label="Rattrapage · ajournés" value={`${t.decisions.makeup.total} · ${t.decisions.repeat.total}`} hint={`${t.decisions.pending.total} en attente`} />
              <Metric label="Fiches publiées" value={`${t.courses_published}/${t.courses}`} hint={`${t.abandon.total} abandon${t.abandon.total > 1 ? 's' : ''}`} />
            </div>
            <div className="border-t border-[var(--app-border)] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <p className="mb-2 text-[11.5px] font-medium text-[var(--app-muted)]">Décisions du jury · {data.semester ? `semestre ${data.semester}` : 'année entière'}</p>
              <DecisionBar decisions={decisionsOf(t.decisions)} />
            </div>
          </div>

          <SectionCard flush title="Par niveau" description="Décisions selon le règlement des études de l’année. Réussite = admis (avec ou sans dette) parmi les étudiants délibérés.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--app-border)] bg-[var(--app-subtle)] text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                    <th className="px-4 py-2.5 text-left">Niveau</th>
                    {COLUMNS.map((c) => (
                      <th key={c.key} className="px-3 py-2.5 text-right">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right">Réussite</th>
                    <th className="px-3 py-2.5 text-right">Moyenne</th>
                    <th className="px-3 py-2.5 text-right">Abandons</th>
                    <th className="w-44 px-4 py-2.5 text-left">Répartition</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <Fragment key={g.department.id}>
                      <tr className="border-b border-[var(--app-border)] bg-[var(--app-subtle)]/60">
                        <td colSpan={colCount} className="px-4 py-2 text-[12.5px] font-semibold text-[var(--app-fg)]">
                          <span className="inline-flex items-center gap-2">
                            <Building2 size={14} className="text-[var(--app-muted)]" aria-hidden />
                            {g.department.name} <span className="font-normal text-[var(--app-muted)]">· {g.department.code}</span>
                          </span>
                        </td>
                      </tr>
                      {g.programs.map((pg) => (
                        <Fragment key={pg.program.id}>
                          <tr className="border-b border-[var(--app-border)]">
                            <td colSpan={colCount} className="py-1.5 pl-9 pr-4 text-[12.5px] font-medium text-[var(--app-fg-soft)]">
                              <span className="inline-flex items-center gap-2">
                                <Layers size={13} className="text-[var(--app-muted)]" aria-hidden />
                                {pg.program.name} <span className="font-mono text-[11px] text-[var(--app-muted)]">{pg.program.code}</span>
                              </span>
                            </td>
                          </tr>
                          {pg.levels.map((r) => (
                            <tr key={r.level_id} className="border-b border-[var(--app-border)] hover:bg-[var(--app-hover)]">
                              <td className="py-2 pl-14 pr-4">
                                <span className="block font-medium text-[var(--app-fg)]">{r.label}</span>
                                <span className="text-[11px] text-[var(--app-muted)]">
                                  {r.courses_published}/{r.courses} fiche{r.courses > 1 ? 's' : ''} publiée{r.courses_published > 1 ? 's' : ''}
                                </span>
                              </td>
                              {COLUMNS.map((c) => (
                                <td key={c.key} className="px-3 py-2 text-right">
                                  <Split value={c.decision ? r.decisions[c.key] : r[c.key]} strong={c.key === 'enrolled'} tone={c.tone} />
                                </td>
                              ))}
                              <td className="px-3 py-2 text-right">
                                <Rate value={r.success_rate} />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="flex flex-col items-end leading-tight">
                                  <span className="font-semibold tabular-nums">{fmtNote(r.average.total)}</span>
                                  <span className="whitespace-nowrap text-[10.5px] tabular-nums text-[var(--app-muted)]">
                                    F {fmtNote(r.average.F)} · G {fmtNote(r.average.M)}
                                  </span>
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Split value={r.abandon} />
                              </td>
                              <td className="px-4 py-2">
                                {r.enrolled.total ? <DecisionBar decisions={decisionsOf(r.decisions)} compact /> : <span className="text-[12px] text-[var(--app-muted)]">Aucun inscrit</span>}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--app-subtle)] font-semibold">
                    <td className="px-4 py-2.5 text-[12.5px] uppercase tracking-wide text-[var(--app-muted)]">Total</td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="px-3 py-2.5 text-right">
                        <Split value={c.decision ? t.decisions[c.key] : t[c.key]} strong tone={c.tone} />
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <Rate value={t.success_rate} />
                    </td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right">
                      <Split value={t.abandon} />
                    </td>
                    <td className="px-4 py-2.5">
                      <DecisionBar decisions={decisionsOf(t.decisions)} compact />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
