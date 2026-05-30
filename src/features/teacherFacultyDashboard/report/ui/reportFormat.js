/** Formatage numérique pour le tableau de rapport détaillé. */

export function fmtInt(value) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function fmtPct(value) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`
}
