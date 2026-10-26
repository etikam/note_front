import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, History, PencilLine } from 'lucide-react'

import { SHEET_STATUS, formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchCourseGrades, fetchGradeHistory } from '@/features/notes/api/notesApi'
import { fmtNote, fmtPct, fullName, GRADE_STATUS, NOTE_LABELS } from '@/features/notes/model/notesModel'
import { GradeHistoryTimeline } from '@/features/notes/ui/GradeHistoryList'
import { Histogram, Metric, NoteChips, ScoreGauge } from '@/features/notes/ui/GradeVisuals'
import { downloadCsv } from '@/features/reports/model/reportExport'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { Drawer } from '@/shared/ui/Drawer'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

/** Liste des cours (groupés par UE) + panneau détaillé du cours sélectionné. */
export function CoursesView({ courses, loading, error, selectedId, onSelect }) {
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const map = new Map()
    for (const c of courses ?? []) {
      if (needle && !`${c.code} ${c.name} ${c.teacher_name ?? ''}`.toLowerCase().includes(needle)) continue
      const key = c.teaching_unit?.id ?? 'x'
      if (!map.has(key)) map.set(key, { unit: c.teaching_unit, semester: c.semester, level: c.level_name, courses: [] })
      map.get(key).courses.push(c)
    }
    return [...map.values()]
  }, [courses, q])
  const selected = (courses ?? []).find((c) => c.id === selectedId) ?? groups[0]?.courses[0] ?? null

  if (error) return <EmptyState tone="error" title="Chargement impossible" description={error} />
  if (!loading && !courses?.length) return <EmptyState title="Aucun cours" description="Aucun cours de votre périmètre pour ces filtres et cette année." />

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <section aria-label="Cours" className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]">
        <div className="border-b border-[var(--app-border)] p-2.5">
          <SearchInput value={q} onChange={setQ} placeholder="Code, intitulé, enseignant" ariaLabel="Rechercher un cours" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5 max-lg:max-h-80">
          {loading && !courses ? <SkeletonLines lines={8} className="p-2" /> : null}
          {groups.map((g) => (
            <div key={g.unit?.id ?? 'x'} className="mb-1.5">
              <p className="truncate px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]" title={g.unit?.name}>
                {g.unit?.code} · {g.unit?.name}
              </p>
              {g.courses.map((c) => {
                const active = c.id === selected?.id
                const sheet = SHEET_STATUS[c.sheet_status]
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full flex-col gap-1 rounded-lg px-2.5 py-2 text-left transition-colors',
                      active ? 'bg-brand-50 ring-1 ring-inset ring-brand-500/30 dark:bg-white/[0.06] dark:ring-brand-400/30' : 'hover:bg-[var(--app-hover)]',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--app-fg)]">{c.name}</span>
                      <span className="text-[13px] font-semibold tabular-nums">{fmtNote(c.average)}</span>
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-[var(--app-muted)]">
                      <span className="font-mono">{c.code}</span>
                      <span>
                        {c.graded}/{c.enrolled}
                      </span>
                      <ScoreGauge value={c.average} scale={c.scale_max} pass={c.pass_mark} className="ml-auto w-14" />
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SHEET_DOT[c.sheet_status])} title={sheet?.label} />
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </section>
      {selected ? <CoursePanel key={selected.id} courseId={selected.id} /> : null}
    </div>
  )
}

const SHEET_DOT = { draft: 'bg-zinc-400', review: 'bg-brand-500', published: 'bg-green-500', unlocked: 'bg-secondary-500' }

