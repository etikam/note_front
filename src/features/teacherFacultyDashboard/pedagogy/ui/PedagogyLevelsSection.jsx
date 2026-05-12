import { useCallback, useEffect, useId, useState } from 'react'

import { Pencil, Plus, Trash2 } from 'lucide-react'

import {
  deleteLevelManage,
  fetchLevelsManage,
  patchLevelManage,
  postLevelManage,
} from '@/features/academicYear/api/academicsApi'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

const CYCLE_OPTIONS = [
  { value: 'LICENCE', label: 'Licence' },
  { value: 'MASTER', label: 'Master' },
  { value: 'DOCTORAT', label: 'Doctorat' },
]

const inputClass = cn(
  'w-full rounded-xl border px-3 py-2 text-sm',
  'border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_96%,transparent)]',
  'text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-brand-500/40',
)

/**
 * @param {{
 *   departments: Array<{ id: number, code: string, name: string }>
 *   canStructure: boolean
 * }} props
 */
export function PedagogyLevelsSection({ departments, canStructure }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchLevelsManage()
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      dispatchToast({ type: 'error', message: e?.message ?? 'Chargement des niveaux impossible.' })
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const deptLabel = (id) => {
    const d = departments.find((x) => x.id === id)
    return d ? `${d.code} — ${d.name}` : String(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg font-semibold text-[var(--app-fg)]">Niveaux (Licence, Master, Doctorat)</h3>
          <p className="mt-1 max-w-2xl text-sm text-[var(--app-muted)]">
            Référentiel par département : cycle, numéro et libellé. Utilisé pour rattacher les cours et les étudiants.
          </p>
        </div>
        {canStructure ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} aria-hidden />
            Nouveau niveau
          </Button>
        ) : null}
      </div>

      <Card className="overflow-hidden border border-[var(--app-border)] p-0 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Chargement" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_92%,var(--app-canvas))] text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                  <th className="px-4 py-3">Département</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">Libellé</th>
                  {canStructure ? <th className="px-4 py-3 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={canStructure ? 5 : 4} className="px-4 py-10 text-center text-[var(--app-muted)]">
                      Aucun niveau enregistré.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--app-border)] last:border-0">
                      <td className="px-4 py-2.5">{deptLabel(r.department)}</td>
                      <td className="px-4 py-2.5">{CYCLE_OPTIONS.find((c) => c.value === r.cycle)?.label ?? r.cycle}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{r.number}</td>
                      <td className="px-4 py-2.5 font-medium text-[var(--app-fg)]">{r.name}</td>
                      {canStructure ? (
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                setEditing(r)
                                setModalOpen(true)
                              }}
                            >
                              <Pencil size={14} aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-600 dark:text-red-400"
                              onClick={() =>
                                setConfirmDelete({
                                  title: `Supprimer « ${r.name} » ?`,
                                  message: 'Impossible si des cours utilisent encore ce niveau.',
                                  confirmLabel: 'Supprimer',
                                  action: async () => {
                                    try {
                                      await deleteLevelManage(r.id)
                                      dispatchToast({ type: 'success', message: 'Niveau supprimé.' })
                                      await load()
                                    } catch (err) {
                                      dispatchToast({
                                        type: 'error',
                                        message: err?.response?.data?.detail ?? err?.message ?? 'Suppression impossible.',
                                      })
                                      throw err
                                    }
                                  },
                                })
                              }
                            >
                              <Trash2 size={14} aria-hidden />
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LevelEditModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        departments={departments}
        level={editing}
        onSaved={load}
      />

      <ConfirmModal
        open={confirmDelete != null}
        title={confirmDelete?.title}
        message={confirmDelete?.message}
        confirmLabel={confirmDelete?.confirmLabel}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDelete?.action}
      />
    </div>
  )
}

function LevelEditModal({ open, onClose, departments, level, onSaved }) {
  const titleId = useId()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    department: '',
    cycle: 'LICENCE',
    number: '1',
    name: '',
  })

  useEffect(() => {
    if (!open) return
    setFormError('')
    if (level) {
      setForm({
        department: String(level.department ?? ''),
        cycle: level.cycle ?? 'LICENCE',
        number: String(level.number ?? '1'),
        name: level.name ?? '',
      })
    } else {
      setForm({
        department: departments[0]?.id != null ? String(departments[0].id) : '',
        cycle: 'LICENCE',
        number: '1',
        name: '',
      })
    }
  }, [open, level, departments])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    const deptId = Number(form.department)
    const num = Number(form.number)
    if (!Number.isFinite(deptId) || deptId <= 0) {
      setFormError('Choisissez un département.')
      setSubmitting(false)
      return
    }
    if (!Number.isFinite(num) || num < 1) {
      setFormError('Numéro de niveau invalide.')
      setSubmitting(false)
      return
    }
    const body = {
      department: deptId,
      cycle: form.cycle,
      number: num,
      name: form.name.trim(),
    }
    try {
      if (level?.id) {
        await patchLevelManage(level.id, body)
        dispatchToast({ type: 'success', message: 'Niveau mis à jour.' })
      } else {
        await postLevelManage(body)
        dispatchToast({ type: 'success', message: 'Niveau créé.' })
      }
      await onSaved?.()
      onClose()
    } catch (err) {
      const d = err?.response?.data
      const msg =
        (typeof d === 'string' ? d : null) ??
        d?.detail ??
        d?.non_field_errors?.[0] ??
        (d && typeof d === 'object' ? Object.values(d).flat().find(Boolean) : null) ??
        err?.message ??
        'Enregistrement impossible.'
      setFormError(String(msg))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/55 dark:bg-black/70 backdrop-blur-[2px]"
      role="presentation"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-base font-semibold text-[var(--app-fg)]">
          {level ? 'Modifier le niveau' : 'Nouveau niveau'}
        </h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--app-muted)]">Département</label>
            <select
              className={inputClass}
              required
              value={form.department}
              disabled={Boolean(level)}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            >
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--app-muted)]">Cycle</label>
            <select className={inputClass} value={form.cycle} onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value }))}>
              {CYCLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--app-muted)]">Numéro</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--app-muted)]">Libellé (optionnel)</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Ex. L1 — parcours général"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          {formError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" disabled={submitting} onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
