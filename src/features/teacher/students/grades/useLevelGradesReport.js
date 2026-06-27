import { useCallback, useEffect, useState } from 'react'

import { fetchDepartments, fetchLevelGradesReport, fetchLevels } from '@/features/academicYear/api/academicsApi'
import { useAuth } from '@/features/auth/model/AuthContext'

/**
 * Sélection Département → Niveau puis relevé de notes agrégé (cours par semestre/UE + notes par étudiant).
 */
export function useLevelGradesReport() {
  const { user } = useAuth()
  const managedDeptId = user?.scope?.managed_department_id ?? null
  const institutionWide = Boolean(user?.scope?.institution_wide)
  const deptScoped = managedDeptId != null && !institutionWide

  const [departmentId, setDepartmentId] = useState(deptScoped ? String(managedDeptId) : '')
  const [levelId, setLevelId] = useState('')
  const [departments, setDepartments] = useState([])
  const [levels, setLevels] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMetaLoading(true)
      try {
        const deptList = await fetchDepartments()
        if (!cancelled) setDepartments(deptList)
      } catch {
        if (!cancelled) setDepartments([])
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!departmentId) {
      setLevels([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchLevels({ department: departmentId })
        if (!cancelled) setLevels(list)
      } catch {
        if (!cancelled) setLevels([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [departmentId])

  useEffect(() => {
    setLevelId('')
    setReport(null)
  }, [departmentId])

  const load = useCallback(async () => {
    if (!levelId) {
      setReport(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLevelGradesReport(levelId)
      setReport(data)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [levelId])

  useEffect(() => {
    load()
  }, [load])

  return {
    departments,
    levels,
    metaLoading,
    departmentId,
    setDepartmentId,
    levelId,
    setLevelId,
    deptScoped,
    report,
    loading,
    error,
    reload: load,
  }
}
