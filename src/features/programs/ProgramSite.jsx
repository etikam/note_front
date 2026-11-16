import { lazy, Suspense } from 'react'

const Bioinformatique = lazy(() => import('@/features/programs/pages/Bioinformatique'))

const PAGES = {
  bioinformatique: Bioinformatique,
}

/**
 * Point d'entrée d'un site de programme (monté par `main.jsx` sur un sous-domaine dédié).
 * Autonome : ne dépend ni de l'auth, ni du routeur, ni de l'API.
 */
export default function ProgramSite({ slug }) {
  const Page = PAGES[slug]
  if (!Page) {
    if (typeof window !== 'undefined') window.location.replace('https://ci.edu.gn')
    return null
  }
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}
