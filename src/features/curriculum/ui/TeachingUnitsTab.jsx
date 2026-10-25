import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { deleteTeachingUnit, fetchModules, fetchTeachingUnits } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { TeachingUnitCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitCreateModal'
import { TeachingUnitDetailModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitDetailModal'
import { Meter } from '@/features/dashboard/ui/DashboardCharts'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { DataTable } from '@/shared/ui/DataTable'
import { SearchInput } from '@/shared/ui/SearchInput'
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

  const load = useCallback(async () => {
    const params = { ...(programId ? { program: programId } : {}), ...(academicYearId ? { offer_year: academicYearId } : {}) }
    setUnits(await fetchTeachingUnits(params))
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

  const columns = [
    {
      key: 'ue',
      header: 'Unité d’enseignement',
      sortValue: (u) => u.code,
      cell: (u) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--app-fg)]">{u.name}</span>
          <span className="font-mono text-[11.5px] text-[var(--app-muted)]">{u.code}</span>
        </span>
      ),
    },
    { key: 'program', header: 'Programme', sortValue: (u) => u.program_code, cell: (u) => u.program_code },
    { key: 'credits', header: 'Crédits', align: 'right', sortValue: (u) => Number(u.total_credits) || 0, cell: (u) => <span className="tabular-nums">{u.total_credits}</span> },
    {
      key: 'offer',
      header: academicYearLabel ? `Offre ${academicYearLabel}` : 'Offre de l’année',
      sortValue: (u) => (u.total_credits ? Number(u.year_credits) / Number(u.total_credits) : 0),
      cell: (u) => (
        <span className="flex flex-col gap-0.5">
          <Meter value={Number(u.year_credits) || 0} max={Number(u.total_credits) || 1} label={`${u.year_credits ?? 0} / ${u.total_credits} cr.`} />
          <span className="text-[11.5px] text-[var(--app-muted)]">{u.year_courses ?? 0} cours</span>
        </span>
      ),
    },
    {
      key: 'state',
      header: 'État',
      sortValue: (u) => offerState(u),
      cell: (u) => {
        const s = OFFER_STATE[offerState(u)]
        return <StatusPill tone={s.tone}>{s.label}</StatusPill>
      },
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right',
            cell: (u) => (
              <span className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" aria-label={`Modifier ${u.code}`} onClick={() => setDialog({ kind: 'edit', unit: u })}>
                  <Pencil size={14} aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700 dark:text-red-300"
                  aria-label={`Supprimer ${u.code}`}
                  onClick={() =>
                    setConfirm({
                      unit: u,
                      title: `Supprimer l’UE ${u.code} ?`,
                      message: 'Suppression en cascade : tous les cours de cette UE, toutes années, sont aussi supprimés.',
                    })
                  }
                >
                  <Trash2 size={14} aria-hidden />
                </Button>
              </span>
            ),
          },
        ]
      : []),
  ]

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

      <DataTable
        columns={columns}
        rows={rows}
        loading={units == null}
        onRowClick={(u) => setDialog({ kind: 'detail', unit: u })}
        initialSort={{ key: 'ue', dir: 'asc' }}
        empty={{
          title: units?.length ? 'Aucune UE ne correspond' : 'Aucune UE',
          description: units?.length ? 'Modifiez la recherche ou le filtre.' : 'Créez les UE du programme, puis répartissez leurs crédits en cours.',
        }}
      />
      <p className="text-[12px] text-[var(--app-muted)]">Cliquez sur une UE pour offrir ses cours sur un module de l’année et répartir ses crédits.</p>

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
