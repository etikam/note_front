export const OVERVIEW_SEMESTER_OPTIONS = [
  { value: '', label: 'Tous les semestres' },
  { value: '1', label: 'S1' },
  { value: '2', label: 'S2' },
  { value: '3', label: 'S3' },
  { value: '4', label: 'S4' },
  { value: '5', label: 'S5' },
  { value: '6', label: 'S6' },
]

export function createOverviewFilters() {
  return {
    semester: '',
    departmentId: '',
    levelId: '',
    includeInactive: false,
  }
}
