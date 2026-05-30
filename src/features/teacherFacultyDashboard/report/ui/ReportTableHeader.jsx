import { cn } from '@/shared/lib/cn'

const thBase =
  'border border-[var(--app-border)] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--app-fg)]'
const thGroup = 'bg-brand-600/90 text-white dark:bg-brand-700'
const thSub = 'bg-[color-mix(in_srgb,var(--app-elevated)_92%,var(--app-canvas))] text-[var(--app-muted)]'
const thDebt = 'bg-secondary-500/15 text-secondary-900 dark:text-secondary-100'

/** En-têtes groupés du tableau de rapport détaillé (3 lignes). */
export function ReportTableHeader() {
  return (
    <thead>
      <tr>
        <th rowSpan={3} className={cn(thBase, thGroup, 'min-w-[140px] text-left align-bottom')}>
          Niveau
        </th>
        <th colSpan={3} className={cn(thBase, thGroup)}>
          Total inscrits
        </th>
        <th colSpan={3} className={cn(thBase, thGroup)}>
          Effectif évalué
        </th>
        <th colSpan={4} className={cn(thBase, thGroup)}>
          Admis
        </th>
        <th colSpan={5} className={cn(thBase, thDebt)}>
          Admis avec dette
        </th>
        <th colSpan={2} className={cn(thBase, thGroup)}>
          Abandon
        </th>
      </tr>
      <tr>
        <th colSpan={2} className={cn(thBase, thSub)}>
          Effectif
        </th>
        <th rowSpan={2} className={cn(thBase, thSub)}>
          Total
        </th>
        <th colSpan={2} className={cn(thBase, thSub)}>
          Effectif
        </th>
        <th rowSpan={2} className={cn(thBase, thSub)}>
          Total
        </th>
        <th colSpan={2} className={cn(thBase, thSub)}>
          Nombre
        </th>
        <th colSpan={2} className={cn(thBase, thSub)}>
          Pourcentage
        </th>
        <th className={cn(thBase, thDebt)}>1</th>
        <th className={cn(thBase, thDebt)}>2</th>
        <th className={cn(thBase, thDebt)}>3</th>
        <th className={cn(thBase, thDebt)}>4</th>
        <th className={cn(thBase, thDebt)}>≥5</th>
        <th colSpan={2} className={cn(thBase, thSub)}>
          Effectif
        </th>
      </tr>
      <tr>
        <th className={cn(thBase, thSub)}>Fille</th>
        <th className={cn(thBase, thSub)}>Garçon</th>
        <th className={cn(thBase, thSub)}>Fille</th>
        <th className={cn(thBase, thSub)}>Garçon</th>
        <th className={cn(thBase, thSub)}>Total</th>
        <th className={cn(thBase, thSub)}>Fille</th>
        <th className={cn(thBase, thSub)}>Total</th>
        <th className={cn(thBase, thSub)}>Fille</th>
        <th className={cn(thBase, thDebt)}>Dette</th>
        <th className={cn(thBase, thDebt)}>Dettes</th>
        <th className={cn(thBase, thDebt)}>Dettes</th>
        <th className={cn(thBase, thDebt)}>Dettes</th>
        <th className={cn(thBase, thDebt)}>Dettes</th>
        <th className={cn(thBase, thSub)}>Total</th>
        <th className={cn(thBase, thSub)}>Fille</th>
      </tr>
    </thead>
  )
}
