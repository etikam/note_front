/** Taille de page par défaut (alignée backend `StandardPageNumberPagination`). */
export const PAGE_SIZE = 20

/** Options « lignes par page » (query `page_size`). */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** Libellés + classes badges statut dossier */
export const STATUS_UI = {
  ACTIVE: {
    label: 'Inscrit',
    className:
      'border border-[#10b981]/40 bg-[#10b981]/14 text-[#047857] dark:border-[#34d399]/35 dark:bg-[#10b981]/18 dark:text-[#a7f3d0]',
  },
  INACTIVE: {
    label: 'En attente',
    className:
      'border border-secondary-500/35 bg-secondary-500/10 text-secondary-800 dark:border-secondary-400/30 dark:bg-secondary-400/10 dark:text-secondary-300',
  },
  SUSPENDED: {
    label: 'Suspendu',
    className:
      'border border-orange-600/40 bg-orange-500/12 text-orange-900 dark:border-orange-400/35 dark:bg-orange-400/10 dark:text-orange-200',
  },
  EXCLUDED: {
    label: 'Exclu',
    className:
      'border border-[#ef4444]/35 bg-[#ef4444]/10 text-[#b91c1c] dark:border-[#f87171]/30 dark:bg-[#ef4444]/12 dark:text-[#fecaca]',
  },
  COMPLETED: {
    label: 'Terminé',
    className:
      'border border-zinc-300/80 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400',
  },
}

export const BADGE =
  'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide'

export function buildParams({
  page,
  pageSize = PAGE_SIZE,
  ordering = '-created_at',
  debouncedQ,
  departmentId,
  levelId,
  status,
  filterAcademicYearId,
  cohorteId,
}) {
  return {
    page,
    page_size: pageSize,
    ordering,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(departmentId ? { department: departmentId } : {}),
    ...(levelId ? { level: levelId } : {}),
    ...(status ? { status } : {}),
    ...(filterAcademicYearId ? { academic_year: filterAcademicYearId } : {}),
    ...(cohorteId ? { cohorte: cohorteId } : {}),
  }
}
