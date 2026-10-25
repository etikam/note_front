import { KeyRound, ShieldCheck, SlidersHorizontal, UserCog } from 'lucide-react'

/** Onglets de Paramètres : préférences pour tous, configuration selon les droits. */
export function settingsTabs(access) {
  return [
    { to: '/settings', end: true, label: 'Préférences', icon: UserCog, visible: true },
    { to: '/settings/nominations', label: 'Nominations', icon: ShieldCheck, visible: access.canManage('access.assign_roles') },
    {
      to: '/settings/roles',
      label: 'Rôles & permissions',
      icon: KeyRound,
      visible: access.can('access.manage_roles') || access.canManage('access.assign_roles'),
    },
    { to: '/settings/grade-circuit', label: 'Circuit des notes', icon: SlidersHorizontal, visible: access.can('system.settings') },
  ].filter((t) => t.visible)
}
