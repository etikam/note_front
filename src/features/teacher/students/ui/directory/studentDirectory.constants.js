/** Statuts de dossier étudiant (champ ``status``) : libellé, ton et clé des statistiques ``accounts``. */
export const STUDENT_STATUS = {
  ACTIVE: { label: 'Inscrit', tone: 'success', statKey: 'active' },
  INACTIVE: { label: 'En attente', tone: 'neutral', statKey: 'inactive' },
  SUSPENDED: { label: 'Suspendu', tone: 'warning', statKey: 'suspended' },
  EXCLUDED: { label: 'Exclu', tone: 'danger', statKey: 'excluded' },
  COMPLETED: { label: 'Terminé', tone: 'info', statKey: 'completed' },
}

export const STATUS_TABS = [{ id: '', label: 'Tous' }, ...Object.entries(STUDENT_STATUS).map(([id, s]) => ({ id, label: s.label }))]
