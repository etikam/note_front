import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'

/**
 * Filtres communs des rapports, conservés dans l'URL (et donc d'un rapport à l'autre) :
 * ``department`` ou ``program`` (sélecteur en arbre), ``level`` (si programme), ``semester``.
 * Un périmètre réduit à une entité impose le filtre.
 */
export function useReportFilters(permission = 'reports.view') {
  const scopeOptions = useScopeOptions(permission)
  const [params, setParams] = useSearchParams()
  const departmentId = params.get('department') ?? ''
  const programId = params.get('program') ?? ''
  const levelId = params.get('level') ?? ''
  const semester = params.get('semester') ?? ''
  const [levels, setLevels] = useState([])

  const update = useCallback(
    (patch) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v === '' || v == null) next.delete(k)
            else next.set(k, String(v))
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  useEffect(() => {
    if (scopeOptions.loading || departmentId || programId) return
    const locked = defaultScope(scopeOptions)
    if (locked.departmentId || locked.programId) update({ department: locked.departmentId, program: locked.programId })
  }, [scopeOptions, departmentId, programId, update])

  useEffect(() => {
    if (!programId) {
      setLevels([])
      return undefined
    }
    let cancelled = false
    fetchLevels({ program: programId })
      .then((list) => !cancelled && setLevels([...list].sort((a, b) => (a.number ?? 0) - (b.number ?? 0))))
      .catch(() => !cancelled && setLevels([]))
    return () => {
      cancelled = true
    }
  }, [programId])

  const query = useMemo(
    () => ({ department: departmentId, program: programId, level: levelId, semester }),
    [departmentId, programId, levelId, semester],
  )

  return {
    scopeOptions,
    departmentId,
    programId,
    levelId,
    semester,
    levels,
    query,
    setScope: ({ departmentId: d, programId: p }) => update({ department: d, program: p, level: '' }),
    setLevel: (id) => update({ level: id }),
    setSemester: (s) => update({ semester: s }),
    reset: () => update({ department: '', program: '', level: '', semester: '' }),
    update,
  }
}
