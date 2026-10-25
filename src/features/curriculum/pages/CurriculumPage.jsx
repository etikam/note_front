import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { BookOpen, CalendarDays, FileText, Layers, School } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAccess } from '@/features/access/model/useAccess'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { CalendarTab } from '@/features/curriculum/ui/CalendarTab'
import { CoursesTab } from '@/features/curriculum/ui/CoursesTab'
import { TeachingUnitsTab } from '@/features/curriculum/ui/TeachingUnitsTab'
import { fetchModules, fetchTeachingUnits } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { PedagogyLevelsSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyLevelsSection'
import { PedagogyMaquetteSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyMaquetteSection'
import { TeachingUnitCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitCreateModal'
import { TeachingUnitDetailModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitDetailModal'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { StatusPill } from '@/shared/ui/StatusPill'
import { Tabs } from '@/shared/ui/Tabs'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

/** Maquette (document) + ouverture des UE depuis la maquette. */
function MaquetteTab({ academicYearId, academicYearLabel, programId, canEdit }) {
  const [units, setUnits] = useState([])
  const [modules, setModules] = useState([])
  const [detail, setDetail] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    if (!academicYearId) return
    const [u, m] = await Promise.all([fetchTeachingUnits({ ...(programId ? { program: programId } : {}) }), fetchModules(academicYearId)])
    setUnits(u)
    setModules(m)
  }, [academicYearId, programId])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const refresh = async () => {
    await load()
    setReloadKey((k) => k + 1)
  }

  return (
    <>
      <PedagogyMaquetteSection
        key={programId || 'all'}
        yearFocusId={academicYearId ? Number(academicYearId) : null}
        yearFocusLabel={academicYearLabel}
        canStructure={canEdit}
        unitsForOfferSelect={units}
        reloadKey={reloadKey}
        onCreateTeachingUnit={() => setCreateOpen(true)}
        onOpenTeachingUnit={(unit, tier = 'offered') => setDetail({ unit, tier })}
      />
      <TeachingUnitCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refresh} />
      <TeachingUnitDetailModal
        open={detail != null}
        onClose={() => setDetail(null)}
        unit={detail?.unit ?? null}
        tier={detail?.tier ?? 'catalog'}
        academicYearId={academicYearId ? Number(academicYearId) : null}
        canStructure={canEdit}
        modules={modules}
        unitsForOfferSelect={units}
        onOfferSaved={refresh}
      />
    </>
  )
}

/**
 * Référentiel académique : calendrier (années, modules), UE et leur offre, cours, maquette
 * et niveaux — sur le programme choisi et l'année du sélecteur global.
 */
export default function CurriculumPage() {
  const access = useAccess()
  const canCalendar = access.canGlobal('calendar.manage')
  const canCurriculum = access.canManage('curriculum.manage')
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [params, setParams] = useSearchParams()
  const scopeOptions = useScopeOptions('curriculum.manage', { enabled: canCurriculum })
  const programId = params.get('program') ?? ''

  const tabs = useMemo(
    () =>
      [
        canCurriculum && { id: 'ue', label: 'UE & offre', icon: Layers },
        canCurriculum && { id: 'courses', label: 'Cours', icon: BookOpen },
        canCurriculum && { id: 'maquette', label: 'Maquette', icon: FileText },
        canCurriculum && { id: 'levels', label: 'Niveaux', icon: School },
        canCalendar && { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
      ].filter(Boolean),
    [canCurriculum, canCalendar],
  )
  const requested = params.get('tab')
  const tab = tabs.find((t) => t.id === requested)?.id ?? tabs[0]?.id

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(params)
      for (const [k, v] of Object.entries(changes)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  // Périmètre réduit à un programme : il est imposé.
  useEffect(() => {
    if (scopeOptions.loading || programId) return
    const locked = defaultScope(scopeOptions)
    if (locked.programId) update({ program: locked.programId })
  }, [scopeOptions, programId, update])

  if (!tabs.length) return <Navigate to="/teacher/my-courses" replace />

  const programLabel = programId ? scopeOptions.programById.get(Number(programId)) : null
  const showProgram = tab !== 'calendar' && tab !== 'levels'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        breadcrumbs={[{ label: 'Pédagogie' }, { label: 'Référentiel' }, { label: tabs.find((t) => t.id === tab)?.label ?? '' }]}
        title="Référentiel académique"
        description="Le programme d’études : unités d’enseignement et leurs crédits, cours offerts par module, maquette, niveaux et calendrier."
        meta={
          <>
            {academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
            {programLabel ? <StatusPill tone="neutral" dot={false}>{programLabel.code} — {programLabel.name}</StatusPill> : null}
          </>
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--app-border)]">
        <Tabs className="border-b-0" value={tab} onChange={(id) => update({ tab: id })} tabs={tabs} ariaLabel="Sections du référentiel" />
        {showProgram && canCurriculum ? (
          <div className={cn('pb-2')}>
            <ScopeSelect
              className={cn(SELECT, 'max-w-[16rem]')}
              options={scopeOptions}
              departmentId=""
              programId={programId}
              onChange={({ programId: p }) => update({ program: p })}
              allLabel="Tous les programmes"
            />
          </div>
        ) : null}
      </div>

      {!academicYearId && tab !== 'calendar' ? (
        <SectionCard>
          <EmptyState title="Aucune année académique" description="Créez ou choisissez l’année en cours (onglet Calendrier) pour construire l’offre." />
        </SectionCard>
      ) : tab === 'ue' ? (
        <TeachingUnitsTab academicYearId={academicYearId} academicYearLabel={academicYearLabel} programId={programId} canEdit={canCurriculum} />
      ) : tab === 'courses' ? (
        <CoursesTab academicYearId={academicYearId} programId={programId} />
      ) : tab === 'maquette' ? (
        <MaquetteTab academicYearId={academicYearId} academicYearLabel={academicYearLabel} programId={programId} canEdit={canCurriculum} />
      ) : tab === 'levels' ? (
        <PedagogyLevelsSection canStructure={canCurriculum} />
      ) : (
        <CalendarTab canEdit={canCalendar} />
      )}
    </div>
  )
}
