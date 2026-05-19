import { useId } from 'react'
import { BookOpen, X } from 'lucide-react'

import { CourseEditForm } from '@/features/teacherFacultyDashboard/pedagogy/ui/CourseEditForm'
import { cn } from '@/shared/lib/cn'

/**
 * @param {{
 *   open: boolean
 *   courseId: string | null
 *   onClose: () => void
 *   onSaved: () => void
 *   canStructure: boolean
 *   modules: Array<{ id: number; number: number; start_date?: string; end_date?: string; academic_year_label?: string }>
 *   teachingUnits: Array<{ id: number; code: string; name: string }>
 *   overlayClassName?: string
 * }} props
 */
export function CourseDetailModal({
  open,
  courseId,
  onClose,
  onSaved,
  canStructure,
  modules,
  teachingUnits,
  overlayClassName = 'z-[120]',
}) {
  const titleId = useId()

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]',
        overlayClassName,
      )}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2 border-b border-zinc-200/80 dark:border-[var(--app-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-500/15 text-secondary-600 dark:text-secondary-400">
              <BookOpen size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                Détail du cours
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[var(--app-nav-hover)] dark:text-zinc-400 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <CourseEditForm
            courseId={courseId}
            active={open && Boolean(courseId)}
            canStructure={canStructure}
            modules={modules}
            teachingUnits={teachingUnits}
            onSaved={() => {
              onSaved()
              onClose()
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
