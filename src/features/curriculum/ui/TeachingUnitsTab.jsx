import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronsDownUp, ChevronsUpDown, Minus, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'

import { SHEET_STATUS } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { deleteTeachingUnit, fetchCoursesList, fetchModules, fetchTeachingUnits } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { TeachingUnitCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitCreateModal'
import { TeachingUnitDetailModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitDetailModal'
import { Meter } from '@/features/dashboard/ui/DashboardCharts'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Avatar } from '@/shared/ui/Avatar'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const OFFER_STATE = {
  complete: { label: 'Complète', tone: 'success' },
  partial: { label: 'Partielle', tone: 'warning' },
  none: { label: 'Non offerte', tone: 'neutral' },
}

function offerState(u) {
  if (!u.year_courses) return 'none'
  return Number(u.year_credits) >= Number(u.total_credits || 0) ? 'complete' : 'partial'
}

const normalize = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Catalogue des UE du programme et leur offre sur l'année (cours répartis, crédits). */
export function TeachingUnitsTab({ academicYearId, academicYearLabel, programId, canEdit, onChanged }) {
  const [units, setUnits] = useState(null)
  const [modules, setModules] = useState([])
  const [query, setQuery] = useState('')
  const [state, setState] = useState('')
  const [dialog, setDialog] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [coursesByUnit, setCoursesByUnit] = useState(new Map())
  const [open, setOpen] = useState(() => new Set())

  const load = useCallback(async () => {
    const params = { ...(programId ? { program: programId } : {}), ...(academicYearId ? { offer_year: academicYearId } : {}) }
    const [list, courses] = await Promise.all([
      fetchTeachingUnits(params),
      academicYearId
        ? fetchCoursesList({ academic_year_id: academicYearId, page: 1, page_size: 1000, ordering: 'code', ...(programId ? { program_id: programId } : {}) }, { skipErrorToast: true }).catch(() => ({ results: [] }))
        : Promise.resolve({ results: [] }),
    ])
    const grouped = new Map()
    for (const c of courses.results ?? []) {
      if (!grouped.has(c.teaching_unit)) grouped.set(c.teaching_unit, [])
      grouped.get(c.teaching_unit).push(c)
    }
    setCoursesByUnit(grouped)
    setUnits(list)
  }, [programId, academicYearId])

  useEffect(() => {
    load().catch(() => setUnits([]))
  }, [load])

  useEffect(() => {
    if (!academicYearId) return
    fetchModules(academicYearId)
      .then(setModules)
      .catch(() => setModules([]))
  }, [academicYearId])

  const counts = useMemo(() => {
    const c = { '': units?.length ?? 0, none: 0, partial: 0, complete: 0 }
    for (const u of units ?? []) c[offerState(u)] += 1
    return c
  }, [units])

  const rows = useMemo(() => {
    const q = normalize(query.trim())
    return (units ?? []).filter((u) => (!state || offerState(u) === state) && (!q || normalize(`${u.code} ${u.name} ${u.program_code}`).includes(q)))
  }, [units, query, state])

  const refresh = async () => {
    await load()
    onChanged?.()
  }

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const allOpen = rows.length > 0 && rows.every((u) => open.has(u.id))
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="État de l’offre">
          {[
            ['', 'Toutes'],
            ['none', 'Non offertes'],
            ['partial', 'Partielles'],
            ['complete', 'Complètes'],
          ].map(([id, label]) => (
            <button
              key={id || 'all'}
              type="button"
              role="tab"
              aria-selected={state === id}
              onClick={() => setState(id)}
              className={cn(
                'rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors',
                state === id ? 'bg-[var(--app-fg)] text-[var(--app-canvas)]' : 'text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]',
              )}
            >
              {label}
              <span className="ml-1.5 tabular-nums opacity-70">{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Code ou intitulé" className="w-full sm:w-60" />
          {canEdit ? (
            <Button size="sm" onClick={() => setDialog({ kind: 'create' })}>
              <Plus size={14} aria-hidden /> Nouvelle UE
            </Button>
          ) : null}
        </div>
      </div>

      {units == null ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4">
          <SkeletonLines lines={8} />
        </div>
      ) : !rows.length ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
          <EmptyState
            title={units.length ? 'Aucune UE ne correspond' : 'Aucune UE'}
            description={units.length ? 'Modifiez la recherche ou le filtre.' : 'Créez les UE du programme, puis répartissez leurs crédits en cours.'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
            <span>Unité d’enseignement · cours de l’année</span>
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(rows.map((u) => u.id)))}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 normal-case tracking-normal hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]"
            >
              {allOpen ? <ChevronsDownUp size={13} aria-hidden /> : <ChevronsUpDown size={13} aria-hidden />}
              {allOpen ? 'Tout replier' : 'Tout déplier'}
            </button>
          </div>
          <ul>
            {[...rows]
              .sort((a, b) => String(a.code).localeCompare(String(b.code)))
              .map((u) => (
                <UnitItem
                  key={u.id}
                  unit={u}
                  courses={coursesByUnit.get(u.id) ?? []}
                  open={open.has(u.id)}
                  onToggle={() => toggle(u.id)}
                  canEdit={canEdit}
                  onManage={() => setDialog({ kind: 'detail', unit: u })}
                  onEdit={() => setDialog({ kind: 'edit', unit: u })}
                  onDelete={() =>
                    setConfirm({
                      unit: u,
                      title: `Supprimer l’UE ${u.code} ?`,
                      message: 'Suppression en cascade : tous les cours de cette UE, toutes années, sont aussi supprimés.',
                    })
                  }
                  academicYearLabel={academicYearLabel}
                />
              ))}
          </ul>
        </div>
      )}
      <p className="text-[12px] text-[var(--app-muted)]">Dépliez une UE (+) pour voir ses cours ; « Gérer l’offre » répartit ses crédits en cours sur les modules de l’année.</p>

      <TeachingUnitCreateModal open={dialog?.kind === 'create'} onClose={() => setDialog(null)} onCreated={refresh} />
      <TeachingUnitCreateModal open={dialog?.kind === 'edit'} onClose={() => setDialog(null)} mode="edit" unit={dialog?.kind === 'edit' ? dialog.unit : null} onCreated={refresh} />
      <TeachingUnitDetailModal
        open={dialog?.kind === 'detail'}
        onClose={() => setDialog(null)}
        unit={dialog?.kind === 'detail' ? dialog.unit : null}
        tier={dialog?.unit?.year_courses ? 'offered' : 'catalog'}
        academicYearId={academicYearId ? Number(academicYearId) : null}
        canStructure={canEdit}
        modules={modules}
        unitsForOfferSelect={units ?? []}
        onOfferSaved={refresh}
      />
      <ConfirmModal
        open={confirm != null}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        message={confirm?.message}
        confirmLabel="Supprimer"
        onConfirm={async () => {
          try {
            await deleteTeachingUnit(confirm.unit.id)
            dispatchToast({ type: 'success', message: 'UE supprimée.' })
            await refresh()
          } catch (err) {
            dispatchToast({ type: 'error', message: err?.message ?? 'Suppression impossible.' })
            throw err
          }
        }}
      />
    </div>
  )
}

