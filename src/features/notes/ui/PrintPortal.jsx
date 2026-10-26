import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Impression isolée de documents (relevés A4) : le contenu est rendu hors de l'application,
 * seul imprimé (``body.is-printing-docs``, voir globals.css), puis retiré après l'impression.
 *
 * ``const { print, portal } = usePrintDocuments()`` ; ``print(<Docs/>)`` ; rendre ``{portal}``.
 */
export function usePrintDocuments() {
  const [content, setContent] = useState(null)

  useEffect(() => {
    if (!content) return undefined
    document.body.classList.add('is-printing-docs')
    const done = () => setContent(null)
    window.addEventListener('afterprint', done)
    // Laisse le temps au rendu (QR codes asynchrones) avant d'ouvrir la boîte d'impression.
    const t = setTimeout(() => window.print(), 350)
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', done)
      document.body.classList.remove('is-printing-docs')
    }
  }, [content])

  const print = useCallback((node) => setContent(node), [])
  const portal = content ? createPortal(<div className="print-portal">{content}</div>, document.body) : null
  return { print, portal, printing: Boolean(content) }
}
