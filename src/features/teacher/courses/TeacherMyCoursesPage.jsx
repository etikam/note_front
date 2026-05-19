import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, GraduationCap, Layers } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { fetchCoursesList } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

/** @param {{ course: Record<string, unknown> }} props */
function TeacherCourseMiniCard({ course: c }) {
  const credits = c.credits != null ? Number(c.credits) : null
  const title = [c.code, c.name].filter(Boolean).join(' — ')
  return (
    <Link
      to={`/teacher/courses/${c.id}`}
      aria-label={title ? `Ouvrir le cours ${title}` : 'Ouvrir le détail du cours'}
      className={cn(
        'group relative flex min-h-[7.5rem] flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-[var(--app-elevated)] p-3.5 shadow-sm',
        'dark:border-[var(--app-border)]',
        'transition-[border-color,box-shadow,transform] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-brand-400/45 hover:shadow-md dark:hover:border-brand-500/35',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-canvas)]',
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-secondary-500 to-brand-600 opacity-90"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center rounded-md bg-brand-500/[0.12] px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-brand-800 dark:bg-brand-400/15 dark:text-brand-100">
          {c.code ?? '—'}
        </span>
        <ChevronRight
          size={18}
          strokeWidth={2}
          className="shrink-0 text-zinc-300 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-zinc-600"
          aria-hidden
        />
      </div>
      <p className="mt-2.5 line-clamp-2 min-h-[2.5rem] text-left text-[0.9375rem] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
        {c.name ?? '—'}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-zinc-200/80 bg-zinc-50/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400">
          <Layers size={11} strokeWidth={2} className="shrink-0 opacity-70" aria-hidden />
          <span className="truncate font-mono tabular-nums">{c.teaching_unit_code ?? '—'}</span>
        </span>
        {c.level_name ? (
          <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-zinc-200/80 bg-zinc-50/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400">
            <GraduationCap size={11} strokeWidth={2} className="shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{String(c.level_name)}</span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200/80 bg-zinc-50/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400">
          <BookOpen size={11} strokeWidth={2} className="shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{c.module_label ?? '—'}</span>
          {c.semester != null ? (
            <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-500">· S{c.semester}</span>
          ) : null}
        </span>
        {credits != null && !Number.isNaN(credits) ? (
          <span className="ml-auto inline-flex rounded-md bg-secondary-500/12 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-secondary-800 dark:bg-secondary-400/15 dark:text-secondary-100">
            {credits} cr.
          </span>
        ) : null}
      </div>
      {c.teaching_unit_name ? (
        <p className="mt-1.5 line-clamp-1 text-left text-[10px] leading-tight text-zinc-500 dark:text-zinc-500">{c.teaching_unit_name}</p>
      ) : null}
    </Link>
  )
}

export function TeacherMyCoursesPage() {
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!academicYearId) {
      setRows([])
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await fetchCoursesList({
          academic_year_id: academicYearId,
          page: 1,
          page_size: 500,
          ordering: 'name',
          assigned_teacher_only: 1,
        })
        if (!cancelled) setRows(data.results ?? [])
      } catch (err) {
        if (!cancelled) {
          setRows([])
          dispatchToast({ type: 'error', message: err?.message ?? 'Impossible de charger vos cours.' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [academicYearId])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) =>
      [c.code, c.name, c.teaching_unit_code, c.teaching_unit_name, c.level_name, c.module_label]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [rows, search])

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Mes cours</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cours qui vous sont assignés pour l’année académique{' '}
          <strong className="text-zinc-700 dark:text-zinc-200">{academicYearLabel ?? '—'}</strong>.
        </p>
      </div>

      <Card className="border-zinc-300/90 dark:border-[var(--app-border)]">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Recherche</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code, matière, UE, niveau..."
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
            />
          </label>
          <div className="flex items-end justify-end">
            <span className="text-xs text-zinc-500">{filteredRows.length} cours</span>
          </div>
        </div>
      </Card>

      {!academicYearId ? (
        <Card className="p-8 border border-zinc-200/90 dark:border-[var(--app-border)] text-center text-sm text-zinc-500">
          Sélectionnez d’abord une année académique via le sélecteur global.
        </Card>
      ) : loading ? (
        <div className="flex min-h-[25vh] items-center justify-center">
          <Spinner label="Chargement de vos cours" />
        </div>
      ) : (
        <Card className="border border-zinc-200/90 p-4 shadow-sm dark:border-[var(--app-border)] sm:p-5">
          {filteredRows.length === 0 ? (
            <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_94%,black)]">
              <BookOpen className="h-10 w-10 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} aria-hidden />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aucun cours assigné</p>
              <p className="max-w-sm text-xs text-zinc-500 dark:text-zinc-500">
                Ajustez la recherche ou vérifiez l’année académique sélectionnée.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRows.map((c) => (
                <li key={c.id}>
                  <TeacherCourseMiniCard course={c} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