const SHEET_DOT = { draft: 'bg-zinc-400', review: 'bg-brand-500', published: 'bg-green-500', unlocked: 'bg-secondary-500' }

/** Une UE : ligne de synthèse dépliable, puis ses cours de l'année indentés. */
function UnitItem({ unit: u, courses, open, onToggle, canEdit, onManage, onEdit, onDelete, academicYearLabel }) {
  const st = OFFER_STATE[offerState(u)]
  const Toggle = open ? Minus : Plus
  return (
    <li className="border-b border-[var(--app-border)] last:border-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 hover:bg-[var(--app-hover)]">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? `Replier ${u.code}` : `Déplier ${u.code}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--app-border-strong)] text-[var(--app-fg-soft)] hover:bg-[var(--app-elevated)]"
        >
          <Toggle size={13} aria-hidden />
        </button>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <span className="rounded-md bg-[var(--app-subtle)] px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-[var(--app-fg-soft)] ring-1 ring-inset ring-[var(--app-border)]">{u.code}</span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-[var(--app-fg)]">{u.name}</span>
            <span className="text-[11.5px] text-[var(--app-muted)]">
              {u.program_code} · {u.total_credits} crédits · {courses.length} cours {academicYearLabel ? `en ${academicYearLabel}` : ''}
            </span>
          </span>
        </button>
        <Meter value={Number(u.year_credits) || 0} max={Number(u.total_credits) || 1} label={`${u.year_credits ?? 0} / ${u.total_credits} cr.`} className="text-[12px]" />
        <StatusPill tone={st.tone}>{st.label}</StatusPill>
        <span className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onManage}>
            <Settings2 size={14} aria-hidden /> Gérer l’offre
          </Button>
          {canEdit ? (
            <>
              <Button size="sm" variant="ghost" aria-label={`Modifier ${u.code}`} onClick={onEdit}>
                <Pencil size={14} aria-hidden />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-700 dark:text-red-300" aria-label={`Supprimer ${u.code}`} onClick={onDelete}>
                <Trash2 size={14} aria-hidden />
              </Button>
            </>
          ) : null}
        </span>
      </div>
      {open ? (
        courses.length ? (
          <ul className="mb-2 ml-[27px] border-l border-[var(--app-border)]">
            {courses.map((c) => {
              const sheet = SHEET_STATUS[c.grade_sheet_status]
              return (
                <li key={c.id} className="relative">
                  <span className="absolute left-0 top-1/2 h-px w-4 bg-[var(--app-border)]" aria-hidden />
                  <Link
                    to={`/teacher/courses/${c.id}`}
                    className="ml-4 mr-4 grid items-center gap-x-4 gap-y-1 rounded-lg px-3 py-2 hover:bg-[var(--app-hover)] sm:grid-cols-[minmax(0,1fr)_9rem_4rem_minmax(0,12rem)_8.5rem]"
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
        ) : (
          <p className="mb-3 ml-[43px] text-[12.5px] text-[var(--app-muted)]">
            Aucun cours offert cette année.{' '}
            <button type="button" onClick={onManage} className="font-medium text-brand-700 hover:underline dark:text-brand-200">
              Offrir ses cours
            </button>
          </p>
        )
      ) : null}
    </li>
  )
}
