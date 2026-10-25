import { useEffect, useState } from 'react'

import { fetchPrograms } from '@/features/academicYear/api/academicsApi'

/** Programmes (cursus) groupables par département ; rechargés si ``enabled`` passe à vrai. */
export function usePrograms({ enabled = true } = {}) {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    setLoading(true)
    fetchPrograms({}, { skipErrorToast: true })
      .then((rows) => {
        if (!cancelled) setPrograms(rows)
      })
      .catch(() => {
        if (!cancelled) setPrograms([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { programs, loading }
}

/** ``[{ department: {id, code, name}, programs: [...] }]`` trié par code de département. */
export function groupProgramsByDepartment(programs) {
  const groups = new Map()
  for (const p of programs) {
    const key = p.department
    if (!groups.has(key)) {
      groups.set(key, { department: { id: p.department, code: p.department_code, name: p.department_name }, programs: [] })
    }
    groups.get(key).programs.push(p)
  }
  return [...groups.values()].sort((a, b) => String(a.department.code).localeCompare(String(b.department.code)))
}
