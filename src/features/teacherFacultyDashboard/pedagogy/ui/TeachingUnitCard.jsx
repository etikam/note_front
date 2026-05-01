import { BookOpen, ChevronRight, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

/**
 * @param {{
 *   unit: { id: number; code: string; name: string; total_credits?: number }
 *   tier: 'offered' | 'catalog'
 *   canStructure: boolean
 *   onOpenDetail: () => void
 *   onRequestEdit: () => void
 *   onRequestDelete: () => void
 * }} props
 */
export function TeachingUnitCard({ unit, tier, canStructure, onOpenDetail, onRequestEdit, onRequestDelete }) {
  const credits = unit.total_credits ?? 0
  const isCatalog = tier === 'catalog'

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border shadow-md transition-all duration-200',
        'border-zinc-200/90 bg-white dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]',
        'hover:border-brand-300/80 hover:shadow-lg dark:hover:border-brand-600/80 dark:hover:shadow-brand-950/40',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-90 transition-opacity group-hover:opacity-100',
          isCatalog
            ? 'bg-[radial-gradient(ellipse_at_top_right,rgba(113,113,122,0.14),transparent_52%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(161,161,170,0.12),transparent_50%)]'
            : 'bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.14),transparent_52%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.18),transparent_50%)]',
        )}
      />
      <div className="relative flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1',
                isCatalog
                  ? 'bg-zinc-100 text-zinc-600 ring-zinc-200/80 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)] dark:text-zinc-300 dark:ring-[var(--app-border)]'
                  : 'bg-brand-50 text-brand-600 ring-brand-200/80 dark:bg-brand-900/50 dark:text-brand-300 dark:ring-brand-600/40',
              )}
            >
              <BookOpen size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    isCatalog
                      ? 'bg-zinc-100 text-zinc-600 dark:bg-[color-mix(in_srgb,var(--app-elevated)_75%,white)] dark:text-zinc-400'
                      : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
                  )}
                >
                  {isCatalog ? 'Catalogue' : 'Sur l’année'}
                </span>
                <span className="font-mono text-xs font-semibold text-brand-700 dark:text-brand-300">{unit.code}</span>
              </div>
              <h4 className="mt-1.5 font-heading text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                {unit.name}
              </h4>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
              {credits} cr.
            </span>
            {isCatalog ? (
              <span className="max-w-[10rem] text-right text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                Aucun cours sur l’année sélectionnée
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100/90 pt-3 dark:border-[var(--app-border)]">
          <Button
            type="button"
            variant="soft"
            size="sm"
            className="shadow-sm"
            onClick={onOpenDetail}
          >
            Détails
            <ChevronRight size={14} className="opacity-70" aria-hidden />
          </Button>
          {canStructure ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRequestEdit}
              aria-label={`Modifier l’UE ${unit.code}`}
            >
              <Pencil size={14} aria-hidden />
            </Button>
          ) : null}
          {canStructure ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={onRequestDelete}
              aria-label={`Supprimer l’UE ${unit.code}`}
            >
              <Trash2 size={14} aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
