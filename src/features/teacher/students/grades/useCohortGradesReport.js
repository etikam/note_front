import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchCohortGradesReport, fetchCohorts, fetchDepartments } from '@/features/academicYear/api/academicsApi'
import { useAuth } from '@/features/auth/model/AuthContext'

export function useCohortGradesReport() {
  const { user } = useAuth()
  const managedDeptId = user?.scope?.managed_department_id ?? null
  const institutionWide = Boolean(user?.scope?.institution_wide)
  const deptScoped = managedDeptId != null && !institutionWide

  const [departmentId, setDepartmentId] = useState(deptScoped ? String(managedDeptId) : '')
  const [cohortId, setCohortId] = useState('')
  const [departments, setDepartments] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMetaLoading(true)
      try {
        const [deptList, cohortList] = await Promise.all([fetchDepartments(), fetchCohorts()])
        if (!cancelled) {
          setDepartments(deptList)
          setCohorts(cohortList)
        }
      } catch {
        if (!cancelled) { setDepartments([]); setCohorts([]) }
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setCohortId('')
    setReport(null)
    setSelectedCourseId('')
    setSearchQuery('')
  }, [departmentId])

  useEffect(() => {
    setSelectedCourseId('')
    setSearchQuery('')
  }, [cohortId])

  const load = useCallback(async () => {
    if (!cohortId) { setReport(null); return }
    setLoading(true)
    setError(null)
    try {
      const params = departmentId ? { department_id: departmentId } : {}
      const data = await fetchCohortGradesReport(cohortId, params)
      setReport(data)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [cohortId, departmentId])

  useEffect(() => { load() }, [load])

  /** Liste plate de tous les cours du rapport (pour le filtre matière). */
  const courses = useMemo(() => {
    if (!report) return []
    return report.semesters.flatMap((sem) =>
      sem.teaching_units.flatMap((tu) =>
        tu.courses.map((c) => ({ ...c, semesterNumber: sem.number, tuName: tu.name })),
      ),
    )
  }, [report])

  return {
    departments,
    cohorts,
    metaLoading,
    departmentId,
    setDepartmentId,
    cohortId,
    setCohortId,
    deptScoped,
    report,
    loading,
    error,
    reload: load,
    courses,
    selectedCourseId,
    setSelectedCourseId,
    searchQuery,
    setSearchQuery,
  }
}