function CoursePanel({ courseId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [historyFor, setHistoryFor] = useState(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError('')
    fetchCourseGrades(courseId)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (error) return <EmptyState tone="error" title="Chargement impossible" description={error} />
  if (!data) {
    return (
      <SectionCard>
        <SkeletonLines lines={10} />
      </SectionCard>
    )
  }

  const { course: c, stats, grading, sheet } = data
  const sheetStatus = SHEET_STATUS[sheet.status]
  const g = grading

  function exportCsv() {
    downloadCsv(
      `notes_${c.code}.csv`,
      ['Rang', 'Matricule', 'Nom', 'Prénom', 'N1', 'N2', 'N3', 'Rattrapage', 'Moyenne', 'Statut', 'Publiée'],
      data.students.map((s) => [s.rank ?? '', s.matricule, s.last_name, s.first_name, ...s.notes, s.average ?? '', GRADE_STATUS[s.status]?.label ?? s.status, s.published ? 'oui' : 'non']),
    )
  }

  const columns = [
    { key: 'rank', header: 'Rang', align: 'right', sortValue: (s) => s.rank ?? 1e9, cell: (s) => <span className="tabular-nums text-[var(--app-muted)]">{s.rank ?? '—'}</span>, className: 'w-14' },
    {
      key: 'name',
      header: 'Étudiant',
      sortValue: (s) => fullName(s),
      cell: (s) => (
        <span className="flex flex-col">
          <span className="font-medium">{fullName(s)}</span>
          <span className="font-mono text-[11px] text-[var(--app-muted)]">{s.matricule}</span>
        </span>
      ),
    },
    { key: 'notes', header: NOTE_LABELS.join(' · '), cell: (s) => <NoteChips notes={s.notes} pass={g.pass_mark} compact /> },
    {
      key: 'avg',
      header: 'Moyenne',
      align: 'right',
      sortValue: (s) => s.average ?? -1,
      cell: (s) => (
        <span className="flex items-center justify-end gap-2">
          <ScoreGauge value={s.average} scale={g.scale_max} pass={g.pass_mark} className="hidden w-14 sm:block" />
          <span className="w-10 text-right font-semibold tabular-nums">{fmtNote(s.average)}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Résultat',
      sortValue: (s) => s.status,
      cell: (s) => {
        const st = GRADE_STATUS[s.status]
        return <StatusPill tone={st?.tone} dot={false}>{st?.label ?? s.status}</StatusPill>
      },
    },
    {
      key: 'history',
      header: '',
      cell: (s) =>
        s.changes ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setHistoryFor(s)
            }}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]"
            title="Historique des modifications"
          >
            <History size={13} aria-hidden /> {s.changes}
          </button>
        ) : null,
    },
  ]

  return (
    <section aria-label={c.name} className="flex min-w-0 flex-col gap-4">
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11.5px] text-[var(--app-muted)]">
              <span className="font-mono">{c.teaching_unit.code}</span> · {c.teaching_unit.name}
            </p>
            <h2 className="mt-0.5 font-heading text-[18px] font-semibold tracking-tight text-[var(--app-fg)]">{c.name}</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--app-muted)]">
              <span className="font-mono">{c.code}</span> · {c.program.code}
              {c.level ? ` · ${c.level.name}` : ''}
              {c.semester ? ` · S${c.semester}` : ''} · {c.credits} cr. · {c.teacher_name ?? 'non affecté'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {sheetStatus ? <StatusPill tone={sheetStatus.tone}>{sheetStatus.label}{sheet.step_label ? ` · ${sheet.step_label}` : ''}</StatusPill> : null}
              <span className="text-[11.5px] text-[var(--app-muted)]">
                Pondération {g.weights.join(' / ')} % · seuil {fmtNote(g.pass_mark)} / {g.scale_max}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={exportCsv}>
              <FileSpreadsheet size={14} aria-hidden /> CSV
            </Button>
            <Link
              to={`/teacher/courses/${c.id}?tab=grades`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-[12.5px] font-medium text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)]"
            >
              <PencilLine size={14} aria-hidden /> Fiche de saisie
            </Link>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--app-border)] pt-4 sm:grid-cols-5">
          <Metric label="Moyenne" value={fmtNote(stats.mean)} hint={`médiane ${fmtNote(stats.median)}`} />
          <Metric label="Réussite" value={fmtPct(stats.pass_rate)} hint={`${stats.counts.PASSED} validé${stats.counts.PASSED > 1 ? 's' : ''}`} />
          <Metric label="Écart-type" value={fmtNote(stats.stdev)} hint={`de ${fmtNote(stats.min)} à ${fmtNote(stats.max)}`} />
          <Metric label="Rattrapages · dettes" value={`${stats.counts.NEEDS_MAKEUP} · ${stats.counts.DEBT}`} />
          <Metric label="Notés" value={`${stats.graded}/${stats.enrolled}`} hint={stats.missing ? `${stats.missing} incomplet${stats.missing > 1 ? 's' : ''}` : 'complet'} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <SectionCard title="Distribution des moyennes" description="Par dixième du barème ; en gris, sous le seuil.">
          {stats.graded ? <Histogram bins={stats.distribution} scale={g.scale_max} pass={g.pass_mark} /> : <EmptyState compact title="Aucune moyenne" />}
        </SectionCard>
        <SectionCard title="Moyenne par épreuve" description="Quelle épreuve a été la plus difficile ?">
          <ul className="flex flex-col gap-3">
            {stats.controls.map((ctl) => (
              <li key={ctl.key} className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between text-[12.5px]">
                  <span className="font-medium text-[var(--app-fg)]">
                    {ctl.label}
                    {ctl.weight != null ? <span className="ml-1 font-normal text-[var(--app-muted)]">{ctl.weight} %</span> : null}
                  </span>
                  <span className="tabular-nums text-[var(--app-fg-soft)]">
                    <span className="font-semibold text-[var(--app-fg)]">{fmtNote(ctl.mean)}</span>
                    <span className="text-[var(--app-muted)]"> · {ctl.count} note{ctl.count > 1 ? 's' : ''}</span>
                  </span>
                </span>
                <ScoreGauge value={ctl.mean} scale={g.scale_max} pass={g.pass_mark} className="h-2" />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Notes des étudiants" description={`${data.students.length} inscrit${data.students.length > 1 ? 's' : ''} · cliquez l’historique pour voir les modifications d’une note.`} flush>
        <DataTable columns={columns} rows={data.students} initialSort={{ key: 'rank', dir: 'asc' }} empty={{ title: 'Aucun inscrit', description: 'Aucune inscription approuvée à ce cours.' }} />
      </SectionCard>

      {sheet.events.length ? (
        <SectionCard title="Parcours de la fiche de notes">
          <ol className="flex flex-col gap-2.5">
            {sheet.events.map((e, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-[12.5px]">
                <span className="font-medium text-[var(--app-fg)]">{e.action_label}</span>
                {e.step_label ? <span className="text-[var(--app-muted)]">· {e.step_label}</span> : null}
                <span className="text-[var(--app-muted)]">
                  · {e.actor_name ?? '—'} · {formatDateTime(e.created_at)}
                </span>
                {e.comment ? <span className="w-full rounded-md bg-[var(--app-subtle)] px-2 py-1 text-[12px] text-[var(--app-fg-soft)]">« {e.comment} »</span> : null}
              </li>
            ))}
          </ol>
        </SectionCard>
      ) : null}

      <HistoryDrawer course={c} student={historyFor} onClose={() => setHistoryFor(null)} />
    </section>
  )
}

function HistoryDrawer({ course, student, onClose }) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    if (!student) return undefined
    let cancelled = false
    setItems(null)
    fetchGradeHistory({ course: course.id, student: student.id, pageSize: 100 })
      .then((d) => !cancelled && setItems(d.results ?? []))
      .catch(() => !cancelled && setItems([]))
    return () => {
      cancelled = true
    }
  }, [course.id, student])
  return (
    <Drawer open={Boolean(student)} onClose={onClose} eyebrow="Journal des notes" title={student ? fullName(student) : ''} description={`${course.code} · ${course.name}`} width="md">
      {items == null ? <SkeletonLines lines={6} /> : <GradeHistoryTimeline items={items} />}
    </Drawer>
  )
}
