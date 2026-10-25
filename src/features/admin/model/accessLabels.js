export const SCOPE_LEVEL_LABELS = {
  institution: 'Institution',
  faculty: 'Faculté',
  department: 'Département',
  program: 'Programme',
  own: 'Ses cours',
}

/** Formulation « sur … » pour expliquer la portée d'un rôle. */
export const SCOPE_LEVEL_PHRASES = {
  institution: 'sur toute l’institution',
  faculty: 'sur une faculté entière',
  department: 'sur un département et tous ses programmes',
  program: 'sur un programme',
  own: 'sur les cours qui lui sont affectés',
}

export const SCOPE_LEVEL_ORDER = ['institution', 'faculty', 'department', 'program', 'own']

export const ASSIGNMENT_STATUS = {
  active: { label: 'Actif', tone: 'success' },
  upcoming: { label: 'À venir', tone: 'info' },
  expired: { label: 'Expiré', tone: 'neutral' },
  revoked: { label: 'Révoqué', tone: 'danger' },
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(value) {
  if (!value) return null
  const d = new Date(`${value}`.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(d.getTime()) ? value : dateFmt.format(d)
}

/** « Depuis le 3 janv. 2026 », « Jusqu’au … », « Du … au … », « Sans limite ». */
export function formatPeriod(startsOn, endsOn) {
  const s = formatDate(startsOn)
  const e = formatDate(endsOn)
  if (s && e) return `Du ${s} au ${e}`
  if (s) return `Depuis le ${s}`
  if (e) return `Jusqu’au ${e}`
  return 'Sans limite de durée'
}

/** Regroupe le catalogue par domaine en conservant l'ordre du serveur. */
export function groupCatalog(permissions = []) {
  const groups = []
  const index = new Map()
  for (const p of permissions) {
    if (!index.has(p.group)) {
      index.set(p.group, groups.length)
      groups.push({ name: p.group, permissions: [] })
    }
    groups[index.get(p.group)].permissions.push(p)
  }
  return groups
}
