import { useCallback, useEffect, useState } from 'react'

import { fetchStudentDetail } from '@/features/teacher/students/api/studentsApi'

/**
 * Fiche étudiant (détail API) pour la page dossier.
 */
export function useStudentDetail(studentId) {
  const id = Number(studentId)
  const validId = Number.isInteger(id) && id > 0

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [student, setStudent] = useState(null)

  const load = useCallback(async () => {
    if (!validId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStudentDetail(id)
      setStudent(data)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setStudent(null)
    } finally {
      setLoading(false)
    }
  }, [id, validId])

  useEffect(() => {
    if (!validId) {
      setLoading(false)
      setStudent(null)
      setError(null)
      return
    }
    load()
  }, [validId, load])

  return {
    validId,
    loading,
    error,
    student,
    reload: load,
  }
}
