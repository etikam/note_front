import { cn } from '@/shared/lib/cn'

/** Bloc de chargement animé (respecte ``prefers-reduced-motion``). */
export function Skeleton({ className }) {
  return <span aria-hidden className={cn('ds-skeleton block rounded-md', className)} />
}

/** Plusieurs lignes de texte simulées. */
export function SkeletonLines({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Chargement">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
