import { useEffect, useState } from 'react'
import { Download, Printer, X } from 'lucide-react'

import { fetchTranscript } from '@/features/reports/api/reportsApi'
import { downloadPdf, fmtNote } from '@/features/reports/model/reportExport'
import { COURSE_RESULT, DECISION_TONE } from '@/features/reports/model/reportLabels'
import { globalSearch } from '@/features/search/api/searchApi'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]'

function StudentPicker({ onPick }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  useEffect(() => {
    if (q.trim().length < 2) return setResults([])
    const controller = new AbortController()
    const t = setTimeout(() => {
      globalSearch(q.trim(), { signal: controller.signal })
        .then((d) => setResults(d.students ?? []))
        .catch(() => {})
    }, 200)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [q])
  return (
    <div className="relative w-full max-w-md">
      <SearchInput value={q} onChange={setQ} placeholder="Rechercher un étudiant (nom, matricule, INE)" />
      {results.length ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(r)
                  setQ('')
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--app-hover)]"
              >
                <Avatar name={r.title} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[var(--app-fg)]">{r.title}</span>
                  <span className="block truncate text-[11.5px] text-[var(--app-muted)]">{r.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Relevé de notes d'un étudiant : semestre, année ou tout le parcours (notes publiées). */
export function TranscriptReport({ initialStudent = null }) {
  const [student, setStudent] = useState(initialStudent)
  const [period, setPeriod] = useState('year')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!student) return undefined
    let cancelled = false
    setLoading(true)
    setError('')
    const opts = period === 'all' ? { allYears: true } : period.startsWith('S') ? { semester: Number(period.slice(1)) } : {}
    fetchTranscript(student.id, opts)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [student, period])

  const periodLabel = period === 'all' ? 'Tout le parcours' : period.startsWith('S') ? `Semestre ${period.slice(1)}` : `Année ${data?.academic_year ?? ''}`

  function exportPdf() {
    const s = data.student
    const tables = data.structure.flatMap((sem) =>
      sem.units.map((u) => ({
        title: `${sem.semester ? `S${sem.semester} · ` : ''}${u.code} — ${u.name} (${u.credits} cr.) · moyenne ${fmtNote(data.units[String(u.id)])}`,
        head: [['Code', 'Matière', 'Crédits', 'Moyenne', 'Résultat']],
        body: u.courses.map((c) => {
          const cell = data.cells[c.id]
          return [c.code, c.name, c.credits ?? '', cell?.state === 'graded' ? fmtNote(cell.average) : 'en attente', cell?.state === 'graded' ? (cell.compensated ? 'Compensé' : COURSE_RESULT[cell.status]?.label ?? '') : '']
        }),
        columnStyles: { 0: { cellWidth: 24 }, 2: { cellWidth: 16, halign: 'center' }, 3: { cellWidth: 24, halign: 'center' }, 4: { cellWidth: 26 } },
      })),
    )
    downloadPdf(`releve_${s.matricule}.pdf`, {
      title: 'Relevé de notes',
      subtitle: [
        `${s.last_name} ${s.first_name} · matricule ${s.matricule} · INE ${s.INE || '—'}`,
        `${s.department ?? ''} — ${s.program ? `${s.program.code} ${s.program.name}` : ''} · ${s.level ?? ''}`,
        periodLabel,
      ],
      tables,
      footer: `Moyenne générale : ${fmtNote(data.average)} · Crédits acquis : ${data.credits_earned ?? 0} / ${data.credits_attempted ?? 0} · Décision : ${data.decision_label}`,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {student ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-elevated)] py-1 pl-1 pr-2 text-[13px]">
            <Avatar name={student.title} size="xs" />
            <span className="font-medium">{student.title}</span>
            <button type="button" onClick={() => { setStudent(null); setData(null) }} className="rounded-full p-0.5 text-[var(--app-muted)] hover:bg-[var(--app-hover)]" aria-label="Changer d’étudiant">
              <X size={13} />
            </button>
          </span>
        ) : (
          <StudentPicker onPick={setStudent} />
        )}
        {student ? (
          <select className={SELECT} value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Période">
            <option value="year">Année en cours</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={`S${n}`}>
                Semestre {n} (année en cours)
              </option>
            ))}
            <option value="all">Tout le parcours</option>
          </select>
        ) : null}
        {data ? (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => window.print()}>
              <Printer size={14} aria-hidden /> Imprimer
            </Button>
            <Button size="sm" onClick={exportPdf}>
              <Download size={14} aria-hidden /> PDF
            </Button>
          </div>
        ) : null}
      </div>

      {!student ? (
        <SectionCard>
          <EmptyState title="Choisissez un étudiant" description="Le relevé reprend ses notes publiées, groupées par semestre et par UE, avec crédits et décision." />
        </SectionCard>
      ) : loading || !data ? (
        error ? (
          <SectionCard>
            <EmptyState tone="error" title="Chargement impossible" description={error} />
          </SectionCard>
        ) : (
          <SectionCard>
            <SkeletonLines lines={8} />
          </SectionCard>
        )
      ) : (
        <SectionCard
          title={`Relevé de notes — ${data.student.last_name} ${data.student.first_name}`}
          description={[data.student.matricule, data.student.program?.code, data.student.level, periodLabel].filter(Boolean).join(' · ')}
          actions={<StatusPill tone={DECISION_TONE[data.decision]}>{data.decision_label}</StatusPill>}
        >
          {!data.structure.length ? (
            <EmptyState compact title="Aucun cours sur cette période" />
          ) : (
            <div className="flex flex-col gap-5">
              {data.structure.map((sem) => (
                <section key={sem.semester ?? 'x'}>
                  {sem.semester ? <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Semestre {sem.semester}</h3> : null}
                  <div className="overflow-hidden rounded-xl border border-[var(--app-border)]">
                    <table className="w-full border-collapse text-[13px]">
                      <tbody>
                        {sem.units.map((u) => (
                          <UnitRows key={u.id} unit={u} data={data} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
              <dl className="grid grid-cols-3 divide-x divide-[var(--app-border)] rounded-xl border border-[var(--app-border)] bg-[var(--app-subtle)] text-center">
                <div className="px-3 py-3">
                  <dt className="text-[11.5px] text-[var(--app-muted)]">Moyenne générale</dt>
                  <dd className="font-heading text-[20px] font-semibold tabular-nums">{fmtNote(data.average)}</dd>
                </div>
                <div className="px-3 py-3">
                  <dt className="text-[11.5px] text-[var(--app-muted)]">Crédits acquis</dt>
                  <dd className="font-heading text-[20px] font-semibold tabular-nums">
                    {data.credits_earned ?? 0}
                    <span className="text-[13px] font-normal text-[var(--app-muted)]"> / {data.credits_attempted ?? 0}</span>
                  </dd>
                </div>
                <div className="px-3 py-3">
                  <dt className="text-[11.5px] text-[var(--app-muted)]">Décision</dt>
                  <dd className="mt-1">
                    <StatusPill tone={DECISION_TONE[data.decision]}>{data.decision_label}</StatusPill>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}

function UnitRows({ unit, data }) {
  return (
    <>
      <tr className="border-b border-[var(--app-border)] bg-[var(--app-subtle)]">
        <td colSpan={3} className="px-4 py-2 font-semibold text-[var(--app-fg)]">
          <span className="font-mono text-[12px]">{unit.code}</span> · {unit.name} <span className="font-normal text-[var(--app-muted)]">({unit.credits} cr.)</span>
        </td>
        <td className="px-4 py-2 text-right font-semibold tabular-nums">{fmtNote(data.units[String(unit.id)])}</td>
      </tr>
      {unit.courses.map((c) => {
        const cell = data.cells[c.id]
        const result = cell?.state !== 'graded' ? null : cell.compensated ? { label: 'Compensé', tone: 'info' } : COURSE_RESULT[cell.status]
        return (
          <tr key={c.id} className="border-b border-[var(--app-border)] last:border-0">
            <td className="w-24 px-4 py-2 font-mono text-[12px] text-[var(--app-muted)]">{c.code}</td>
            <td className="px-2 py-2">{c.name}</td>
            <td className="w-28 px-2 py-2 text-right text-[var(--app-fg-soft)] tabular-nums">{c.credits ?? '—'} cr.</td>
            <td className="w-36 px-4 py-2 text-right">
              {cell?.state === 'graded' ? (
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{fmtNote(cell.average)}</span>
                  {result ? <StatusPill tone={result.tone} dot={false}>{result.label}</StatusPill> : null}
                </span>
              ) : (
                <span className="text-[12px] text-[var(--app-muted)]">En attente</span>
              )}
            </td>
          </tr>
        )
      })}
    </>
  )
}
