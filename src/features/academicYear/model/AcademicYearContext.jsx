import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import {
  clearAcademicYearExplicitClear,
  clearStoredAcademicYearId,
  getStoredAcademicYearId,
  hasAcademicYearExplicitClear,
  setAcademicYearExplicitClear,
  setStoredAcademicYearId,
} from '@/core/academicYearStorage'
import { fetchAcademicYears } from '@/features/academicYear/api/academicsApi'

const AcademicYearContext = createContext(null)

export function AcademicYearProvider({ children }) {
  const [academicYearId, setAcademicYearIdState] = useState(() => getStoredAcademicYearId())
  const [academicYears, setAcademicYears] = useState([])
  const [isLoadingYears, setIsLoadingYears] = useState(false)
  const [isAcademicYearSwitching, setIsAcademicYearSwitching] = useState(false)

  const academicYearIdRef = useRef(academicYearId)
  const switchOverlayTimerRef = useRef(null)

  useEffect(() => {
    academicYearIdRef.current = academicYearId
  }, [academicYearId])

  const endSwitchOverlaySoon = useCallback(() => {
    if (switchOverlayTimerRef.current != null) {
      window.clearTimeout(switchOverlayTimerRef.current)
    }
    switchOverlayTimerRef.current = window.setTimeout(() => {
      setIsAcademicYearSwitching(false)
      switchOverlayTimerRef.current = null
    }, 420)
  }, [])

  const setAcademicYearId = useCallback(
    (id) => {
      const next = id === null || id === undefined || id === '' ? null : String(id)
      const prev = academicYearIdRef.current === null || academicYearIdRef.current === undefined
        ? null
        : String(academicYearIdRef.current)
      if (prev === next) return

      const userSwitchedYear = prev !== null && next !== null && prev !== next
      const clearedSelection = prev !== null && next === null
      const showOverlay = userSwitchedYear || clearedSelection

      if (showOverlay) {
        setIsAcademicYearSwitching(true)
        endSwitchOverlaySoon()
      }

      clearAcademicYearExplicitClear()
      setStoredAcademicYearId(next)
      academicYearIdRef.current = next
      setAcademicYearIdState(next)
    },
    [endSwitchOverlaySoon],
  )

  const clearAcademicYear = useCallback(() => {
    const prev = academicYearIdRef.current === null || academicYearIdRef.current === undefined
      ? null
      : String(academicYearIdRef.current)
    if (prev !== null) {
      setIsAcademicYearSwitching(true)
      endSwitchOverlaySoon()
    }
    setAcademicYearExplicitClear()
    clearStoredAcademicYearId()
    academicYearIdRef.current = null
    setAcademicYearIdState(null)
  }, [endSwitchOverlaySoon])

  const refreshAcademicYears = useCallback(async () => {
    setIsLoadingYears(true)
    try {
      const rows = await fetchAcademicYears()
      setAcademicYears(rows)
      return rows
    } catch (_error) {
      setAcademicYears([])
      return []
    } finally {
      setIsLoadingYears(false)
    }
  }, [])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((y) => String(y.id) === String(academicYearId)) ?? null,
    [academicYears, academicYearId]
  )

  const academicYearLabel = useMemo(() => {
    if (selectedAcademicYear?.year) return selectedAcademicYear.year
    if (academicYearId) return `ID ${academicYearId}`
    return null
  }, [selectedAcademicYear, academicYearId])

  /**
   * Si localStorage vide et pas d’effacement explicite (ex. bannière dev), aligner sur l’année `is_current` de l’API.
   */
  useEffect(() => {
    if (hasAcademicYearExplicitClear()) return
    if (getStoredAcademicYearId()) return
    if (!academicYears.length) return
    const current = academicYears.find((y) => y.is_current === true)
    if (!current) return
    setAcademicYearId(String(current.id))
  }, [academicYears, setAcademicYearId])

  useEffect(
    () => () => {
      if (switchOverlayTimerRef.current != null) {
        window.clearTimeout(switchOverlayTimerRef.current)
      }
    },
    [],
  )

  const value = useMemo(
    () => ({
      academicYearId,
      setAcademicYearId,
      clearAcademicYear,
      academicYears,
      isLoadingYears,
      isAcademicYearSwitching,
      refreshAcademicYears,
      selectedAcademicYear,
      academicYearLabel,
    }),
    [
      academicYearId,
      academicYears,
      clearAcademicYear,
      isLoadingYears,
      isAcademicYearSwitching,
      refreshAcademicYears,
      selectedAcademicYear,
      academicYearLabel,
      setAcademicYearId,
    ]
  )

  return <AcademicYearContext.Provider value={value}>{children}</AcademicYearContext.Provider>
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext)
  if (!context) {
    throw new Error('useAcademicYear doit être utilisé sous AcademicYearProvider.')
  }
  return context
}
