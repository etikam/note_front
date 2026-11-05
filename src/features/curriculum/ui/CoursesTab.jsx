import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Layers } from 'lucide-react'

import { SHEET_STATUS } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchCoursesList, fetchModules } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Checkbox } from '@/shared/ui/Checkbox'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

const SHEET_DOT = { draft: 'bg-zinc-400', review: 'bg-brand-500', published: 'bg-green-500', unlocked: 'bg-secondary-500' }

function normalize(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Programme → UE → cours, chaque UE dépliable. */
function buildTree(courses) {
  const programs = new Map()
  for (const c of courses) {
    const pKey = c.program ?? 'x'
    if (!programs.has(pKey)) programs.set(pKey, { id: pKey, code: c.program_code, name: c.program_name, department: c.department_name, units: new Map() })
    const units = programs.get(pKey).units
    const uKey = c.teaching_unit ?? 'x'
    if (!units.has(uKey)) units.set(uKey, { id: uKey, code: c.teaching_unit_code, name: c.teaching_unit_name, courses: [] })
    units.get(uKey).courses.push(c)
  }
  const sortKey = (u) => {
    const first = u.courses[0]
    return `${String(first.level_name ?? '').padEnd(20)}${first.semester ?? 9}${u.code}`
  }
  return [...programs.values()].map((p) => ({
    ...p,
    units: [...p.units.values()]
      .map((u) => ({ ...u, courses: [...u.courses].sort((a, b) => String(a.code).localeCompare(String(b.code))) }))
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b))),
  }))
}

