import { BookOpen, CalendarDays, FileText, Layers, School } from 'lucide-react'

/**
 * Onglets du référentiel académique, visibles selon les permissions (``buildAccess``).
 * Le calendrier est une ressource commune : il exige un périmètre faculté ou institution.
 * Départements et programmes se gèrent dans « Structure » (``/structure``).
 */
export const PEDAGOGY_SECTION_TABS = [
  { id: 'calendar', label: 'Années & semestres', icon: CalendarDays, visible: (a) => a.canGlobal('calendar.manage') },
  { id: 'ue', label: 'UE & offres', icon: Layers, visible: (a) => a.canManage('curriculum.manage') },
  { id: 'courses', label: 'Cours', icon: BookOpen, visible: (a) => a.canManage('curriculum.manage') },
  { id: 'maquette', label: 'Maquette', icon: FileText, visible: (a) => a.canManage('curriculum.manage') },
  { id: 'levels', label: 'Niveaux', icon: School, visible: (a) => a.canManage('curriculum.manage') },
]

export const PEDAGOGY_TAB_IDS = new Set(PEDAGOGY_SECTION_TABS.map((t) => t.id))

export function filterPedagogyTabsForAccess(access) {
  return PEDAGOGY_SECTION_TABS.filter((t) => t.visible(access))
}
