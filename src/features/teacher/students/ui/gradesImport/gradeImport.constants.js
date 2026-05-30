/** Colonnes du modèle Excel import notes (aligné backend). */
export const GRADE_IMPORT_REQUIRED_COLUMNS = ['matricule']

export const GRADE_IMPORT_OPTIONAL_COLUMNS = ['nom', 'prenom', 'note1', 'note2', 'note3']

export const GRADE_IMPORT_TEMPLATE_COLUMNS = [
  ...GRADE_IMPORT_REQUIRED_COLUMNS,
  ...GRADE_IMPORT_OPTIONAL_COLUMNS,
]

export const GRADE_IMPORT_COLUMN_LABELS = {
  matricule: 'matricule',
  nom: 'nom',
  prenom: 'prenom',
  note1: 'note1',
  note2: 'note2',
  note3: 'note3',
}
