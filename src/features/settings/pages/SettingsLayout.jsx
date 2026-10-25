import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAccess } from '@/features/access/model/useAccess'
import { settingsTabs } from '@/features/settings/model/settingsTabs'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RouteTabs } from '@/shared/ui/RouteTabs'

export function SettingsLayout() {
  const access = useAccess()
  const location = useLocation()
  const tabs = settingsTabs(access)
  const path = location.pathname.replace(/\/$/, '')
  const current = tabs.find((t) => (t.end ? path === t.to : path.startsWith(t.to)))
  if (!current) return <Navigate to="/settings" replace />

  return (
    <section aria-label="Paramètres">
      <PageHeader
        className="mb-4"
        breadcrumbs={[{ label: 'Paramètres' }, { label: current.label }]}
        title="Paramètres"
        description={
          tabs.length > 1
            ? 'Vos préférences, et la configuration de l’établissement : nominations, rôles et circuit de validation des notes.'
            : 'Thème, notifications et navigation.'
        }
      />
      <RouteTabs tabs={tabs} ariaLabel="Sections des paramètres" className="mb-6" />
      <Outlet />
    </section>
  )
}
