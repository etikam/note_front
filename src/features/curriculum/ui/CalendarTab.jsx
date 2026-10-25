import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Plus, Trash2 } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import {
  deleteAcademicYear,
  deleteModule,
  fetchAcademicYearsFull,
  fetchModules,
  patchAcademicYear,
} from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { AcademicYearCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/AcademicYearCreateModal'
import { SemesterBlockPanel } from '@/features/teacherFacultyDashboard/pedagogy/ui/SemesterBlockPanel'
import { SemesterCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/SemesterCreateModal'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const fmt = (v) => {
  const d = new Date(`${v}T00:00:00`)
  return Number.isNaN(d.getTime()) ? v : dateFmt.format(d)
}

/** Frise des modules d'une année : position et longueur proportionnelles aux dates. */
function ModulesTimeline({ year, modules }) {
  const start = new Date(`${year.start_date}T00:00:00`).getTime()
  const end = new Date(`${year.end_date}T00:00:00`).getTime()
  const span = Math.max(1, end - start)
  return (
    <div className="mt-2">
      <div className="relative h-9 rounded-lg bg-[var(--app-subtle)]">
        {modules.map((m) => {
          const left = Math.max(0, ((new Date(`${m.start_date}T00:00:00`).getTime() - start) / span) * 100)
          const width = Math.max(4, ((new Date(`${m.end_date}T00:00:00`).getTime() - new Date(`${m.start_date}T00:00:00`).getTime()) / span) * 100)
          return (
            <span
              key={m.id}
              className="absolute top-1 flex h-7 items-center justify-center rounded-md bg-brand-500 text-[11.5px] font-semibold text-white dark:bg-brand-400 dark:text-brand-950"
              style={{ left: `${left}%`, width: `calc(${Math.min(width, 100 - left)}% - 2px)` }}
              title={`M${m.number} : ${fmt(m.start_date)} → ${fmt(m.end_date)}`}
            >
              M{m.number}
            </span>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--app-muted)]">
        <span>{fmt(year.start_date)}</span>
        <span>{fmt(year.end_date)}</span>
      </div>
    </div>
  )
}

/** Années académiques, modules calendaires (M1, M2…) et semestres actifs du parcours. */
export function CalendarTab({ canEdit }) {
  const { academicYearId, refreshAcademicYears } = useAcademicYear()
  const [years, setYears] = useState(null)
  const [focusId, setFocusId] = useState(null)
  const [modules, setModules] = useState([])
  const [dialog, setDialog] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const loadYears = useCallback(async () => {
    const rows = await fetchAcademicYearsFull()
    setYears(rows)
    setFocusId((id) => id ?? (academicYearId ? Number(academicYearId) : rows.find((y) => y.is_current)?.id ?? rows[0]?.id ?? null))
  }, [academicYearId])

  useEffect(() => {
    loadYears().catch(() => setYears([]))
  }, [loadYears])

  const loadModules = useCallback(async () => {
    if (!focusId) return setModules([])
    setModules(await fetchModules(focusId))
  }, [focusId])

  useEffect(() => {
    loadModules().catch(() => setModules([]))
  }, [loadModules])

  const focus = useMemo(() => years?.find((y) => y.id === focusId) ?? null, [years, focusId])

  async function makeCurrent(y) {
    try {
      await patchAcademicYear(y.id, { is_current: true })
      dispatchToast({ type: 'success', message: `${y.year} est l’année courante.` })
      await loadYears()
      await refreshAcademicYears?.()
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message ?? 'Modification impossible.' })
    }
  }

  if (!years) {
    return (
      <SectionCard>
        <SkeletonLines lines={6} />
      </SectionCard>
    )
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <SectionCard
        title="Années académiques"
        flush
        actions={
          canEdit ? (
            <Button size="sm" variant="ghost" onClick={() => setDialog('year')}>
              <Plus size={14} aria-hidden /> Année
            </Button>
          ) : null
        }
      >
        {!years.length ? (
          <EmptyState compact icon={CalendarDays} title="Aucune année" description="Créez l’année en cours pour commencer." />
        ) : (
          <ul className="divide-y divide-[var(--app-border)]">
            {years.map((y) => (
              <li key={y.id}>
                <button
                  type="button"
                  onClick={() => setFocusId(y.id)}
                  aria-current={focusId === y.id ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors',
                    focusId === y.id ? 'bg-brand-50/70 dark:bg-white/[0.05]' : 'hover:bg-[var(--app-hover)]',
                  )}
                >
                  <span>
                    <span className="block text-[13.5px] font-semibold text-[var(--app-fg)]">{y.year}</span>
                    <span className="block text-[11.5px] text-[var(--app-muted)]">
                      {fmt(y.start_date)} → {fmt(y.end_date)}
                    </span>
                  </span>
                  {y.is_current ? <StatusPill tone="success">Courante</StatusPill> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {focus ? (
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            title={`Année ${focus.year}`}
            description="Les modules sont les périodes calendaires où se déroulent les cours (distinctes des semestres S1–S6 du parcours)."
            actions={
              canEdit ? (
                <div className="flex flex-wrap gap-2">
                  {!focus.is_current ? (
                    <Button size="sm" variant="ghost" onClick={() => makeCurrent(focus)}>
                      <CheckCircle2 size={14} aria-hidden /> Rendre courante
                    </Button>
                  ) : null}
                  <Button size="sm" onClick={() => setDialog('module')}>
                    <Plus size={14} aria-hidden /> Module
                  </Button>
                </div>
              ) : null
            }
          >
            {modules.length ? (
              <>
                <ModulesTimeline year={focus} modules={modules} />
                <ul className="mt-4 divide-y divide-[var(--app-border)] rounded-xl border border-[var(--app-border)]">
                  {modules.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                      <span>
                        <span className="font-semibold text-[var(--app-fg)]">Module {m.number}</span>
                        <span className="text-[var(--app-muted)]">
                          {' '}
                          · {fmt(m.start_date)} → {fmt(m.end_date)}
                        </span>
                      </span>
                      {canEdit ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700 dark:text-red-300"
                          aria-label={`Supprimer le module ${m.number}`}
                          onClick={() =>
                            setConfirm({
                              title: `Supprimer le module ${m.number} ?`,
                              message: 'Impossible tant que des cours y sont rattachés.',
                              action: async () => {
                                await deleteModule(m.id)
                                dispatchToast({ type: 'success', message: 'Module supprimé.' })
                                await loadModules()
                              },
                            })
                          }
                        >
                          <Trash2 size={14} aria-hidden />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState compact title="Aucun module" description="Ajoutez les modules M1 et M2 de l’année pour pouvoir y offrir des cours." />
            )}
            {canEdit && !focus.is_current ? (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700 dark:text-red-300"
                  onClick={() =>
                    setConfirm({
                      title: `Supprimer l’année ${focus.year} ?`,
                      message: 'Définitif, et impossible si des cours ou des cohortes y sont rattachés.',
                      action: async () => {
                        await deleteAcademicYear(focus.id)
                        dispatchToast({ type: 'success', message: 'Année supprimée.' })
                        setFocusId(null)
                        await loadYears()
                        await refreshAcademicYears?.()
                      },
                    })
                  }
                >
                  <Trash2 size={14} aria-hidden /> Supprimer l’année
                </Button>
              </div>
            ) : null}
          </SectionCard>

          <SemesterBlockPanel
            academicYearId={focus.id}
            academicYearLabel={focus.year}
            activeSemesterParity={focus.active_semester_parity ?? null}
            canCalendar={canEdit}
            onUpdated={loadYears}
          />
        </div>
      ) : null}

      <AcademicYearCreateModal
        open={dialog === 'year'}
        onClose={() => setDialog(null)}
        onCreated={async () => {
          await loadYears()
          await refreshAcademicYears?.()
        }}
      />
      <SemesterCreateModal open={dialog === 'module'} onClose={() => setDialog(null)} academicYearId={focusId} yearLabel={focus?.year} onCreated={loadModules} />
      <ConfirmModal
        open={confirm != null}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        message={confirm?.message}
        confirmLabel="Supprimer"
        onConfirm={async () => {
          try {
            await confirm.action()
          } catch (err) {
            dispatchToast({ type: 'error', message: err?.message ?? 'Suppression impossible.' })
            throw err
          }
        }}
      />
    </div>
  )
}
