import { useEffect, useMemo, useState } from 'react'



import { fetchDepartments } from '@/features/academicYear/api/academicsApi'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'

import { fetchCoursesList } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'

import { Select } from '@/shared/ui/Field'

import { cn } from '@/shared/lib/cn'



const SEMESTER_OPTIONS = [

  { value: '1', label: 'S1' },

  { value: '2', label: 'S2' },

  { value: '3', label: 'S3' },

  { value: '4', label: 'S4' },

  { value: '5', label: 'S5' },

  { value: '6', label: 'S6' },

]



/**

 * @param {{

 *   departmentId: string

 *   onDepartmentIdChange: (v: string) => void

 *   semester: string

 *   onSemesterChange: (v: string) => void

 *   courseId: string

 *   onCourseIdChange: (v: string) => void

 *   onCourseMetaChange?: (meta: { code?: string, name?: string } | null) => void

 *   disabled?: boolean

 * }} props

 */

export function GradeImportCourseSelector({

  departmentId,

  onDepartmentIdChange,

  semester,

  onSemesterChange,

  courseId,

  onCourseIdChange,

  onCourseMetaChange,

  disabled = false,

}) {

  const { academicYearId, academicYears } = useAcademicYear()

  const [departments, setDepartments] = useState([])

  const [courses, setCourses] = useState([])

  const [coursesLoading, setCoursesLoading] = useState(false)

  const [courseSearch, setCourseSearch] = useState('')



  const academicYearLabel = useMemo(() => {

    const ay = academicYears.find((a) => String(a.id) === String(academicYearId))

    return ay?.year ?? '—'

  }, [academicYears, academicYearId])



  useEffect(() => {

    let cancelled = false

    fetchDepartments()

      .then((list) => {

        if (!cancelled) setDepartments(list)

      })

      .catch(() => {

        if (!cancelled) setDepartments([])

      })

    return () => {

      cancelled = true

    }

  }, [])



  useEffect(() => {

    if (!departmentId || !semester || !academicYearId) {

      setCourses([])

      onCourseIdChange('')

      onCourseMetaChange?.(null)

      return

    }

    let cancelled = false

    setCoursesLoading(true)

    const q = courseSearch.trim()

    fetchCoursesList({

      department_id: departmentId,

      academic_year_id: academicYearId,

      semester,

      page_size: 500,

      ...(q.length >= 2 ? { search: q } : {}),

    })

      .then((payload) => {

        if (!cancelled) {

          setCourses(payload.results ?? [])

        }

      })

      .catch(() => {

        if (!cancelled) setCourses([])

      })

      .finally(() => {

        if (!cancelled) setCoursesLoading(false)

      })

    return () => {

      cancelled = true

    }

  }, [departmentId, semester, academicYearId, courseSearch, onCourseIdChange, onCourseMetaChange])



  useEffect(() => {

    onCourseIdChange('')

    onCourseMetaChange?.(null)

    setCourseSearch('')

  }, [departmentId, semester, academicYearId, onCourseIdChange, onCourseMetaChange])



  useEffect(() => {

    if (!courseId) {

      onCourseMetaChange?.(null)

      return

    }

    const c = courses.find((x) => String(x.id) === String(courseId))

    if (c) {

      onCourseMetaChange?.({ code: c.code, name: c.name })

    }

  }, [courseId, courses, onCourseMetaChange])



  const fieldClass =

    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)]'



  return (

    <div className="space-y-4">

      <div

        className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"

        role="note"

      >

        <p className="font-semibold">Inscription automatique</p>

        <p className="mt-1 text-[13px] leading-relaxed">

          Les étudiants figurant dans le fichier seront inscrits au cours sélectionné s’ils ne le sont pas déjà.

          Cette opération <strong>ne vérifie pas les règles d’éligibilité</strong> au cours (prérequis, niveau, etc.).

        </p>

      </div>



      <div className="grid gap-4 sm:grid-cols-2">

        <label className="block text-sm">

          <span className="mb-1.5 block font-medium text-zinc-700 dark:text-zinc-300">Département</span>

          <Select

            className={fieldClass}

            value={departmentId}

            disabled={disabled}

            onChange={(e) => onDepartmentIdChange(e.target.value)}

          >

            <option value="">— Choisir —</option>

            {departments.map((d) => (

              <option key={d.id} value={String(d.id)}>

                {d.code} — {d.name}

              </option>

            ))}

          </Select>

        </label>



        <label className="block text-sm">

          <span className="mb-1.5 block font-medium text-zinc-700 dark:text-zinc-300">Année académique</span>

          <span

            className={cn(

              fieldClass,

              'inline-flex items-center text-zinc-600 dark:text-zinc-400',

            )}

          >

            {academicYearLabel}

          </span>

          <span className="mt-1 block text-xs text-zinc-500">Modifiable via le sélecteur global en haut de page.</span>

        </label>



        <label className="block text-sm">

          <span className="mb-1.5 block font-medium text-zinc-700 dark:text-zinc-300">Semestre (parcours)</span>

          <Select

            className={fieldClass}

            value={semester}

            disabled={disabled}

            onChange={(e) => onSemesterChange(e.target.value)}

          >

            <option value="">— Choisir —</option>

            {SEMESTER_OPTIONS.map((o) => (

              <option key={o.value} value={o.value}>

                {o.label}

              </option>

            ))}

          </Select>

        </label>



        <label className="block text-sm">

          <span className="mb-1.5 block font-medium text-zinc-700 dark:text-zinc-300">Rechercher un cours</span>

          <input

            type="search"

            className={fieldClass}

            placeholder="Code ou intitulé (min. 2 car.)"

            value={courseSearch}

            disabled={disabled || !departmentId || !semester}

            onChange={(e) => setCourseSearch(e.target.value)}

          />

        </label>



        <label className="block text-sm sm:col-span-2">

          <span className="mb-1.5 block font-medium text-zinc-700 dark:text-zinc-300">Cours</span>

          <Select

            className={fieldClass}

            value={courseId}

            disabled={disabled || !departmentId || !semester || coursesLoading}

            onChange={(e) => onCourseIdChange(e.target.value)}

          >

            <option value="">

              {coursesLoading ? 'Chargement…' : '— Choisir un cours —'}

            </option>

            {courses.map((c) => (

              <option key={c.id} value={String(c.id)}>

                {c.code} — {c.name}

              </option>

            ))}

          </Select>

          {!coursesLoading && courses.length === 0 && departmentId && semester ? (

            <span className="mt-1 block text-xs text-zinc-500">Aucun cours trouvé pour ces filtres.</span>

          ) : null}

        </label>

      </div>

    </div>

  )

}


