import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'

/**
 * Filtres partagés de l'espace « Notes », conservés dans l'URL : ``program``, ``level``, ``semester``,
 * ``published`` (fiches publiées uniquement). Le programme est imposé par un périmètre réduit ;
 * un seul programme ou un seul niveau disponible est présélectionné.
 */
export function useNotesFilters(permission = 'grades.view', { autoLevel = true } = {}) {
  const scopeOptions = useScopeOptions(permission)
  const [params, setParams] = useSearchParams()
  const programId = params.get('program') ?? ''
  const levelId = params.get('level') ?? ''
  const semester = params.get('semester') ?? ''
  const publishedOnly = params.get('published') === '1'
  const [levels, setLevels] = useState([])
  const [levelsLoading, setLevelsLoading] = useState(false)

  const update = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v === '' || v == null || v === false) next.delete(k)
            else next.set(k, v === true ? '1' : String(v))
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  // Programme imposé ou unique.
  useEffect(() => {
    if (scopeOptions.loading || programId) return
    const locked = defaultScope(scopeOptions)
    const only = scopeOptions.programs.length === 1 ? String(scopeOptions.programs[0].id) : ''
    if (locked.programId || only) update({ program: locked.programId || only })
  }, [scopeOptions, programId, update])

  useEffect(() => {
    if (!programId) {
      setLevels([])
      return undefined
    }
    let cancelled = false
    setLevelsLoading(true)
    fetchLevels({ program: programId })
      .then((list) => {
        if (cancelled) return
        const sorted = [...list].sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        setLevels(sorted)
        if (autoLevel && !sorted.some((l) => String(l.id) === levelId) && sorted.length) update({ level: sorted[0].id })
      })
      .catch(() => !cancelled && setLevels([]))
      .finally(() => !cancelled && setLevelsLoading(false))
    return () => {
      cancelled = true
    }
    // ``levelId`` volontairement exclu : ne recharger les niveaux qu'au changement de programme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, autoLevel, update])

  const level = useMemo(() => levels.find((l) => String(l.id) === levelId) ?? null, [levels, levelId])
  const program = scopeOptions.programById.get(Number(programId)) ?? null

  return {
    scopeOptions,
    programId,
    program,
    levelId,
    level,
    levels,
    levelsLoading,
    semester,
    publishedOnly,
    setProgram: (id) => update({ program: id, level: '' }),
    setLevel: (id) => update({ level: id }),
    setSemester: (s) => update({ semester: s }),
    setPublishedOnly: (on) => update({ published: on }),
    params,
    update,
  }
}
