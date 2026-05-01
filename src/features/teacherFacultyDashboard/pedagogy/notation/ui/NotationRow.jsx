import { useCallback, useEffect, useState } from 'react'

import { patchCourseStudentGrade } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { NotationNumberInput } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationNumberInput'
import {
  NotationGradeStatusBadge,
  NotationPublicationBadges,
  NotationWorkflowBadge,
} from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationStatusBadges'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

/** @returns {null|number|undefined} undefined = invalide */
function toPayloadPart(v) {
  const t = String(v ?? '').trim()
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0 || n > 10) return undefined
  return Math.round(n * 100) / 100
}

function serverNote(g, key) {
  if (!g) return null
  const v = g[key]
  return v != null ? String(v) : ''
}

/** True si une note de rattrapage est déjà enregistrée (reste éditable même si le statut n'est plus NEEDS_MAKEUP). */
function hasPersistedNote4(grade) {
  if (!grade) return false
  const v = grade.note4
  if (v == null) return false
  if (typeof v === 'string' && v.trim() === '') return false
  return true
}

export function NotationRow({ courseId, row, canPublishGrades, rowSaving, setRowSaving, onGradeSaved }) {
  const g = row.grade
  const [n1, setN1] = useState('')
  const [n2, setN2] = useState('')
  const [n3, setN3] = useState('')
  const [n4, setN4] = useState('')

  useEffect(() => {
    setN1(serverNote(g, 'note1'))
    setN2(serverNote(g, 'note2'))
    setN3(serverNote(g, 'note3'))
    setN4(serverNote(g, 'note4'))
  }, [g])

  const saving = rowSaving === row.student_id
  const note4Editable = g?.status === 'NEEDS_MAKEUP' || hasPersistedNote4(g)

  const buildChangedBody = useCallback(() => {
    const body = {}
    const keys = [
      ['note1', n1],
      ['note2', n2],
      ['note3', n3],
      ['note4', n4],
    ]
    for (const [key, local] of keys) {
      const prev = serverNote(g, key)
      if (String(local).trim() === String(prev).trim()) continue
      const p = toPayloadPart(local)
      if (p === undefined) return { body: null, error: 'Chaque note doit être entre 0 et 10 (ou vide).' }
      body[key] = p
    }
    return { body, error: null }
  }, [g, n1, n2, n3, n4])

  const flush = useCallback(async () => {
    const { body, error } = buildChangedBody()
    if (error) {
      dispatchToast({ type: 'error', message: error })
      return
    }
    if (!body || Object.keys(body).length === 0) return

    setRowSaving(row.student_id)
    try {
      const data = await patchCourseStudentGrade(courseId, row.student_id, body)
      onGradeSaved(row.student_id, data)
    } catch (e) {
      dispatchToast({
        type: 'error',
        message: e?.response?.data?.detail ?? e?.message ?? 'Enregistrement impossible.',
      })
    } finally {
      setRowSaving(null)
    }
  }, [buildChangedBody, courseId, onGradeSaved, row.student_id, setRowSaving])

  const togglePublished = async () => {
    if (!g?.id) return
    const next = !g.published
    setRowSaving(row.student_id)
    try {
      const data = await patchCourseStudentGrade(courseId, row.student_id, { published: next })
      onGradeSaved(row.student_id, data)
    } catch (e) {
      dispatchToast({ type: 'error', message: e?.response?.data?.detail ?? 'Action refusée.' })
    } finally {
      setRowSaving(null)
    }
  }

  return (
    <tr className="border-b border-zinc-100 dark:border-[var(--app-border)]">
      <td className="whitespace-nowrap py-2 pl-4 pr-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">
        {row.matricule}
      </td>
      <td className="min-w-[10rem] py-2 pr-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {row.first_name} {row.last_name}
      </td>
      <td className="p-1.5">
        <NotationNumberInput
          id={`n1-${row.student_id}`}
          label={`Note 1 — ${row.last_name}`}
          value={n1}
          saving={saving}
          onChange={setN1}
          onBlur={flush}
        />
      </td>
      <td className="p-1.5">
        <NotationNumberInput
          id={`n2-${row.student_id}`}
          label={`Note 2 — ${row.last_name}`}
          value={n2}
          saving={saving}
          onChange={setN2}
          onBlur={flush}
        />
      </td>
      <td className="p-1.5">
        <NotationNumberInput
          id={`n3-${row.student_id}`}
          label={`Note 3 — ${row.last_name}`}
          value={n3}
          saving={saving}
          onChange={setN3}
          onBlur={flush}
        />
      </td>
      <td className="p-1.5">
        <NotationNumberInput
          id={`n4-${row.student_id}`}
          label={`Rattrapage — ${row.last_name}`}
          value={n4}
          disabled={!note4Editable}
          saving={saving}
          onChange={setN4}
          onBlur={flush}
        />
      </td>
      <td className="px-2 py-2 text-center text-sm tabular-nums text-zinc-800 dark:text-zinc-200">
        {g?.average != null ? String(g.average) : '—'}
      </td>
      <td className="min-w-[8rem] px-2 py-2">
        <NotationGradeStatusBadge grade={g} />
      </td>
      <td className="min-w-[8.5rem] px-2 py-2">
        <NotationWorkflowBadge grade={g} />
      </td>
      <td className="min-w-[7.5rem] py-2 pr-4 text-right align-middle">
        <div className="flex flex-col items-end justify-center gap-1.5">
          {g?.id ? (
            <NotationPublicationBadges grade={g} />
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          )}
          {canPublishGrades && g?.id ? (
            <button
              type="button"
              disabled={saving}
              onClick={togglePublished}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors',
                g.published
                  ? 'border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950/50'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-[var(--app-border)] dark:hover:bg-white/5',
              )}
            >
              {g.published ? 'Dépublier' : 'Publier'}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
