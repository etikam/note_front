import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, GraduationCap, Plus, RefreshCw, Trash2 } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { fetchDepartments } from '@/features/academicYear/api/academicsApi'
import { useAuth } from '@/features/auth/model/AuthContext'
import {
  deleteAcademicYear,
  deleteSemester,
  deleteTeachingUnit,
  fetchAcademicYearsFull,
  fetchSemesters,
  fetchTeachingUnits,
  patchAcademicYear,
} from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { AcademicYearCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/AcademicYearCreateModal'
import { PedagogyCoursesSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyCoursesSection'
import { SemesterCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/SemesterCreateModal'
import { TeachingUnitCard } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitCard'
import { TeachingUnitCreateModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitCreateModal'
import { TeachingUnitDetailModal } from '@/features/teacherFacultyDashboard/pedagogy/ui/TeachingUnitDetailModal'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { PedagogyDepartmentsSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyDepartmentsSection'
import { SemesterBlockPanel } from '@/features/teacherFacultyDashboard/pedagogy/ui/SemesterBlockPanel'
import { PEDAGOGY_TAB_IDS, filterPedagogyTabsForUser } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyNav.constants'
import { PedagogyMaquetteSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyMaquetteSection'

export function PedagogyReferencePanel({ syncUrl = false }) {
  const { user } = useAuth()
  const { academicYearId, refreshAcademicYears } = useAcademicYear()
  const [searchParams, setSearchParams] = useSearchParams()
  const canCalendar = Boolean(user?.capabilities?.can_manage_academic_calendar)
  const canStructure = Boolean(user?.capabilities?.can_manage_academic_structure)
  const canViewStudents = Boolean(user?.capabilities?.can_view_students)
  const managedDeptId = user?.scope?.managed_department_id ?? null

  const sections = useMemo(() => filterPedagogyTabsForUser(user), [user])

  const [section, setSection] = useState(() => {
    if (typeof window === 'undefined') return 'calendar'
    if (!syncUrl) return 'calendar'
    const t = new URLSearchParams(window.location.search).get('tab')
    return t && PEDAGOGY_TAB_IDS.has(t) ? t : 'calendar'
  })
  const [years, setYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [units, setUnits] = useState([])
  /** UE du catalogue sans aucun cours sur l’année focalisée (complément de `units`). */
  const [unitsUnoffered, setUnitsUnoffered] = useState([])
  /** Incrémenté après une offre groupée pour rafraîchir l’onglet Cours. */
  const [coursesReloadKey, setCoursesReloadKey] = useState(0)
  const [departments, setDepartments] = useState([])

  const [yearFocusId, setYearFocusId] = useState(() => (academicYearId ? Number(academicYearId) : null))
  const [loading, setLoading] = useState(false)

  const [modalYearOpen, setModalYearOpen] = useState(false)
  const [modalSemOpen, setModalSemOpen] = useState(false)
  const [modalUeOpen, setModalUeOpen] = useState(false)
  const [editUnit, setEditUnit] = useState(null)
  const [detailUnit, setDetailUnit] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchAcademicYearsFull()
      setYears(rows)
      const yid =
        yearFocusId ?? (academicYearId ? Number(academicYearId) : null) ?? rows[0]?.id ?? null
      if (yid && !yearFocusId) setYearFocusId(yid)

      const d = await fetchDepartments()
      setDepartments(d)

      if (yid) {
        const [s, u, uu] = await Promise.all([
          fetchSemesters(yid),
          fetchTeachingUnits({ academic_year_id: yid }),
          fetchTeachingUnits({ unoffered_for_academic_year_id: yid }),
        ])
        setSemesters(s)
        setUnits(u)
        setUnitsUnoffered(uu)
      } else {
        setSemesters([])
        const u = await fetchTeachingUnits()
        setUnits(u)
        setUnitsUnoffered([])
      }
    } catch (e) {
      dispatchToast({ type: 'error', message: e?.message ?? 'Chargement impossible.' })
    } finally {
      setLoading(false)
    }
  }, [academicYearId, yearFocusId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (academicYearId == null || academicYearId === '') return
    const id = Number(academicYearId)
    if (!Number.isFinite(id)) return
    setYearFocusId((prev) => (prev === id ? prev : id))
  }, [academicYearId])

  useEffect(() => {
    if (!syncUrl) return
    const raw = searchParams.get('tab')
    const next = raw && PEDAGOGY_TAB_IDS.has(raw) ? raw : 'calendar'
    setSection((prev) => (prev === next ? prev : next))
  }, [syncUrl, searchParams])

  const setSectionFromUi = useCallback(
    (id) => {
      setSection(id)
      if (syncUrl) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set('tab', id)
            return next
          },
          { replace: true },
        )
      }
    },
    [syncUrl, setSearchParams],
  )

  const sectionIds = useMemo(() => new Set(sections.map((s) => s.id)), [sections])

  useEffect(() => {
    if (!sectionIds.has(section)) {
      const first = sections[0]?.id
      if (first) setSectionFromUi(first)
    }
  }, [section, sectionIds, sections, setSectionFromUi])

  const unitsForOfferSelect = useMemo(() => {
    const m = new Map()
    for (const u of units) m.set(u.id, u)
    for (const u of unitsUnoffered) m.set(u.id, u)
    return Array.from(m.values()).sort((a, b) => String(a.code).localeCompare(String(b.code)))
  }, [units, unitsUnoffered])

  const refreshTeachingUnitLists = useCallback(async () => {
    const yid = yearFocusId ?? (academicYearId ? Number(academicYearId) : null)
    if (yid) {
      const [u, uu] = await Promise.all([
        fetchTeachingUnits({ academic_year_id: yid }),
        fetchTeachingUnits({ unoffered_for_academic_year_id: yid }),
      ])
      setUnits(u)
      setUnitsUnoffered(uu)
    } else {
      setUnits(await fetchTeachingUnits())
      setUnitsUnoffered([])
    }
  }, [yearFocusId, academicYearId])

  const yearFocusRow = useMemo(() => years.find((y) => y.id === yearFocusId) ?? null, [years, yearFocusId])
  const yearFocusLabel = yearFocusRow?.year ?? null

  return (
    <div className="flex flex-col gap-6 transition-opacity duration-200">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col overflow-hidden rounded-xl bg-brand-600 shadow-sm ring-1 ring-brand-700/30 dark:bg-brand-600 dark:ring-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1" role="tablist" aria-label="Sections Académie">
            <div className="-mb-px flex flex-wrap divide-x divide-secondary-400/50 px-1 sm:px-2">
              {sections.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={section === s.id}
                    onClick={() => setSectionFromUi(s.id)}
                    className={cn(
                      'inline-flex min-w-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold tracking-tight transition-colors duration-200 outline-none sm:px-4',
                      'rounded-t-md focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600',
                      section === s.id
                        ? 'border-secondary-400 text-secondary-50 shadow-[inset_0_-8px_12px_-10px_rgba(249,115,22,0.35)] dark:border-secondary-300 dark:text-secondary-50'
                        : 'border-transparent text-secondary-200/95 hover:border-secondary-400/55 hover:text-secondary-50 dark:text-secondary-200/90',
                    )}
                  >
                    <Icon size={17} strokeWidth={2} aria-hidden />
                    <span className="truncate">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex shrink-0 justify-end border-t border-secondary-400/40 px-2 py-2 sm:border-l sm:border-t-0 sm:border-secondary-400/50 sm:py-2 sm:pr-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="border-secondary-400/35 text-secondary-100 hover:border-secondary-300/60 hover:bg-secondary-500/25 hover:text-secondary-50 focus-visible:ring-secondary-300 focus-visible:ring-offset-brand-600 disabled:text-secondary-200/50"
              onClick={() => loadAll()}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {!canCalendar && !canStructure && (section === 'calendar' || section === 'ue' || section === 'courses' || section === 'maquette') ? (
        <p className="rounded-lg border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_96%,var(--app-canvas))] px-3 py-2 text-sm text-[var(--app-muted)] dark:bg-white/[0.03]">
          Consultation du référentiel : connectez-vous avec un profil autorisé pour modifier les données.
        </p>
      ) : null}

      {section === 'calendar' ? (
        <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border border-[var(--app-border)] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-[var(--app-fg)]">
                <GraduationCap size={18} aria-hidden />
                Années académiques
              </h3>
              {canCalendar ? (
                <Button type="button" variant="primary" size="sm" className="shrink-0 shadow-sm" onClick={() => setModalYearOpen(true)}>
                  <Plus size={14} aria-hidden />
                  Nouvelle année
                </Button>
              ) : null}
            </div>
            <div className="mt-3 max-h-56 overflow-y-auto divide-y divide-[var(--app-border)] text-sm">
              {years.map((y) => (
                <div key={y.id} className="py-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className={cn(
                      'text-left font-medium hover:text-brand-600 dark:hover:text-brand-300',
                      yearFocusId === y.id && 'text-brand-600 dark:text-brand-300',
                    )}
                    onClick={() => setYearFocusId(y.id)}
                  >
                    {y.year}
                    {y.is_current ? (
                      <span className="ml-2 text-[10px] uppercase text-brand-600 dark:text-brand-400">courante</span>
                    ) : null}
                  </button>
                  {canCalendar ? (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await patchAcademicYear(y.id, { is_current: true })
                            dispatchToast({ type: 'success', message: 'Année courante mise à jour.' })
                            await loadAll()
                            await refreshAcademicYears?.()
                          } catch (err) {
                            dispatchToast({ type: 'error', message: err?.message ?? 'Erreur.' })
                          }
                        }}
                      >
                        Courante
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() =>
                          setConfirmDelete({
                            title: `Supprimer l’année ${y.year} ?`,
                            message: 'Cette action est définitive lorsque le serveur l’autorise.',
                            confirmLabel: 'Supprimer',
                            action: async () => {
                              try {
                                await deleteAcademicYear(y.id)
                                dispatchToast({ type: 'success', message: 'Année supprimée.' })
                                await loadAll()
                                await refreshAcademicYears?.()
                              } catch (err) {
                                dispatchToast({
                                  type: 'error',
                                  message: err?.response?.data?.detail ?? err?.message ?? 'Erreur.',
                                })
                                throw err
                              }
                            },
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border border-[var(--app-border)] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-[var(--app-fg)]">
                <CalendarDays size={18} aria-hidden />
                Semestres calendaires
              </h3>
              {canCalendar && yearFocusId ? (
                <Button type="button" variant="primary" size="sm" className="shrink-0 shadow-sm" onClick={() => setModalSemOpen(true)}>
                  <Plus size={14} aria-hidden />
                  Nouveau semestre
                </Button>
              ) : null}
            </div>
            {!yearFocusId ? (
              <p className="mt-3 text-sm text-[var(--app-muted)]">Sélectionnez une année à gauche.</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  Périodes S1/S2 dans l’année (dates) — distinctes du parcours licence S1–S6 ci-dessous.
                </p>
                <ul className="mt-3 space-y-2 text-sm max-h-48 overflow-y-auto">
                  {semesters.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] py-1">
                      <span>
                        S{s.number} — {s.start_date} → {s.end_date}
                      </span>
                      {canCalendar ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() =>
                            setConfirmDelete({
                              title: 'Supprimer ce semestre ?',
                              message: 'Impossible si des cours ou offres y sont encore rattachés.',
                              confirmLabel: 'Supprimer',
                              action: async () => {
                                try {
                                  await deleteSemester(s.id)
                                  dispatchToast({ type: 'success', message: 'Semestre supprimé.' })
                                  setSemesters(await fetchSemesters(yearFocusId))
                                } catch (err) {
                                  dispatchToast({
                                    type: 'error',
                                    message: err?.response?.data?.detail ?? err?.message ?? 'Erreur.',
                                  })
                                  throw err
                                }
                              },
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
        <SemesterBlockPanel
          academicYearId={yearFocusId}
          academicYearLabel={yearFocusLabel}
          activeSemesterParity={yearFocusRow?.active_semester_parity ?? null}
          canCalendar={canCalendar}
          onUpdated={loadAll}
        />
        </div>
      ) : null}

      {section === 'ue' ? (
        <div className="space-y-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <h3 className="font-heading text-lg font-semibold text-[var(--app-fg)]">Unités d’enseignement</h3>
              {yearFocusId ? (
                <p className="mt-1.5 text-sm text-[var(--app-muted)]">
                  Filtre sur l’année choisie dans l’onglet « Années & semestres » : cartes « Sur l’année » vs « Catalogue »
                  (pas encore de cours sur cette année). Ouvrez <strong className="font-semibold text-[var(--app-fg)]">Détails</strong>{' '}
                  pour déposer une offre de cours et répartir les crédits en plusieurs matières.
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-[var(--app-muted)]">
                  Sélectionnez une année dans l’onglet calendrier pour distinguer l’offre du catalogue.
                </p>
              )}
            </div>
            {canStructure ? (
              <Button type="button" variant="primary" size="sm" className="shrink-0 shadow-sm" onClick={() => setModalUeOpen(true)}>
                <Plus size={14} aria-hidden />
                Nouvelle UE
              </Button>
            ) : null}
          </div>

          <section className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
              UE avec au moins un cours sur l’année
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {units.length === 0 ? (
                <p className="col-span-full rounded-xl border border-dashed border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] px-4 py-8 text-center text-sm text-[var(--app-muted)] dark:bg-white/[0.03]">
                  Aucune UE avec des cours sur cette année.
                </p>
              ) : (
                units.map((u) => (
                  <TeachingUnitCard
                    key={u.id}
                    unit={u}
                    tier="offered"
                    canStructure={canStructure}
                    onOpenDetail={() => setDetailUnit({ unit: u, tier: 'offered' })}
                    onRequestEdit={() => setEditUnit(u)}
                    onRequestDelete={() =>
                      setConfirmDelete({
                        title: `Supprimer l’UE ${u.code} ?`,
                        message:
                          'Cette suppression est en cascade : tous les cours (matières) rattachés à cette UE seront aussi supprimés, ainsi que leurs archives.',
                        confirmLabel: 'Supprimer',
                        action: async () => {
                          try {
                            await deleteTeachingUnit(u.id)
                            dispatchToast({ type: 'success', message: 'UE supprimée.' })
                            await refreshTeachingUnitLists()
                          } catch (err) {
                            dispatchToast({
                              type: 'error',
                              message: err?.response?.data?.detail ?? err?.message ?? 'Erreur.',
                            })
                            throw err
                          }
                        },
                      })
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
              Catalogue : sans cours sur cette année
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {unitsUnoffered.length === 0 ? (
                <p className="col-span-full rounded-xl border border-dashed border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] px-4 py-8 text-center text-sm text-[var(--app-muted)] dark:bg-white/[0.03]">
                  Aucune UE dans cette catégorie.
                </p>
              ) : (
                unitsUnoffered.map((u) => (
                  <TeachingUnitCard
                    key={u.id}
                    unit={u}
                    tier="catalog"
                    canStructure={canStructure}
                    onOpenDetail={() => setDetailUnit({ unit: u, tier: 'catalog' })}
                    onRequestEdit={() => setEditUnit(u)}
                    onRequestDelete={() =>
                      setConfirmDelete({
                        title: `Supprimer l’UE ${u.code} ?`,
                        message:
                          'Cette suppression est en cascade : tous les cours (matières) rattachés à cette UE seront aussi supprimés, ainsi que leurs archives.',
                        confirmLabel: 'Supprimer',
                        action: async () => {
                          try {
                            await deleteTeachingUnit(u.id)
                            dispatchToast({ type: 'success', message: 'UE supprimée.' })
                            await refreshTeachingUnitLists()
                          } catch (err) {
                            dispatchToast({
                              type: 'error',
                              message: err?.response?.data?.detail ?? err?.message ?? 'Erreur.',
                            })
                            throw err
                          }
                        },
                      })
                    }
                  />
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {section === 'courses' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_17rem]">
          <div className="min-w-0 space-y-2">
            <h3 className="px-0.5 font-heading text-sm font-semibold text-[var(--app-fg)]">
              Cours · année {yearFocusId ? `#${yearFocusId}` : '—'}
            </h3>
            <PedagogyCoursesSection
              yearFocusId={yearFocusId}
              semesters={semesters}
              departments={departments}
              unitsForUeFilter={unitsForOfferSelect}
              managedDeptId={managedDeptId}
              canStructure={canStructure}
              reloadKey={coursesReloadKey}
            />
          </div>
          <Card className="h-fit rounded-2xl border border-[var(--app-border)] p-5 shadow-sm xl:sticky xl:top-4">
            <h3 className="font-heading text-sm font-semibold text-[var(--app-fg)]">Rappel</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--app-muted)]">
              Chaque cours doit appartenir à une UE. Renseignez aussi le <strong className="font-semibold text-[var(--app-fg)]">semestre programme</strong>{' '}
              (S1–S6) sur la fiche cours pour l’activation des blocs. Créez une UE puis ouvrez <strong>Détails</strong> (onglet « UE & offres »)
              pour déposer l’offre sur un semestre calendaire.
            </p>
            {yearFocusId && unitsUnoffered.length > 0 ? (
              <p className="mt-3 text-xs font-medium rounded-lg border-2 border-red-600 bg-red-50 px-3 py-2.5 text-red-900 shadow-sm dark:border-red-500 dark:bg-red-950/70 dark:text-red-50 dark:shadow-none">
                {unitsUnoffered.length} UE du catalogue n’ont encore aucun cours sur cette année — ouvrez chaque carte
                puis <strong>Détails</strong> pour ajouter les matières.
              </p>
            ) : null}
          </Card>
        </div>
      ) : null}

      {section === 'maquette' ? (
        <PedagogyMaquetteSection
          yearFocusId={yearFocusId}
          yearFocusLabel={yearFocusLabel}
          canStructure={canStructure}
          unitsForOfferSelect={unitsForOfferSelect}
          reloadKey={coursesReloadKey}
          onCreateTeachingUnit={() => setModalUeOpen(true)}
          onOpenTeachingUnit={(unit, tier = 'offered') => setDetailUnit({ unit, tier })}
        />
      ) : null}

      {section === 'departments' && canViewStudents ? (
        <PedagogyDepartmentsSection
          departments={departments}
          loading={loading}
          onRefresh={() => loadAll()}
          managedDepartmentId={managedDeptId}
        />
      ) : null}

      <AcademicYearCreateModal
        open={modalYearOpen}
        onClose={() => setModalYearOpen(false)}
        onCreated={async () => {
          await loadAll()
          await refreshAcademicYears?.()
        }}
      />
      <SemesterCreateModal
        open={modalSemOpen}
        onClose={() => setModalSemOpen(false)}
        academicYearId={yearFocusId}
        yearLabel={yearFocusLabel}
        onCreated={async () => {
          if (yearFocusId) setSemesters(await fetchSemesters(yearFocusId))
        }}
      />
      <TeachingUnitCreateModal
        open={modalUeOpen}
        onClose={() => setModalUeOpen(false)}
        departments={departments}
        onCreated={refreshTeachingUnitLists}
      />
      <TeachingUnitCreateModal
        open={editUnit != null}
        onClose={() => setEditUnit(null)}
        departments={departments}
        mode="edit"
        unit={editUnit}
        onCreated={refreshTeachingUnitLists}
      />
      <TeachingUnitDetailModal
        open={detailUnit != null}
        onClose={() => setDetailUnit(null)}
        unit={detailUnit?.unit ?? null}
        tier={detailUnit?.tier ?? 'catalog'}
        academicYearId={yearFocusId}
        canStructure={canStructure}
        semesters={semesters}
        unitsForOfferSelect={unitsForOfferSelect}
        onOfferSaved={async () => {
          await refreshTeachingUnitLists()
          setCoursesReloadKey((k) => k + 1)
        }}
      />
      <ConfirmModal
        open={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete?.title ?? ''}
        message={confirmDelete?.message}
        confirmLabel={confirmDelete?.confirmLabel}
        onConfirm={confirmDelete?.action ?? (async () => {})}
      />
    </div>
  )
}
