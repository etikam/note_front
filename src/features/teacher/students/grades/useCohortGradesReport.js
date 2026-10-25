import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchCohortGradesReport, fetchCohorts } from '@/features/academicYear/api/academicsApi'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { defaultScope, programIdsFor } from '@/features/access/model/scopeFilter'

/** Relevé d'une cohorte ; les cohortes proposées sont celles des programmes du périmètre (``reports.view``). */
export function useCohortGradesReport() {
  const scopeOptions = useScopeOptions('reports.view')
  const [scope, setScope] = useState({ departmentId: '', programId: '' })
  const { departmentId, programId } = scope
  const [cohortId, setCohortId] = useState('')
  const [allCohorts, setCohorts] = useState([])
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
        const cohortList = await fetchCohorts()
        if (!cancelled) setCohorts(cohortList)
      } catch {
        if (!cancelled) setCohorts([])
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (scopeOptions.loading) return
    const locked = defaultScope(scopeOptions)
    if (locked.departmentId || locked.programId) setScope(locked)
  }, [scopeOptions])

  const cohorts = useMemo(() => {
    const ids = programIdsFor(scopeOptions, scope)
    return allCohorts.filter((c) => ids.has(c.program))
  }, [allCohorts, scopeOptions, scope])

  useEffect(() => {
    setCohortId('')
    setReport(null)
    setSelectedCourseId('')
    setSearchQuery('')
  }, [departmentId, programId])

  useEffect(() => {
    setSelectedCourseId('')
    setSearchQuery('')
  }, [cohortId])

  const load = useCallback(async () => {
    if (!cohortId) { setReport(null); return }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCohortGradesReport(cohortId, {})
      setReport(data)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [cohortId])

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
    scopeOptions,
    departmentId,
    programId,
    setScope,
    cohorts,
    metaLoading,
    cohortId,
    setCohortId,
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
