import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bookmark, BookOpen, GraduationCap, Layers, Search, Sparkles, Users, X } from 'lucide-react'

import { refPaths, useReferential } from '@/features/referential/model/ReferentialContext'
import { fetchCoursesList, fetchTeachingUnits } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { fetchStudentsList } from '@/features/teacher/students/api/studentsApi'
import { cn } from '@/shared/lib/cn'
import { Checkbox } from '@/shared/ui/Checkbox'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const VIEWS_KEY = 'referential.explorer.views'

function normalize(text) {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const curriculumState = (c) => (!c ? 'Sans maquette' : c.status === 'validated' ? 'Validée' : c.errors ? 'À corriger' : 'Brouillon')

/** Types d'éléments explorables : colonnes, facettes et « problèmes » prêts à l'emploi. */
const TYPES = {
  programs: {
    label: 'Programmes',
    icon: GraduationCap,
    search: (p) => `${p.code} ${p.name} ${p.department.code}`,
    facets: [
      { key: 'dept', label: 'Département', get: (p) => p.department.code },
      { key: 'state', label: 'Maquette', get: (p) => curriculumState(p.curriculum) },
    ],
    problems: [
      { key: 'no_director', label: 'Sans directeur', test: (p) => !p.holders?.length },
      { key: 'unassigned', label: 'Cours sans enseignant', test: (p) => p.counts.unassigned_courses > 0 },
      { key: 'errors', label: 'Maquette à corriger', test: (p) => (p.curriculum?.errors ?? 0) > 0 },
      { key: 'draft', label: 'Maquette non validée', test: (p) => p.curriculum && p.curriculum.status !== 'validated' },
    ],
    columns: [
      { label: 'Programme', cell: (p) => <><span className="font-mono text-[12px] font-semibold">{p.code}</span> <span className="text-[var(--app-fg-soft)]">{p.name}</span></> },
      { label: 'Département', cell: (p) => p.department.code },
      { label: 'Maquette', cell: (p) => <StatusPill dot={false} tone={p.curriculum?.status === 'validated' ? 'success' : p.curriculum?.errors ? 'danger' : 'warning'}>{curriculumState(p.curriculum)}</StatusPill> },
      { label: 'Étudiants', align: 'right', cell: (p) => p.counts.students },
      { label: 'Sans ens.', align: 'right', cell: (p) => p.counts.unassigned_courses || '—' },
    ],
  },
  units: {
    label: 'UE',
    icon: Layers,
    search: (u) => `${u.code} ${u.name} ${u.program_code}`,
    facets: [
      { key: 'dept', label: 'Département', get: (u) => u.department_code },
      { key: 'program', label: 'Programme', get: (u) => u.program_code },
      { key: 'level', label: 'Niveau', get: (u) => u.level_name || 'Non placé' },
      { key: 'semester', label: 'Semestre', get: (u) => (u.semester ? `S${u.semester}` : 'Non placé') },
    ],
    problems: [
      { key: 'credits', label: 'Crédits incohérents', test: (u) => Number(u.year_credits || 0) !== Number(u.total_credits) && u.year_courses > 0 },
      { key: 'unplaced', label: 'Non placées dans le parcours', test: (u) => !u.level || !u.semester },
      { key: 'empty', label: 'Sans cours', test: (u) => !u.year_courses },
    ],
    columns: [
      { label: 'UE', cell: (u) => <><span className="font-mono text-[12px] font-semibold">{u.code}</span> <span className="text-[var(--app-fg-soft)]">{u.name}</span></> },
      { label: 'Programme', cell: (u) => u.program_code },
      { label: 'Parcours', cell: (u) => [u.level_name, u.semester ? `S${u.semester}` : null].filter(Boolean).join(' · ') || '—' },
      { label: 'Crédits', align: 'right', cell: (u) => <span className={Number(u.year_credits || 0) !== Number(u.total_credits) ? 'font-semibold text-secondary-700 dark:text-secondary-300' : ''}>{u.year_credits ?? 0}/{u.total_credits}</span> },
      { label: 'Cours', align: 'right', cell: (u) => u.year_courses ?? 0 },
    ],
  },
  courses: {
    label: 'Cours',
    icon: BookOpen,
    search: (c) => `${c.code} ${c.name} ${c.teaching_unit_code} ${c.teacher_name ?? ''}`,
    facets: [
      { key: 'dept', label: 'Département', get: (c) => c.department_code },
      { key: 'program', label: 'Programme', get: (c) => c.program_code },
      { key: 'level', label: 'Niveau', get: (c) => c.level_name },
      { key: 'semester', label: 'Semestre', get: (c) => (c.semester ? `S${c.semester}` : '—') },
      { key: 'sheet', label: 'Fiche de notes', get: (c) => ({ draft: 'En saisie', review: 'En validation', published: 'Publiée', unlocked: 'Rouverte' })[c.grade_sheet_status] ?? c.grade_sheet_status },
    ],
    problems: [
      { key: 'no_teacher', label: 'Sans enseignant', test: (c) => !c.teacher },
    ],
    columns: [
      { label: 'Cours', cell: (c) => <><span className="font-mono text-[12px] font-semibold">{c.code}</span> <span className="text-[var(--app-fg-soft)]">{c.name}</span></> },
      { label: 'UE', cell: (c) => c.teaching_unit_code },
      { label: 'Programme', cell: (c) => c.program_code },
      { label: 'Parcours', cell: (c) => [c.level_name, c.semester ? `S${c.semester}` : null].filter(Boolean).join(' · ') },
      { label: 'Enseignant', cell: (c) => c.teacher_name || <span className="text-secondary-700 dark:text-secondary-300">à affecter</span> },
    ],
  },
  students: {
    label: 'Étudiants',
    icon: Users,
    server: true,
    columns: [
      { label: 'Matricule', cell: (s) => <span className="font-mono text-[12px] font-semibold">{s.matricule}</span> },
      { label: 'Nom', cell: (s) => `${s.last_name} ${s.first_name}` },
      { label: 'Programme', cell: (s) => s.program_code ?? '—' },
      { label: 'Niveau', cell: (s) => s.level_name ?? '—' },
    ],
  },
}

function useExplorerState() {
  const [params, setParams] = useSearchParams()
  const type = TYPES[params.get('type')] ? params.get('type') : 'programs'
  const q = params.get('q') ?? ''
  const selected = useMemo(() => {
    const out = {}
    for (const [k, v] of params.entries()) if (k.startsWith('f.')) out[k.slice(2)] = new Set(v.split('|').filter(Boolean))
    return out
  }, [params])
  const update = useCallback(
    (fn) => {
      const next = new URLSearchParams(params)
      fn(next)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )
  return {
    type,
    q,
    selected,
    params,
    setType: (t) => update((n) => { for (const k of [...n.keys()]) if (k.startsWith('f.')) n.delete(k); n.set('type', t) }),
    setQ: (v) => update((n) => (v ? n.set('q', v) : n.delete('q'))),
    toggle: (key, value) =>
      update((n) => {
        const set = new Set((n.get(`f.${key}`) ?? '').split('|').filter(Boolean))
        if (set.has(value)) set.delete(value)
        else set.add(value)
        if (set.size) n.set(`f.${key}`, [...set].join('|'))
        else n.delete(`f.${key}`)
      }),
    clear: () => update((n) => { for (const k of [...n.keys()]) if (k !== 'type') n.delete(k) }),
    apply: (search) => setParams(new URLSearchParams(search), { replace: true }),
  }
}

function FacetGroup({ facet, values, selected, onToggle }) {
  const [more, setMore] = useState(false)
  const shown = more ? values : values.slice(0, 6)
  return (
    <fieldset className="border-b border-[var(--app-border)] py-3 last:border-0">
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">{facet.label}</legend>
      <div className="space-y-1.5">
        {shown.map(([value, n]) => (
          <div key={value} className="flex items-center justify-between gap-2">
            <Checkbox checked={selected?.has(value) ?? false} onChange={() => onToggle(facet.key, value)} label={<span className="text-[12.5px]">{value}</span>} />
            <span className="text-[11px] tabular-nums text-[var(--app-muted)]">{n}</span>
          </div>
        ))}
      </div>
      {values.length > 6 ? (
        <button type="button" onClick={() => setMore((v) => !v)} className="mt-1.5 text-[11.5px] font-medium text-brand-700 hover:underline dark:text-brand-300">
          {more ? 'Moins' : `+ ${values.length - 6} autres`}
        </button>
      ) : null}
    </fieldset>
  )
}

function SavedViews({ current, onApply }) {
  const [views, setViews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(VIEWS_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  const persist = (next) => {
    setViews(next)
    try {
      localStorage.setItem(VIEWS_KEY, JSON.stringify(next))
    } catch {
      /* stockage indisponible : vues de la session seulement */
    }
  }
  const save = () => {
    const name = window.prompt('Nom de la vue')
    if (name?.trim()) persist([...views.filter((v) => v.name !== name.trim()), { name: name.trim(), search: current }])
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {views.map((v) => (
        <span key={v.name} className="group inline-flex items-center rounded-full bg-[var(--app-elevated)] text-[12px] ring-1 ring-[var(--app-border)]">
          <button type="button" onClick={() => onApply(v.search)} className="flex items-center gap-1 py-1 pl-2.5 pr-1 hover:text-brand-700">
            <Bookmark size={12} aria-hidden /> {v.name}
          </button>
          <button type="button" aria-label={`Supprimer la vue ${v.name}`} onClick={() => persist(views.filter((x) => x.name !== v.name))} className="pr-2 text-[var(--app-muted)] hover:text-red-600">
            <X size={12} aria-hidden />
          </button>
        </span>
      ))}
      <button type="button" onClick={save} className="rounded-full px-2.5 py-1 text-[12px] font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10">
        + Enregistrer la vue
      </button>
    </div>
  )
}

function StudentsResults({ q, onOpen }) {
  const ref = useReferential()
  const [program, setProgram] = useState('')
  const [data, setData] = useState(null)
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      fetchStudentsList({ q: q || undefined, program: program || undefined, page_size: 50, ordering: 'last_name' })
        .then((d) => !cancelled && setData(d))
        .catch(() => !cancelled && setData({ results: [], count: 0 }))
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, program])
  return (
    <SectionCard flush title={`${data?.count ?? '…'} étudiant${(data?.count ?? 0) > 1 ? 's' : ''}`} actions={
      <select value={program} onChange={(e) => setProgram(e.target.value)} className="h-8 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2 text-[12.5px]">
        <option value="">Tous les programmes</option>
        {ref.programs.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
      </select>
    }>
      <ResultsTable columns={TYPES.students.columns} rows={data?.results} onOpen={onOpen} />
      {data && data.count > 50 ? <p className="border-t border-[var(--app-border)] px-4 py-2 text-[11.5px] text-[var(--app-muted)]">50 premiers résultats : affinez la recherche.</p> : null}
    </SectionCard>
  )
}

function ResultsTable({ columns, rows, onOpen }) {
  if (!rows) return <div className="space-y-2 p-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9" />)}</div>
  if (!rows.length) return <EmptyState compact title="Aucun résultat" description="Retirez un filtre ou modifiez la recherche." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead className="text-left text-[11.5px] font-semibold text-[var(--app-muted)]">
          <tr className="border-b border-[var(--app-border)]">
            {columns.map((c) => <th key={c.label} className={cn('px-4 py-2 font-semibold', c.align === 'right' && 'text-right')}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r)} className="cursor-pointer border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-hover)]">
              {columns.map((c) => <td key={c.label} className={cn('px-4 py-2', c.align === 'right' && 'text-right tabular-nums')}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Explorateur : accès direct à tous les éléments de l'année, avec facettes et filtres « problèmes ». */
export default function ExplorerPage() {
  const ref = useReferential()
  const navigate = useNavigate()
  const st = useExplorerState()
  const [units, setUnits] = useState(null)
  const [courses, setCourses] = useState(null)
  const def = TYPES[st.type]

  useEffect(() => {
    if (st.type === 'units' && !units) fetchTeachingUnits({ offer_year: ref.yearId }).then(setUnits).catch(() => setUnits([]))
    if (st.type === 'courses' && !courses) {
      fetchCoursesList({ academic_year_id: ref.yearId, page_size: 1000 }).then((r) => setCourses(r.results)).catch(() => setCourses([]))
    }
  }, [st.type, units, courses, ref.yearId])

  const source = st.type === 'programs' ? ref.programs : st.type === 'units' ? units : st.type === 'courses' ? courses : null
  const hasProblems = Boolean(def.problems?.length)

  const matches = useCallback(
    (row, skip) => {
      if (st.q && !normalize(def.search(row)).includes(normalize(st.q))) return false
      for (const f of def.facets ?? []) {
        if (f.key === skip) continue
        const sel = st.selected[f.key]
        if (sel?.size && !sel.has(String(f.get(row) ?? '—'))) return false
      }
      if (skip !== 'problem' && st.selected.problem?.size) {
        for (const p of def.problems ?? []) if (st.selected.problem.has(p.label) && !p.test(row)) return false
      }
      return true
    },
    [def, st.q, st.selected],
  )

  const rows = useMemo(() => (source ? source.filter((r) => matches(r)) : null), [source, matches])
  const facetValues = useMemo(() => {
    if (!source) return {}
    const out = {}
    for (const f of def.facets ?? []) {
      const counts = new Map()
      for (const r of source) if (matches(r, f.key)) counts.set(String(f.get(r) ?? '—'), (counts.get(String(f.get(r) ?? '—')) ?? 0) + 1)
      out[f.key] = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr', { numeric: true }))
    }
    if (hasProblems) out.problem = def.problems.map((p) => [p.label, source.filter((r) => matches(r, 'problem') && p.test(r)).length])
    return out
  }, [source, def, matches, hasProblems])

  const open = (row) => {
    if (st.type === 'programs') navigate(refPaths.program(row))
    else if (st.type === 'units') {
      const p = ref.programById.get(row.program)
      if (p) navigate(refPaths.program(p, 'maquette'))
    } else if (st.type === 'courses') navigate(`/teacher/courses/${row.id}`)
    else navigate(`/teacher/students/${row.id}`)
  }

  const chips = Object.entries(st.selected).flatMap(([k, set]) => [...set].map((v) => ({ k, v })))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(TYPES).map(([id, t]) => (
          <button
            key={id}
            type="button"
            onClick={() => st.setType(id)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors',
              st.type === id ? 'bg-brand-600 text-white dark:bg-brand-500' : 'bg-[var(--app-elevated)] ring-1 ring-[var(--app-border)] hover:ring-brand-400',
            )}
          >
            <t.icon size={15} aria-hidden /> {t.label}
            {id === 'programs' ? <span className="text-[11px] opacity-75">{ref.programs.length}</span> : null}
          </button>
        ))}
        <div className="ml-auto flex min-w-[16rem] flex-1 items-center gap-2 rounded-xl bg-[var(--app-elevated)] px-3 ring-1 ring-[var(--app-border)] focus-within:ring-2 focus-within:ring-[var(--ring-focus)] sm:max-w-md">
          <Search size={15} className="text-[var(--app-muted)]" aria-hidden />
          <input value={st.q} onChange={(e) => st.setQ(e.target.value)} placeholder={`Rechercher dans ${def.label.toLowerCase()}…`} className="h-10 w-full bg-transparent text-[13px] outline-none" />
        </div>
      </div>

      {def.problems?.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Sparkles size={14} className="text-secondary-600" aria-hidden />
          {def.problems.map((p) => {
            const on = st.selected.problem?.has(p.label)
            const n = facetValues.problem?.find(([label]) => label === p.label)?.[1]
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => st.toggle('problem', p.label)}
                className={cn(
                  'rounded-full px-3 py-1 text-[12px] font-medium ring-1 ring-inset transition-colors',
                  on ? 'bg-secondary-600 text-white ring-secondary-600' : 'bg-secondary-50 text-secondary-900 ring-secondary-600/20 hover:ring-secondary-500 dark:bg-secondary-500/10 dark:text-secondary-100',
                )}
              >
                {p.label}{n != null ? <span className="ml-1 tabular-nums opacity-75">{n}</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}

      {chips.length || st.q ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {st.q ? <span className="rounded-full bg-[var(--app-subtle)] px-2.5 py-1 text-[12px]">« {st.q} »</span> : null}
          {chips.map(({ k, v }) => (
            <button key={`${k}${v}`} type="button" onClick={() => st.toggle(k, v)} className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] text-brand-800 ring-1 ring-inset ring-brand-600/15 hover:ring-brand-500 dark:bg-brand-500/10 dark:text-brand-100">
              {v} <X size={12} aria-hidden />
            </button>
          ))}
          <button type="button" onClick={st.clear} className="text-[12px] font-medium text-[var(--app-muted)] hover:text-[var(--app-fg)]">Tout effacer</button>
        </div>
      ) : null}

      <SavedViews current={st.params.toString()} onApply={st.apply} />

      {def.server ? (
        <StudentsResults q={st.q} onOpen={open} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 lg:sticky lg:top-20">
            {(def.facets ?? []).map((f) =>
              facetValues[f.key]?.length ? <FacetGroup key={f.key} facet={f} values={facetValues[f.key]} selected={st.selected[f.key]} onToggle={st.toggle} /> : null,
            )}
            {!source ? <div className="space-y-2 py-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-5" />)}</div> : null}
          </aside>
          <SectionCard flush title={rows ? `${rows.length} ${def.label.toLowerCase()}` : def.label} description={ref.yearLabel}>
            <ResultsTable columns={def.columns} rows={rows} onOpen={open} />
          </SectionCard>
        </div>
      )}
    </div>
  )
}
