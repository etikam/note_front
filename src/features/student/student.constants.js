export const ENROLLMENT_STATUS_UI = {
  pending: {
    label: 'En attente',
    className:
      'border border-secondary-500/35 bg-secondary-500/10 text-secondary-800 dark:border-secondary-400/30 dark:bg-secondary-400/10 dark:text-secondary-300',
  },
  approved: {
    label: 'Approuvée',
    className:
      'border border-[#10b981]/40 bg-[#10b981]/14 text-[#047857] dark:border-[#34d399]/35 dark:bg-[#10b981]/18 dark:text-[#a7f3d0]',
  },
  rejected: {
    label: 'Rejetée',
    className:
      'border border-[#ef4444]/35 bg-[#ef4444]/10 text-[#b91c1c] dark:border-[#f87171]/30 dark:bg-[#ef4444]/12 dark:text-[#fecaca]',
  },
}

export const GRADE_STATUS_UI = {
  PASSED: { label: 'Validé', className: 'border border-emerald-500/35 bg-emerald-500/10 text-emerald-800' },
  DEBT: { label: 'Dette', className: 'border border-amber-500/35 bg-amber-500/10 text-amber-900' },
  NEEDS_MAKEUP: { label: 'Rattrapage', className: 'border border-orange-500/35 bg-orange-500/10 text-orange-900' },
}

export const STUDENT_BADGE =
  'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide'
