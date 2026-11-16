import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import { AppProviders } from '@/app/providers/AppProviders'
import { resolveProgramHost } from '@/features/programs/programHosts'
import 'react-day-picker/style.css'
import '@/app/styles/globals.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

// Sites de programmes (ex. bioinfo.ci.edu.gn) : site autonome, sans providers de l'app.
const programSlug = resolveProgramHost(typeof window !== 'undefined' ? window.location.hostname : '')
if (programSlug) {
  const ProgramSite = React.lazy(() => import('@/features/programs/ProgramSite'))
  root.render(
    <React.StrictMode>
      <Suspense fallback={null}>
        <ProgramSite slug={programSlug} />
      </Suspense>
    </React.StrictMode>,
  )
} else {
  root.render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>,
  )
}
