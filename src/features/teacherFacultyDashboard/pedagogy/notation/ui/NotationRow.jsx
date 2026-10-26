import { useCallback, useEffect, useState } from 'react'

import { patchCourseStudentGrade } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { NotationNumberInput } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationNumberInput'
import { NotationGradeStatusBadge } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationStatusBadges'
import { dispatchToast } from '@/shared/notifications/toastBridge'

/** @returns {null|number|undefined} undefined = invalide (hors 0..barème) */
function toPayloadPart(v, scaleMax) {
  const t = String(v ?? '').trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0 || n > scaleMax) return undefined
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

/** ``editable`` : la fiche de notes du cours autorise la saisie (sinon lecture seule). */
export function NotationRow({ courseId, row, editable, scaleMax = 10, rowSaving, setRowSaving, onGradeSaved }) {
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
      const p = toPayloadPart(local, scaleMax)
      if (p === undefined) return { body: null, error: `Chaque note doit être entre 0 et ${scaleMax} (ou vide).` }
      body[key] = p
    }
    return { body, error: null }
  }, [g, n1, n2, n3, n4, scaleMax])

  const flush = useCallback(async () => {
    if (!editable) return
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
  }, [buildChangedBody, courseId, editable, onGradeSaved, row.student_id, setRowSaving])

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
          disabled={!editable}
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
          disabled={!editable}
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
          disabled={!editable}
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
          disabled={!editable || !note4Editable}
          saving={saving}
          onChange={setN4}
          onBlur={flush}
        />
      </td>
      <td className="px-2 py-2 text-center text-sm tabular-nums text-zinc-800 dark:text-zinc-200">
        {g?.average != null ? String(g.average) : '—'}
      </td>
      <td className="min-w-[8rem] py-2 pl-2 pr-4">
        <NotationGradeStatusBadge grade={g} />
      </td>
    </tr>
  )
}
