import { ComingSoonPage } from '@/pages/ComingSoonPage'

export function TeacherReportsPage() {
  return (
    <ComingSoonPage
      title="Rapports"
      subtitle="Graphiques périodiques, répartitions, et exports de pilotage."
      items={[
        'Évolution mensuelle des inscriptions',
        'Répartition étudiants par département / niveau',
        'Enseignants par rôle',
        'Exports PDF/CSV (plus tard)',
      ]}
    />
  )
}

