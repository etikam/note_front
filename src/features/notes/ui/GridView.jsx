import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { DECISION_TONE } from '@/features/reports/model/reportLabels'
import { cellResult, flatUnits, fmtNote, fullName, heatStyle, NOTE_LABELS } from '@/features/notes/model/notesModel'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusPill } from '@/shared/ui/StatusPill'

function cellTitle(student, course, cell) {
  if (!cell) return `${fullName(student)} n’est pas inscrit à ${course.code}`
  if (cell.state === 'pending') return `${course.code} : fiche non publiée`
  const notes = (cell.notes ?? []).map((v, i) => (v == null ? null : `${NOTE_LABELS[i]} ${fmtNote(v)}`)).filter(Boolean)
  const res = cellResult(cell)
  return [`${fullName(student)} — ${course.name}`, notes.join(' · '), cell.state === 'graded' ? `Moyenne ${fmtNote(cell.average)}${res ? ` (${res.label})` : ''}` : 'Notes incomplètes', cell.provisional ? 'Provisoire' : null]
    .filter(Boolean)
    .join('\n')
}

/** Légende de l'échelle divergente : sous le seuil → seuil → au-dessus. */
function HeatLegend({ grading }) {
  const steps = [-1, -0.5, 0, 0.5, 1]
  const { scale_max: scale, pass_mark: pass } = grading
  const valueAt = (t) => (t < 0 ? pass + t * pass : pass + t * (scale - pass))
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-[var(--app-muted)]">
      <span className="flex items-center gap-1.5">
        <span>0</span>
        <span className="flex overflow-hidden rounded">
          {steps.map((t) => (
            <span key={t} className="h-3 w-7" style={heatStyle(valueAt(t), grading)} />
          ))}
        </span>
        <span>{scale}</span>
        <span className="ml-1">seuil {fmtNote(pass)} au centre</span>
      </span>
      <span>
        <sup className="font-bold">R</sup> rattrapage · <sup className="font-bold">D</sup> dette · <sup className="font-bold">C</sup> compensé · <span className="italic">italique</span> provisoire
      </span>
    </div>
  )
}

