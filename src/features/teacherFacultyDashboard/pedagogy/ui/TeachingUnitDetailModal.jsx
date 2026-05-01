import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'

import { fetchCoursesList } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { CourseOfferingFormBlock } from '@/features/teacherFacultyDashboard/pedagogy/ui/CourseOfferingFormBlock'
import { PedagogyModalFrame } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyModalFrame'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   unit: { id: number; code: string; name: string; total_credits?: number } | null
 *   tier: 'offered' | 'catalog'
 *   academicYearId: number | null
 *   canStructure: boolean
 *   semesters: Array<{ id: number; number: number; start_date?: string; end_date?: string; academic_year_label?: string }>
 *   unitsForOfferSelect: Array<{ id: number; code: string; name: string; total_credits?: number }>
 *   onOfferSaved?: () => void | Promise<void>
 * }} props
 */
export function TeachingUnitDetailModal({
  open,
  onClose,
  unit,
  tier,
  academicYearId,
  canStructure,
  semesters,
  unitsForOfferSelect,
  onOfferSaved,
}) {
  const formId = useMemo(() => (unit ? `ue-matieres-${unit.id}` : 'ue-matieres'), [unit?.id])
  const [formUi, setFormUi] = useState({ submitDisabled: true, saving: false })
  const handleFormState = useCallback((s) => setFormUi(s), [])

  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesReloadKey, setCoursesReloadKey] = useState(0)

  useEffect(() => {
    if (!open || !unit) {
      setCourses([])
      setCoursesLoading(false)
      return
    }
    if (!academicYearId) {
      setCourses([])
      setCoursesLoading(false)
      return
    }
    let cancelled = false
    setCoursesLoading(true)
    ;(async () => {
      try {
        const data = await fetchCoursesList({
          academic_year_id: academicYearId,
          teaching_unit_id: unit.id,
          page: 1,
          page_size: 200,
          ordering: 'name',
        })
        if (!cancelled) setCourses(data.results ?? [])
      } catch (e) {
        if (!cancelled) {
          setCourses([])
          dispatchToast({ type: 'error', message: e?.message ?? 'Impossible de charger les cours.' })
        }
      } finally {
        if (!cancelled) setCoursesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, unit?.id, academicYearId, coursesReloadKey])

  const coursesCreditSum = useMemo(
    () => courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0),
    [courses],
  )
  const ueTotal = unit?.total_credits ?? 0

  const subtitle = useMemo(() => {
    if (!unit) return ''
    const cr = unit.total_credits ?? 0
    const base = `${cr} crédit${cr === 1 ? '' : 's'} au total · ${tier === 'catalog' ? 'catalogue (pas encore de cours sur cette année)' : 'au moins un cours sur l’année sélectionnée'}`
    return base
  }, [unit, tier])

  if (!open || !unit) return null

  return (
    <PedagogyModalFrame
        open={open}
        onClose={onClose}
        title={`${unit.code} — ${unit.name}`}
        subtitle={subtitle}
        icon={Layers}
        widthClass="max-w-4xl"
        bodyClassName="max-h-[min(78vh,720px)]"
        footer={
          canStructure ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={formUi.saving}>
                Fermer
              </Button>
              <Button type="submit" form={formId} variant="primary" disabled={formUi.submitDisabled}>
                {formUi.saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Fermer
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-6">
        {!canStructure ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Consultation seule — modification réservée aux profils autorisés.</p>
        ) : null}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Cours enregistrés sur l’année sélectionnée
            </h3>
            {coursesLoading ? <Spinner size="sm" label="Chargement des cours" /> : null}
          </div>
          {!academicYearId ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-500 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)] dark:text-zinc-400">
              Choisissez une année académique dans l’onglet « Années & semestres » pour lister les matières rattachées à
              cette UE.
            </p>
          ) : courses.length === 0 && !coursesLoading ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-500 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)] dark:text-zinc-400">
              Aucun cours sur cette année pour cette UE.
              {canStructure ? ' Ajoutez des matières avec le formulaire ci-dessous.' : ''}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200/90 dark:border-[var(--app-border)]">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/95 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)] text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <th className="py-2.5 pl-3 pr-2 font-mono">Code</th>
                    <th className="py-2.5 pr-2">Matière</th>
                    <th className="py-2.5 pr-2 w-12 text-center">Cr.</th>
                    <th className="py-2.5 pr-2">Semestre</th>
                    <th className="py-2.5 pr-2">Dépt.</th>
                    <th className="py-2.5 pr-2">Niveau</th>
                    <th className="py-2.5 pr-3 w-[5.5rem] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[var(--app-border)]">
                  {courses.map((c) => (
                    <tr key={c.id} className="bg-white/80 dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
                      <td className="py-2 pl-3 pr-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">{c.code}</td>
                      <td className="py-2 pr-2 text-zinc-900 dark:text-zinc-100">{c.name}</td>
                      <td className="py-2 pr-2 text-center tabular-nums text-zinc-600 dark:text-zinc-400">{c.credits}</td>
                      <td className="py-2 pr-2 text-xs text-zinc-500 dark:text-zinc-400">{c.semester_label ?? '—'}</td>
                      <td className="py-2 pr-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                        {c.department_code ?? '—'}
                      </td>
                      <td className="py-2 pr-2 text-xs text-zinc-500 dark:text-zinc-400">{c.level_name ?? '—'}</td>
                      <td className="py-2 pr-3 text-right">
                        <Button
                          as={Link}
                          to={`/teacher/courses/${c.id}`}
                          variant="ghost"
                          size="sm"
                          className="text-brand-600 dark:text-brand-400"
                        >
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {academicYearId && courses.length > 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Somme des crédits des cours listés :{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{coursesCreditSum}</strong> cr.
              {ueTotal > 0 ? (
                <>
                  {' '}
                  · total déclaré pour l’UE : <strong className="text-zinc-800 dark:text-zinc-200">{ueTotal}</strong> cr.
                  {coursesCreditSum !== ueTotal ? (
                    <span className="ml-1 text-amber-700 dark:text-amber-300">(écart possible, données historiques.)</span>
                  ) : null}
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        {canStructure ? (
          <CourseOfferingFormBlock
            formId={formId}
            active={open}
            semesters={semesters}
            unitsForOfferSelect={unitsForOfferSelect}
            existingCourses={courses}
            forcedUeId={unit.id}
            onStateChange={handleFormState}
            onSuccess={async () => {
              await onOfferSaved?.()
              onClose()
            }}
          />
        ) : null}
        </div>
    </PedagogyModalFrame>
  )
}
