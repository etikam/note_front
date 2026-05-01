import { useEffect, useState } from 'react'

import { fetchDepartments } from '@/features/academicYear/api/academicsApi'

export function useDepartments() {
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const list = await fetchDepartments()
        if (mounted) setDepartments(list)
      } catch (_error) {
        if (mounted) setDepartments([])
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  return { departments, isLoading }
}
