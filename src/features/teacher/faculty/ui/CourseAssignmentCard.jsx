import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Unlink } from 'lucide-react'

import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'

/**
 * @param {{
 *   row: Record<string, unknown>
 *   detailHref: string
 *   onRequestUnassign: (courseId: string) => void
 *   unassignBusy?: boolean
 * }} props
 */
export function CourseAssignmentCard({ row, detailHref, onRequestUnassign, unassignBusy }) {
  const id = String(row.id ?? '')
  const code = row.code != null ? String(row.code) : '—'
  const name = row.name != null ? String(row.name) : '—'
  const dept = row.department_code != null ? String(row.department_code) : '—'
  const sem = row.module_label != null ? String(row.module_label) : '—'
  const teacher = row.teacher_name != null ? String(row.teacher_name) : '—'
  const mat = row.teacher_matricule != null ? String(row.teacher_matricule) : ''
  const credits = row.credits != null ? String(row.credits) : '—'

  return (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden border-l-[3px] border-l-brand-500',
        'transition-shadow duration-200 hover:shadow-md',
      )}
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400">{code}</p>
            <h3 className="mt-1 font-heading text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {name}
            </h3>
          </div>
          <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-brand-950/50 dark:text-zinc-200">
            {credits} cr.
          </span>
        </div>

        <dl className="mb-4 flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500 dark:text-zinc-500">Département</dt>
            <dd className="font-medium text-zinc-800 dark:text-zinc-200">{dept}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500 dark:text-zinc-500">Semestre</dt>
            <dd className="text-right text-xs leading-snug text-zinc-700 dark:text-zinc-300">{sem}</dd>
          </div>
          <div className="rounded-lg border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,white)] px-3 py-2 dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,black)]">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
              Enseignant
            </dt>
            <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{teacher}</dd>
            {mat ? <dd className="font-mono text-[11px] text-zinc-500">{mat}</dd> : null}
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--app-border)] pt-4">
          <Link
            to={detailHref}
            className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-[var(--app-nav-hover)] dark:text-zinc-100"
          >
            <BookOpen size={15} aria-hidden />
            Détails
            <ChevronRight size={16} className="opacity-60" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={unassignBusy}
            onClick={() => onRequestUnassign(id)}
            className="text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Unlink size={14} aria-hidden />
            Retirer
          </Button>
        </div>
      </div>
    </Card>
  )
}
