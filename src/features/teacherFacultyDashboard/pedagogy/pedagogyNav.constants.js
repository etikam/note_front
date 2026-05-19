import { BookOpen, Building2, CalendarDays, FileText, Layers, School } from 'lucide-react'
import { canAccessRule } from '@/core/accessControl'

/**
 * Onglets du référentiel Académie.
 * `requiredAny` / `required` : capacités pour afficher l’onglet (aligné sidebar + page).
 */
export const PEDAGOGY_SECTION_TABS = [
  {
    id: 'calendar',
    label: 'Années & semestres',
    icon: CalendarDays,
    accessRule: {
      anyCapabilities: ['can_manage_academic_calendar', 'can_manage_academic_structure'],
      denyTeacherRoles: ['department_head'],
    },
  },
  {
    id: 'ue',
    label: 'UE & offres',
    icon: Layers,
    accessRule: {
      anyCapabilities: ['can_manage_academic_calendar', 'can_manage_academic_structure'],
      denyTeacherRoles: ['department_head'],
    },
  },
  {
    id: 'courses',
    label: 'Cours',
    icon: BookOpen,
    accessRule: {
      anyCapabilities: ['can_manage_academic_calendar', 'can_manage_academic_structure'],
      denyTeacherRoles: ['department_head'],
    },
  },
  {
    id: 'maquette',
    label: 'Maquette',
    icon: FileText,
    accessRule: {
      anyCapabilities: ['can_manage_academic_calendar', 'can_manage_academic_structure'],
      denyTeacherRoles: ['department_head'],
    },
  },
  {
    id: 'levels',
    label: 'Niveaux',
    icon: School,
    accessRule: {
      anyCapabilities: ['can_manage_academic_calendar', 'can_manage_academic_structure'],
      denyTeacherRoles: ['department_head'],
    },
  },
  {
    id: 'departments',
    label: 'Départements',
    icon: Building2,
    accessRule: {
      anyCapabilities: ['can_view_students'],
      denyTeacherRoles: ['department_head'],
    },
  },
]

export const PEDAGOGY_TAB_IDS = new Set(PEDAGOGY_SECTION_TABS.map((t) => t.id))

/** Filtre les onglets selon règles centralisées (rôles + capabilities). */
export function filterPedagogyTabsForUser(user = null) {
  return PEDAGOGY_SECTION_TABS.filter((t) => canAccessRule(user, t.accessRule))
}