function UnitRow({ unit: u, open, onToggle }) {
  const credits = u.courses.reduce((n, c) => n + (Number(c.credits) || 0), 0)
  const assigned = u.courses.filter((c) => c.teacher_name).length
  const published = u.courses.filter((c) => c.grade_sheet_status === 'published').length
  const levels = [...new Set(u.courses.map((c) => [c.level_name, c.semester ? `S${c.semester}` : null].filter(Boolean).join(' · ')))].filter(Boolean)
  return (
    <li className="border-b border-[var(--app-border)] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-[var(--app-hover)]"
      >
        <ChevronRight size={16} className={cn('shrink-0 text-[var(--app-muted)] transition-transform', open && 'rotate-90')} aria-hidden />
        <span className="rounded-md bg-[var(--app-subtle)] px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-[var(--app-fg-soft)] ring-1 ring-inset ring-[var(--app-border)]">{u.code}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-[var(--app-fg)]">{u.name}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">
            {levels.join(', ') || 'Niveau non précisé'}
          </span>
        </span>
        <span className="flex items-center gap-4 text-[12px] tabular-nums text-[var(--app-fg-soft)]">
          <span title="Cours de l’UE">
            <span className="font-semibold text-[var(--app-fg)]">{u.courses.length}</span> cours
          </span>
          <span title="Crédits">
            <span className="font-semibold text-[var(--app-fg)]">{credits}</span> cr.
          </span>
          <span title="Cours avec enseignant" className={assigned < u.courses.length ? 'text-secondary-700 dark:text-secondary-300' : ''}>
            {assigned}/{u.courses.length} affectés
          </span>
          <span title="Fiches de notes publiées" className="hidden sm:inline">
            {published}/{u.courses.length} publiées
          </span>
        </span>
      </button>
      {open ? (
        <ul className="ml-[26px] border-l border-[var(--app-border)] pb-2">
          {u.courses.map((c) => {
            const sheet = SHEET_STATUS[c.grade_sheet_status]
            return (
              <li key={c.id} className="relative">
                <span className="absolute left-0 top-1/2 h-px w-4 bg-[var(--app-border)]" aria-hidden />
                <Link
                  to={`/teacher/courses/${c.id}`}
                  className="ml-4 mr-3 grid items-center gap-x-4 gap-y-1 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--app-hover)] sm:grid-cols-[minmax(0,1fr)_9rem_4rem_minmax(0,12rem)_8.5rem]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-[var(--app-fg)]">{c.name}</span>
                    <span className="font-mono text-[11px] text-[var(--app-muted)]">{c.code}</span>
                  </span>
                  <span className="text-[12px] text-[var(--app-fg-soft)]">
                    {c.level_name ?? '—'}
                    <span className="block text-[11px] text-[var(--app-muted)]">
                      {c.module_label ?? '—'}
                      {c.semester ? ` · S${c.semester}` : ''}
                    </span>
                  </span>
                  <span className="text-[12px] tabular-nums text-[var(--app-fg-soft)] sm:text-right">{c.credits ?? '—'} cr.</span>
                  <span className="min-w-0">
                    {c.teacher_name ? (
                      <span className="flex items-center gap-2 text-[12.5px]">
                        <Avatar name={c.teacher_name} size="xs" />
                        <span className="truncate">{c.teacher_name}</span>
                      </span>
                    ) : (
                      <StatusPill tone="warning">Sans enseignant</StatusPill>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--app-fg-soft)] sm:justify-end">
                    <span className={cn('h-1.5 w-1.5 rounded-full', SHEET_DOT[c.grade_sheet_status] ?? 'bg-zinc-400')} aria-hidden />
                    {sheet?.label ?? '—'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}

/** Cours de l'année, imbriqués : programme → UE (dépliable) → cours. */
export function CoursesTab({ academicYearId, programId }) {
  const [search, setSearch] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [unassigned, setUnassigned] = useState(false)
  const [modules, setModules] = useState([])
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(() => new Set())

  useEffect(() => {
    if (!academicYearId) return
    fetchModules(academicYearId).then(setModules).catch(() => setModules([]))
  }, [academicYearId])

  useEffect(() => {
    if (!academicYearId) return undefined
    let cancelled = false
    setCourses(null)
    setError('')
    fetchCoursesList(
      { academic_year_id: academicYearId, page: 1, page_size: 500, ordering: 'code', ...(programId ? { program_id: programId } : {}), ...(moduleId ? { module_id: moduleId } : {}) },
      { skipErrorToast: true },
    )
      .then((d) => !cancelled && setCourses(d.results ?? []))
      .catch((err) => !cancelled && setError(err?.message || 'Chargement impossible.'))
    return () => {
      cancelled = true
    }
  }, [academicYearId, programId, moduleId])

  const needle = normalize(search.trim())
  const filtered = useMemo(
    () =>
      (courses ?? []).filter(
        (c) =>
          (!unassigned || !c.teacher_name) &&
          (!needle || normalize(`${c.code} ${c.name} ${c.teaching_unit_code} ${c.teaching_unit_name} ${c.teacher_name ?? ''}`).includes(needle)),
      ),
    [courses, needle, unassigned],
  )
  const tree = useMemo(() => buildTree(filtered), [filtered])
  const allUnitKeys = useMemo(() => tree.flatMap((p) => p.units.map((u) => `${p.id}:${u.id}`)), [tree])
  // Une recherche ou un filtre ouvre toutes les UE trouvées.
  const forceOpen = Boolean(needle || unassigned)
  const allOpen = allUnitKeys.length > 0 && allUnitKeys.every((k) => open.has(k))

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const total = courses?.length ?? 0
  const withoutTeacher = (courses ?? []).filter((c) => !c.teacher_name).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Cours, UE ou enseignant" className="w-full sm:w-64" />
        <select className={SELECT} value={moduleId} onChange={(e) => setModuleId(e.target.value)} aria-label="Module">
          <option value="">Tous les modules</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              Module {m.number}
            </option>
          ))}
        </select>
        <span className="px-1">
          <Checkbox checked={unassigned} onChange={setUnassigned} label={<span className="text-[12.5px]">Sans enseignant{withoutTeacher ? ` (${withoutTeacher})` : ''}</span>} />
        </span>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-[12px] tabular-nums text-[var(--app-muted)]">
            {filtered.length} cours · {allUnitKeys.length} UE
          </span>
          {!forceOpen && allUnitKeys.length ? (
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(allUnitKeys))}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-[12.5px] font-medium text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)]"
            >
              {allOpen ? <ChevronsDownUp size={14} aria-hidden /> : <ChevronsUpDown size={14} aria-hidden />}
              {allOpen ? 'Tout replier' : 'Tout déplier'}
            </button>
          ) : null}
        </span>
      </div>

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} />
        </SectionCard>
      ) : !courses ? (
        <SectionCard>
          <SkeletonLines lines={8} />
        </SectionCard>
      ) : !tree.length ? (
        <SectionCard>
          <EmptyState
            title={total ? 'Aucun cours ne correspond' : 'Aucun cours'}
            description={total ? 'Modifiez la recherche ou les filtres.' : 'Les cours s’ajoutent depuis l’onglet UE : ouvrez une UE pour offrir ses cours sur un module.'}
          />
        </SectionCard>
      ) : (
        tree.map((p) => (
          <SectionCard
            key={p.id}
            flush
            title={
              <span className="inline-flex items-center gap-2">
                <Layers size={15} className="text-[var(--app-muted)]" aria-hidden />
                {p.name}
                <span className="rounded bg-[var(--app-subtle)] px-1.5 py-0.5 font-mono text-[10.5px] font-normal text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)]">{p.code}</span>
              </span>
            }
            description={p.department}
          >
            <ul>
              {p.units.map((u) => {
                const key = `${p.id}:${u.id}`
                return <UnitRow key={key} unit={u} open={forceOpen || open.has(key)} onToggle={() => toggle(key)} />
              })}
            </ul>
          </SectionCard>
        ))
      )}
    </div>
  )
}
