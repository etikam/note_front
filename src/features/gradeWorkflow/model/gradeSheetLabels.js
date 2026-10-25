/** Libellés et tons de la fiche de notes (workflow de validation). */

export const SHEET_STATUS = {
  draft: { label: 'En saisie', tone: 'neutral' },
  review: { label: 'En validation', tone: 'info' },
  published: { label: 'Publiée', tone: 'success' },
  unlocked: { label: 'Dépubliée pour correction', tone: 'warning' },
}

export const EVENT_LABELS = {
  submit: 'Soumise pour validation',
  approve: 'Validée',
  reject: 'Refusée',
  publish: 'Publiée',
  unpublish: 'Dépubliée',
}

export const STEP_LEVEL_LABELS = {
  program: 'Programme',
  department: 'Département',
  faculty: 'Faculté',
  institution: 'Institution',
}

export const STEP_LEVEL_ORDER = ['program', 'department', 'faculty', 'institution']

const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : dateTimeFmt.format(d)
}

/** Libellé court de l'état, ex. « En validation · étape 2/3 », « Publiée · version 2 ». */
export function sheetStatusText(sheet) {
  const base = SHEET_STATUS[sheet.status]?.label ?? sheet.status
  if (sheet.status === 'review' && sheet.step_index != null) return `${base} · étape ${sheet.step_index + 1}/${sheet.steps.length}`
  if (sheet.status === 'published' && sheet.version > 1) return `${base} · version ${sheet.version}`
  return base
}
