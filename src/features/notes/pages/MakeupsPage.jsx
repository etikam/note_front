import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, FileSpreadsheet, Printer } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { SHEET_STATUS } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchDocumentSettings, fetchMakeups } from '@/features/notes/api/notesApi'
import { fmtNote, fullName } from '@/features/notes/model/notesModel'
import { useNotesFilters } from '@/features/notes/model/useNotesFilters'
import { Metric, NoteChips } from '@/features/notes/ui/GradeVisuals'
import { NotesFilterBar, ViewSwitch } from '@/features/notes/ui/NotesFilterBar'
import { usePrintDocuments } from '@/features/notes/ui/PrintPortal'
import { downloadCsv } from '@/features/reports/model/reportExport'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const KINDS = [
  { id: 'makeup', label: 'Rattrapages' },
  { id: 'debt', label: 'Dettes' },
]

/** Listes imprimables (une page par cours) : convocation au rattrapage ou état des dettes. */
function PrintableLists({ doc, courses, kind, yearLabel }) {
  return courses.map((c) => (
    <article key={c.id} className="doc-sheet" style={{ padding: '14mm', fontFamily: 'Inter, Arial, sans-serif', fontSize: 11, color: '#0f172a' }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>{doc?.institution_name}</p>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#64748b' }}>Année académique {yearLabel}</p>
      <h1 style={{ margin: '16px 0 2px', fontSize: 17, letterSpacing: '0.1em' }}>{kind === 'makeup' ? 'LISTE DES ÉTUDIANTS CONVOQUÉS AU RATTRAPAGE' : 'ÉTAT DES DETTES'}</h1>
      <p style={{ margin: 0, fontSize: 11.5 }}>
        <strong>{c.name}</strong> ({c.code}) · {c.program_code} {c.level_name ?? ''} {c.semester ? `· semestre ${c.semester}` : ''} · {c.teacher_name ?? 'enseignant non affecté'}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
        <thead>
          <tr>
            {['N°', 'Matricule', 'Nom et prénoms', 'Moyenne', 'Émargement'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', background: '#1e3a8a', color: '#fff', fontSize: 10 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c[kind].map((s, i) => (
            <tr key={s.id}>
              <td style={{ padding: '7px 8px', borderBottom: '1px solid #cbd5e1', width: 30 }}>{i + 1}</td>
              <td style={{ padding: '7px 8px', borderBottom: '1px solid #cbd5e1', fontFamily: 'ui-monospace, monospace' }}>{s.matricule}</td>
              <td style={{ padding: '7px 8px', borderBottom: '1px solid #cbd5e1' }}>{fullName(s)}</td>
              <td style={{ padding: '7px 8px', borderBottom: '1px solid #cbd5e1' }}>{fmtNote(s.average)}</td>
              <td style={{ padding: '7px 8px', borderBottom: '1px solid #cbd5e1', width: 140 }} />
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 14, fontSize: 10, color: '#64748b' }}>
        {c[kind].length} étudiant{c[kind].length > 1 ? 's' : ''} · seuil de validation {fmtNote(c.grading.pass_mark)} / {c.grading.scale_max}
      </p>
    </article>
  ))
}

function CourseCard({ course: c, kind, open, onToggle }) {
  const list = c[kind]
  const sheet = SHEET_STATUS[c.sheet_status]
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-[var(--app-hover)]">
        <span
          className={cn(
            'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[14px] font-bold tabular-nums',
            kind === 'makeup' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
          )}
        >
          {list.length}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-[var(--app-fg)]">{c.name}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">
            <span className="font-mono">{c.code}</span> · {c.program_code} {c.level_name ?? ''}
            {c.semester ? ` · S${c.semester}` : ''} · {c.teacher_name ?? 'non affecté'}
          </span>
        </span>
        {c.compensated ? <span className="text-[11.5px] text-[var(--app-muted)]">{c.compensated} dispensé{c.compensated > 1 ? 's' : ''} (compensé)</span> : null}
        {sheet ? <StatusPill tone={sheet.tone}>{sheet.label}</StatusPill> : null}
        <ChevronDown size={16} className={cn('text-[var(--app-muted)] transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <ul className="divide-y divide-[var(--app-border)] border-t border-[var(--app-border)]">
          {list.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-[var(--app-fg)]">{fullName(s)}</span>
                <span className="font-mono text-[11px] text-[var(--app-muted)]">{s.matricule}</span>
              </span>
              <NoteChips notes={s.notes} pass={c.grading.pass_mark} />
              <span className="w-24 text-right">
                <span className="text-[13.5px] font-semibold tabular-nums">{fmtNote(s.average)}</span>
                {s.provisional ? <span className="block text-[10.5px] text-[var(--app-muted)]">provisoire</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

/** Rattrapages et dettes à organiser : par cours, les étudiants concernés selon le règlement. */
export default function MakeupsPage() {
  const { academicYearLabel, academicYearId } = useAcademicYear()
  const f = useNotesFilters('grades.view', { autoLevel: false })
  const kind = f.params.get('kind') === 'debt' ? 'debt' : 'makeup'
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [openIds, setOpenIds] = useState(() => new Set())
  const [doc, setDoc] = useState(null)
  const { print, portal } = usePrintDocuments()

  useEffect(() => {
    fetchDocumentSettings().then(setDoc).catch(() => {})
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    fetchMakeups({ program: f.programId, level: f.levelId, semester: f.semester, publishedOnly: f.publishedOnly }, { signal: controller.signal })
      .then((d) => {
        setData(d)
        setOpenIds(new Set(d.courses.slice(0, 3).map((c) => c.id)))
      })
      .catch((err) => !controller.signal.aborted && setError(err?.message || 'Chargement impossible.'))
    return () => controller.abort()
  }, [f.programId, f.levelId, f.semester, f.publishedOnly, academicYearId])

  const courses = useMemo(() => (data?.courses ?? []).filter((c) => c[kind].length), [data, kind])

  function exportCsv() {
    downloadCsv(
      kind === 'makeup' ? 'rattrapages.csv' : 'dettes.csv',
      ['Cours', 'Intitulé', 'Programme', 'Niveau', 'Semestre', 'Enseignant', 'Matricule', 'Nom', 'Prénom', 'N1', 'N2', 'N3', 'Rattrapage', 'Moyenne'],
      courses.flatMap((c) => c[kind].map((s) => [c.code, c.name, c.program_code, c.level_name, c.semester, c.teacher_name, s.matricule, s.last_name, s.first_name, ...s.notes, s.average])),
    )
  }

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[{ label: 'Notes' }, { label: 'Rattrapages & dettes' }]}
        title="Rattrapages & dettes"
        description="Étudiants à convoquer au rattrapage et dettes restantes, cours par cours, selon le règlement des études (les cours compensés sont dispensés)."
        meta={academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
        actions={
          courses.length ? (
            <>
              <Button size="sm" variant="ghost" onClick={exportCsv}>
                <FileSpreadsheet size={14} aria-hidden /> CSV
              </Button>
              <Button size="sm" onClick={() => print(<PrintableLists doc={doc} courses={courses} kind={kind} yearLabel={academicYearLabel} />)}>
                <Printer size={14} aria-hidden /> Imprimer les listes
              </Button>
            </>
          ) : null
        }
      />

      <NotesFilterBar filters={f} requireLevel={false}>
        <ViewSwitch options={KINDS.map((k) => ({ ...k, label: `${k.label}${data ? ` · ${data.totals[k.id]}` : ''}` }))} value={kind} onChange={(k) => f.update({ kind: k === 'makeup' ? '' : k })} />
      </NotesFilterBar>

      {data ? (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 sm:grid-cols-5">
          <Metric label="Étudiants concernés" value={data.totals.students} />
          <Metric label="Rattrapages" value={data.totals.makeup} />
          <Metric label="Dettes" value={data.totals.debt} />
          <Metric label="Cours concernés" value={data.totals.courses} />
          <Metric label="Dispensés (compensés)" value={data.totals.compensated} hint="UE ou semestre validé" />
        </div>
      ) : null}

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} />
        </SectionCard>
      ) : !data ? (
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      ) : !courses.length ? (
        <SectionCard>
          <EmptyState
            title={kind === 'makeup' ? 'Aucun rattrapage' : 'Aucune dette'}
            description={kind === 'makeup' ? 'Aucun étudiant sous le seuil de validation pour ces filtres.' : 'Aucun étudiant en dette après rattrapage pour ces filtres.'}
          />
        </SectionCard>
      ) : (
        <div className="flex flex-col gap-2.5">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} kind={kind} open={openIds.has(c.id)} onToggle={() => toggle(c.id)} />
          ))}
        </div>
      )}
      {portal}
    </div>
  )
}