/** Grille colorée étudiants × cours (groupés par UE), moyennes d'UE et générale ; tri par colonne. */
export function GridView({ data }) {
  const grading = data.grading ?? { scale_max: 10, pass_mark: 5 }
  const units = useMemo(() => flatUnits(data.structure), [data.structure])
  const [sort, setSort] = useState({ key: 'rank', dir: 'asc' })

  const rows = useMemo(() => {
    const value = (s) => {
      if (sort.key === 'rank') return s.rank ?? 1e9
      if (sort.key === 'name') return fullName(s)
      if (sort.key === 'avg') return s.average ?? -1
      if (sort.key.startsWith('u:')) return s.units?.[sort.key.slice(2)] ?? -1
      const cell = s.cells[sort.key]
      return cell?.state === 'graded' ? cell.average : -1
    }
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...data.students].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      return (typeof va === 'string' ? va.localeCompare(vb, 'fr') : va - vb) * dir
    })
  }, [data.students, sort])

  function toggle(key, firstDir = 'desc') {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: firstDir }))
  }

  if (!data.students.length) return <EmptyState title="Aucun étudiant inscrit" description="Aucune inscription approuvée aux cours de ce niveau." />

  const sortIcon = (k) => (sort.key === k ? sort.dir === 'asc' ? <ArrowUp size={11} aria-hidden /> : <ArrowDown size={11} aria-hidden /> : null)
  const headBtn = 'inline-flex items-center gap-0.5 hover:text-[var(--app-fg)]'

  return (
    <div className="flex flex-col gap-3">
      <HeatLegend grading={grading} />
      <div className="overflow-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] [max-height:calc(100vh-15rem)]">
        <table className="w-max min-w-full border-separate border-spacing-0 text-[12.5px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[var(--app-subtle)]">
              <th rowSpan={2} className="sticky left-0 z-30 min-w-[15rem] border-b border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-3 py-2 text-left font-semibold text-[var(--app-muted)]">
                <button type="button" className={headBtn} onClick={() => toggle('rank', 'asc')}>
                  Rang {sortIcon('rank')}
                </button>
                <span className="mx-1.5 opacity-40">·</span>
                <button type="button" className={headBtn} onClick={() => toggle('name', 'asc')}>
                  Étudiant {sortIcon('name')}
                </button>
              </th>
              {units.map((u) => (
                <th key={u.id} colSpan={u.courses.length + 1} className="border-b border-r border-[var(--app-border)] px-2 py-1.5 text-center font-semibold text-[var(--app-fg-soft)]" title={u.name}>
                  <span className="font-mono text-[11.5px]">{u.code}</span>
                  <span className="ml-1 font-normal text-[var(--app-muted)]">{u.credits} cr.</span>
                </th>
              ))}
              <th rowSpan={2} className="border-b border-[var(--app-border)] px-3 py-2 text-right font-semibold text-[var(--app-muted)]">
                <button type="button" className={headBtn} onClick={() => toggle('avg')}>
                  Moy. {sortIcon('avg')}
                </button>
              </th>
              <th rowSpan={2} className="border-b border-[var(--app-border)] px-3 py-2 text-left font-semibold text-[var(--app-muted)]">Décision</th>
            </tr>
            <tr className="bg-[var(--app-subtle)]">
              {units.flatMap((u) => [
                ...u.courses.map((c) => (
                  <th key={c.id} className="w-14 border-b border-[var(--app-border)] px-1 py-1.5 text-center text-[11px] font-medium text-[var(--app-muted)]" title={`${c.name}${c.stats?.mean != null ? ` — moyenne ${fmtNote(c.stats.mean)}` : ''}`}>
                    <button type="button" className={cn(headBtn, 'font-mono')} onClick={() => toggle(c.id)}>
                      {c.code}
                      {sortIcon(c.id)}
                    </button>
                  </th>
                )),
                <th key={`u-${u.id}`} className="w-14 border-b border-r border-[var(--app-border)] bg-[var(--app-hover)] px-1 py-1.5 text-center text-[11px] font-semibold text-[var(--app-fg-soft)]">
                  <button type="button" className={headBtn} onClick={() => toggle(`u:${u.id}`)}>
                    UE {sortIcon(`u:${u.id}`)}
                  </button>
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="group">
                <th scope="row" className="sticky left-0 z-10 border-b border-r border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-1.5 text-left font-normal group-hover:bg-[var(--app-hover)]">
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-center text-[11.5px] font-semibold tabular-nums text-[var(--app-muted)]">{s.rank ?? '—'}</span>
                    <span className="min-w-0">
                      <span className="block max-w-[11rem] truncate font-medium text-[var(--app-fg)]">{fullName(s)}</span>
                      <span className="font-mono text-[10.5px] text-[var(--app-muted)]">{s.matricule}</span>
                    </span>
                  </span>
                </th>
                {units.flatMap((u) => [
                  ...u.courses.map((c) => {
                    const cell = s.cells[c.id]
                    const graded = cell?.state === 'graded'
                    const res = cellResult(cell)
                    return (
                      <td
                        key={c.id}
                        title={cellTitle(s, c, cell)}
                        className={cn('border-b border-[var(--app-border)] p-[2px] text-center tabular-nums')}
                      >
                        <span
                          className={cn('flex h-7 items-center justify-center rounded-[4px] text-[12px]', cell?.provisional && 'italic', !graded && 'text-[var(--app-muted)]')}
                          style={graded ? heatStyle(cell.average, c.grading ?? grading) : undefined}
                        >
                          {!cell ? '·' : graded ? fmtNote(cell.average) : '…'}
                          {res?.mark ? <sup className="ml-0.5 text-[8.5px] font-bold">{res.mark}</sup> : null}
                        </span>
                      </td>
                    )
                  }),
                  <td key={`u-${u.id}`} className="border-b border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-1.5 text-center font-semibold tabular-nums text-[var(--app-fg)]">
                    {fmtNote(s.units?.[String(u.id)])}
                  </td>,
                ])}
                <td className="border-b border-[var(--app-border)] px-3 text-right text-[13px] font-semibold tabular-nums text-[var(--app-fg)]">{fmtNote(s.average)}</td>
                <td className="border-b border-[var(--app-border)] px-3">
                  <StatusPill tone={DECISION_TONE[s.decision]}>{s.decision_label}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 z-20">
            <tr className="bg-[var(--app-subtle)] text-[11.5px] text-[var(--app-muted)]">
              <th scope="row" className="sticky left-0 z-30 border-t border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-3 py-1.5 text-left font-semibold">
                Moyenne du cours · réussite
              </th>
              {units.flatMap((u) => [
                ...u.courses.map((c) => (
                  <td key={c.id} className="border-t border-[var(--app-border)] px-1 py-1.5 text-center tabular-nums">
                    <span className="block font-semibold text-[var(--app-fg-soft)]">{fmtNote(c.stats?.mean)}</span>
                    <span className="block text-[10.5px]">{c.stats?.pass_rate == null ? '—' : `${Math.round(c.stats.pass_rate)} %`}</span>
                  </td>
                )),
                <td key={`u-${u.id}`} className="border-t border-r border-[var(--app-border)]" />,
              ])}
              <td className="border-t border-[var(--app-border)] px-3 text-right font-semibold tabular-nums text-[var(--app-fg-soft)]">{fmtNote(data.summary.averages.mean)}</td>
              <td className="border-t border-[var(--app-border)]" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
