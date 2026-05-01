import { useCallback, useEffect, useState } from 'react'

/**
 * Passe à true lorsque l’élément référencé entre dans le viewport (lazy load).
 * Retourne [setNodeRef, inView] — passer setNodeRef à l’attribut ref du conteneur.
 * @param {{ rootMargin?: string, threshold?: number }} [options]
 */
export function useInView(options = {}) {
  const { rootMargin = '120px', threshold = 0.02 } = options
  const [node, setNode] = useState(null)
  const [inView, setInView] = useState(false)

  const setNodeRef = useCallback((el) => {
    setNode(el ?? null)
  }, [])

  useEffect(() => {
    if (inView || !node) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true)
      },
      { root: null, rootMargin, threshold },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [node, inView, rootMargin, threshold])

  return [setNodeRef, inView]
}
