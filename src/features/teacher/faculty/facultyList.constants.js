/** Filtre « mandat » de l'annuaire (API ``teacher_role`` : rôle principal, ``teacher`` = sans mandat). */
export const TEACHER_ROLE_OPTIONS = [
  { value: 'teacher', label: 'Enseignant' },
  { value: 'department_head', label: 'Chef de département' },
  { value: 'study_director', label: 'Directeur des études' },
  { value: 'program_director', label: 'Directeur de programme' },
  { value: 'general_director', label: 'Directeur général' },
]

/** Statuts RH d'un enseignant (champ ``status``) : libellé, ton, clé des statistiques ``accounts``. */
export const TEACHER_STATUS = {
  active: { label: 'Actif', tone: 'success', statKey: 'active' },
  inactive: { label: 'Inactif', tone: 'neutral', statKey: 'inactive' },
  suspended: { label: 'Suspendu', tone: 'danger', statKey: 'suspended' },
  on_leave: { label: 'En congé', tone: 'warning', statKey: 'on_leave' },
}
