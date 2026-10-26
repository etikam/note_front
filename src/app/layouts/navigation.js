import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  FileUp,
  GraduationCap,
  History,
  LayoutDashboard,
  Library,
  ListChecks,
  PieChart,
  RotateCcw,
  UserCog,
  Users,
} from 'lucide-react'

/**
 * Menu du personnel, piloté par les permissions effectives (``buildAccess``).
 * Chaque section n'apparaît que si au moins une entrée est visible.
 */
export function buildStaffNavigation(access) {
  const sections = [
    {
      id: 'me',
      label: 'Mon espace',
      items: [{ to: '/teacher/my-courses', label: 'Mes cours', icon: BookOpen, visible: true }],
    },
    {
      id: 'steering',
      label: 'Pilotage',
      items: [
        { to: '/teacher/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, visible: access.canManage('stats.view') },
        { to: '/teacher/reports', label: 'Rapports', icon: PieChart, visible: access.canManage('reports.view') },
      ],
    },
    {
      id: 'grades',
      label: 'Notes',
      items: [
        { to: '/grades', end: true, label: 'Notes', icon: ListChecks, visible: access.canManage('grades.view') },
        { to: '/grades/transcripts', label: 'Relevés de notes', icon: FileText, visible: access.canManage('reports.view') },
        {
          to: '/grades/validation',
          label: 'Validation des notes',
          icon: ClipboardCheck,
          visible: access.canManageAny('grades.validate', 'grades.publish'),
        },
        { to: '/grades/makeups', label: 'Rattrapages & dettes', icon: RotateCcw, visible: access.canManage('grades.view') },
        { to: '/grades/import', label: 'Import des notes', icon: FileUp, visible: access.canManage('grades.bulk_import') },
        { to: '/grades/history', label: 'Journal des notes', icon: History, visible: access.canManage('grades.view') },
      ],
    },
    {
      id: 'pedagogy',
      label: 'Pédagogie',
      items: [
        { to: '/structure', label: 'Structure', icon: Building2, visible: access.isManager },
        {
          to: '/teacher/academie',
          label: 'Référentiel',
          icon: Library,
          visible: access.canManage('curriculum.manage') || access.canGlobal('calendar.manage'),
        },
      ],
    },
    {
      id: 'people',
      label: 'Personnes',
      items: [
        { to: '/teacher/students', label: 'Étudiants', icon: GraduationCap, visible: access.canManage('students.view') },
        {
          to: '/teacher/faculty',
          label: 'Enseignants',
          icon: UserCog,
          visible: access.canManageAny('teachers.view', 'courses.assign', 'teachers.provision'),
        },
      ],
    },
  ]
  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.visible) }))
    .filter((s) => s.items.length > 0)
}

export function buildStudentNavigation(capabilities = {}) {
  const items = [
    { to: '/student/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { to: '/student/courses', label: 'Cours', icon: BookOpen },
    { to: '/student/grades', label: 'Notes', icon: FileText },
    { to: '/student/enrollments', label: 'Inscriptions', icon: GraduationCap },
  ]
  if (capabilities.can_manage_promotion) items.push({ to: '/student/promotion', label: 'Ma promotion', icon: Users })
  return items
}
