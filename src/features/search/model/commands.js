import {
  BookOpen,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Library,
  ShieldCheck,
  Upload,
  User,
  UserCog,
  UserPlus,
} from 'lucide-react'

import { buildStaffNavigation } from '@/app/layouts/navigation'
import { settingsTabs } from '@/features/settings/model/settingsTabs'

/** Pages du menu (selon les droits) + actions rapides, pour la palette ⌘K. */
export function buildCommands(access) {
  const pages = buildStaffNavigation(access).flatMap((section) =>
    section.items.map((item) => ({
      id: `page:${item.to}`,
      group: 'Pages',
      icon: item.icon,
      title: item.label,
      subtitle: section.label,
      to: item.to,
      keywords: `${item.label} ${section.label}`,
    })),
  )
  const settings = settingsTabs(access).map((t) => ({
    id: `page:${t.to}`,
    group: 'Pages',
    icon: t.icon,
    title: t.label,
    subtitle: 'Paramètres',
    to: t.to,
    keywords: `${t.label} paramètres configuration`,
  }))
  pages.push(...settings)
  const actions = [
    {
      id: 'action:nominate',
      icon: UserPlus,
      title: 'Nommer un responsable',
      subtitle: 'Chef de département, directeur de programme…',
      to: '/settings/nominations?new=1',
      visible: access.canManage('access.assign_roles'),
      keywords: 'nomination mandat rôle chef directeur',
    },
    {
      id: 'action:validate',
      icon: ClipboardCheck,
      title: 'Valider des fiches de notes',
      to: '/teacher/validations',
      visible: access.canManageAny('grades.validate', 'grades.publish'),
      keywords: 'validation notes fiche publier',
    },
    {
      id: 'action:assign',
      icon: UserCog,
      title: 'Affecter un enseignant à un cours',
      to: '/teacher/faculty/course-assignments',
      visible: access.canManage('courses.assign'),
      keywords: 'affectation enseignant cours',
    },
    {
      id: 'action:import-students',
      icon: Upload,
      title: 'Importer des étudiants',
      to: '/teacher/students/import-export',
      visible: access.canManage('students.import'),
      keywords: 'import étudiants excel csv',
    },
    {
      id: 'action:curriculum',
      icon: Library,
      title: 'Construire la maquette',
      subtitle: 'UE, cours et crédits',
      to: '/teacher/academie?tab=maquette',
      visible: access.canManage('curriculum.manage'),
      keywords: 'maquette ue cours crédits référentiel',
    },
    {
      id: 'action:structure',
      icon: Building2,
      title: 'Explorer la structure',
      to: '/structure',
      visible: access.isManager,
      keywords: 'département programme structure',
    },
    { id: 'action:courses', icon: BookOpen, title: 'Mes cours', to: '/teacher/my-courses', visible: true, keywords: 'cours notes saisie' },
    { id: 'action:profile', icon: User, title: 'Mon profil', to: '/profile', visible: true, keywords: 'profil compte mandats' },
  ]
    .filter((a) => a.visible)
    .map((a) => ({ ...a, group: 'Actions' }))
  return { pages, actions }
}

/** Liens des résultats de recherche serveur. */
export const RESULT_GROUPS = [
  { key: 'students', label: 'Étudiants', icon: GraduationCap, to: (r) => `/teacher/students/${r.id}` },
  { key: 'teachers', label: 'Enseignants', icon: UserCog, to: (r) => `/teacher/faculty/${r.id}` },
  { key: 'courses', label: 'Cours', icon: BookOpen, to: (r) => `/teacher/courses/${r.id}` },
  { key: 'programs', label: 'Programmes', icon: ShieldCheck, to: (r) => `/structure?node=program:${r.id}` },
  { key: 'departments', label: 'Départements', icon: Building2, to: (r) => `/structure?node=department:${r.id}` },
]

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

const RECENT_KEY = 'gestion_ci.search.recent'

export function readRecent() {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.slice(0, 5) : []
  } catch {
    return []
  }
}

export function pushRecent(item) {
  try {
    const entry = { id: item.id, group: item.group, title: item.title, subtitle: item.subtitle, to: item.to, kind: item.kind }
    const next = [entry, ...readRecent().filter((r) => r.id !== item.id)].slice(0, 5)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* stockage indisponible : on ignore */
  }
}
