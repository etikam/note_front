import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BadgeCheck, CalendarClock, Hourglass, Network, ListChecks, UserPlus, UserRoundX } from 'lucide-react'

import { apiErrorMessage, fetchAssignments, fetchRoles, fetchStructureTree } from '@/features/access/api/accessApi'
import { ASSIGNMENT_STATUS, SCOPE_LEVEL_LABELS, formatPeriod } from '@/features/admin/model/accessLabels'
import { indexStructure, vacanciesFor } from '@/features/admin/model/structureIndex'
import { MandateDrawer } from '@/features/admin/ui/MandateDrawer'
import { NominationDrawer } from '@/features/admin/ui/NominationDrawer'
import { EntityMandates, StructureMandates } from '@/features/admin/ui/StructureMandates'
import { useAuth } from '@/features/auth/model/AuthContext'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { DataTable } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatTile } from '@/shared/ui/StatTile'
import { StatusPill } from '@/shared/ui/StatusPill'
import { Tabs } from '@/shared/ui/Tabs'

const SOON_DAYS = 60
const STATUS_FILTERS = ['active', 'upcoming', 'expired', 'revoked', 'all']

function normalize(text) {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function endsSoon(m, today) {
  if (m.status !== 'active' || !m.ends_on) return false
  const days = (new Date(`${m.ends_on}T00:00:00`) - today) / 86_400_000
  return days <= SOON_DAYS
}

export default function NominationsPage() {
  const { refreshMe } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'mandates' ? 'mandates' : 'structure'
  const [status, setStatus] = useState('active')
  const [query, setQuery] = useState('')
  const [vacantOnly, setVacantOnly] = useState(false)
  const [data, setData] = useState({ tree: null, roles: [], mandates: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wizard, setWizard] = useState(null)
  const [openMandate, setOpenMandate] = useState(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [tree, roles, mandates] = await Promise.all([fetchStructureTree(), fetchRoles(), fetchAssignments()])
      setData({ tree, roles, mandates: mandates.results })
    } catch (err) {
      setError(apiErrorMessage(err, 'Impossible de charger les nominations.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Raccourci « Nommer un responsable » (palette ⌘K) : ouvre l'assistant une fois les données chargées.
  useEffect(() => {
    if (loading || params.get('new') !== '1') return
    setWizard({})
    const next = new URLSearchParams(params)
    next.delete('new')
    setParams(next, { replace: true })
  }, [loading, params, setParams])

  const refresh = useCallback(async () => {
    await load({ silent: true })
    await refreshMe()
  }, [load, refreshMe])

  const { tree, roles, mandates } = data
  const index = useMemo(() => indexStructure(tree), [tree])
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const stats = useMemo(() => {
    const entities = [...index.byKey.values()]
    return {
      active: mandates.filter((m) => m.status === 'active').length,
      vacancies: entities.reduce((n, e) => n + vacanciesFor(e, roles).reduce((s, v) => s + v.free, 0), 0),
      soon: mandates.filter((m) => endsSoon(m, today)).length,
      upcoming: mandates.filter((m) => m.status === 'upcoming').length,
    }
  }, [index, roles, mandates, today])

  const q = normalize(query.trim())
  const structureFilter = useCallback(
    (entity) => {
      if (vacantOnly && !vacanciesFor(entity, roles).length) return false
      if (!q) return true
      return [entity.code, entity.name, ...entity.holders.map((h) => `${h.teacher_name} ${h.teacher_matricule}`)].some((t) => normalize(t).includes(q))
    },
    [q, vacantOnly, roles],
  )

  const statusCounts = useMemo(() => {
    const counts = { all: mandates.length }
    for (const m of mandates) counts[m.status] = (counts[m.status] ?? 0) + 1
    return counts
  }, [mandates])

  const mandateRows = useMemo(
    () =>
      mandates
        .filter((m) => status === 'all' || m.status === status)
        .filter((m) => !q || [m.teacher_name, m.teacher_matricule, m.role_name, m.target_label].some((t) => normalize(t).includes(q))),
    [mandates, status, q],
  )

  const columns = [
    {
      key: 'person',
      header: 'Personne',
      sortValue: (m) => m.teacher_name,
      cell: (m) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={m.teacher_name} size="xs" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-[var(--app-fg)]">{m.teacher_name}</span>
            <span className="block font-mono text-[11px] text-[var(--app-muted)]">{m.teacher_matricule}</span>
          </span>
        </span>
      ),
    },
    { key: 'role', header: 'Rôle', sortValue: (m) => m.role_name, cell: (m) => m.role_name },
    {
      key: 'target',
      header: 'Périmètre',
      sortValue: (m) => m.target_label || '',
      cell: (m) => (
        <span className="flex flex-col">
          <span className="truncate">{m.target_label || 'Institution'}</span>
          <span className="text-[11px] text-[var(--app-muted)]">{SCOPE_LEVEL_LABELS[m.scope_level]}</span>
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Période',
      sortValue: (m) => m.ends_on ?? '9999',
      cell: (m) => (
        <span className={endsSoon(m, today) ? 'text-amber-700 dark:text-amber-300' : 'text-[var(--app-fg-soft)]'}>{formatPeriod(m.starts_on, m.ends_on)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      sortValue: (m) => m.status,
      cell: (m) => <StatusPill tone={ASSIGNMENT_STATUS[m.status]?.tone}>{ASSIGNMENT_STATUS[m.status]?.label ?? m.status}</StatusPill>,
    },
  ]

  const institution = index.byKey.get('institution')
  const showInstitution = institution && (institution.holders.length || institution.can?.assign_roles)

  return (
    <div>
      <PageHeader
        variant="section"
        title="Nominations"
        description="Qui occupe quel rôle, sur quelle entité, et jusqu’à quand. Une nomination donne à la personne les permissions du rôle sur l’entité et tout ce qu’elle contient."
        actions={
          <>
            <Button onClick={() => setWizard({})} disabled={loading || Boolean(error)}>
              <UserPlus size={15} aria-hidden /> Nommer
            </Button>
          </>
        }
      />

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} onRetry={load} />
        </SectionCard>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={BadgeCheck} tone="brand" label="Mandats actifs" value={stats.active} loading={loading} />
            <StatTile icon={UserRoundX} tone="warning" label="Postes vacants" value={stats.vacancies} hint="Rôles à titulaire limité" loading={loading} />
            <StatTile icon={Hourglass} label={`Fin sous ${SOON_DAYS} jours`} value={stats.soon} loading={loading} />
            <StatTile icon={CalendarClock} label="Mandats à venir" value={stats.upcoming} loading={loading} />
          </div>

          <Tabs
            className="mb-5"
            value={tab}
            onChange={(id) => setParams(id === 'structure' ? {} : { tab: id }, { replace: true })}
            tabs={[
              { id: 'structure', label: 'Par structure', icon: Network },
              { id: 'mandates', label: 'Tous les mandats', icon: ListChecks, count: loading ? null : mandates.length },
            ]}
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={tab === 'structure' ? 'Département, programme ou personne' : 'Personne, rôle ou périmètre'}
              className="w-full sm:w-80"
            />
            {tab === 'structure' ? (
              <Checkbox checked={vacantOnly} onChange={setVacantOnly} label="Postes vacants uniquement" />
            ) : (
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrer par statut">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    aria-pressed={status === s}
                    className={
                      status === s
                        ? 'rounded-full bg-[var(--app-fg)] px-3 py-1 text-[12px] font-medium text-[var(--app-canvas)]'
                        : 'rounded-full px-3 py-1 text-[12px] font-medium text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]'
                    }
                  >
                    {s === 'all' ? 'Tous' : ASSIGNMENT_STATUS[s].label}
                    <span className="ml-1.5 tabular-nums opacity-70">{statusCounts[s] ?? 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {tab === 'structure' ? (
            loading ? (
              <SectionCard>
                <SkeletonLines lines={8} />
              </SectionCard>
            ) : (
              <div className="flex flex-col gap-8">
                {showInstitution && structureFilter(institution) ? (
                  <SectionCard
                    title="Direction de l’institution"
                    description="Rôles à portée institutionnelle : ils couvrent toutes les facultés."
                    actions={
                      institution.can?.assign_roles ? (
                        <Button size="sm" variant="ghost" onClick={() => setWizard({ level: 'institution' })}>
                          <UserPlus size={14} aria-hidden /> Nommer
                        </Button>
                      ) : null
                    }
                  >
                    <EntityMandates entity={institution} roles={roles} onOpen={setOpenMandate} onNominate={setWizard} />
                  </SectionCard>
                ) : null}
                {tree?.faculties.length ? (
                  <StructureMandates tree={tree} roles={roles} onOpen={setOpenMandate} onNominate={setWizard} filter={structureFilter} />
                ) : (
                  <SectionCard>
                    <EmptyState title="Aucune entité dans votre périmètre" description="Les facultés, départements et programmes que vous pouvez gérer apparaîtront ici." />
                  </SectionCard>
                )}
              </div>
            )
          ) : (
            <SectionCard flush>
              <DataTable
                columns={columns}
                rows={mandateRows}
                loading={loading}
                onRowClick={(m) => setOpenMandate(m.id)}
                initialSort={{ key: 'person', dir: 'asc' }}
                empty={{
                  title: q ? 'Aucun mandat ne correspond' : 'Aucun mandat',
                  description: q ? 'Essayez un autre nom ou matricule.' : 'Les nominations de ce statut apparaîtront ici.',
                }}
              />
            </SectionCard>
          )}
        </>
      )}

      <NominationDrawer
        open={wizard != null}
        onClose={() => setWizard(null)}
        roles={roles}
        index={index}
        preset={wizard}
        onDone={(m) => {
          dispatchToast({ type: 'success', message: `${m.teacher_name} nommé·e ${m.role_name}${m.target_label ? ` — ${m.target_label}` : ''}.` })
          void refresh()
        }}
      />
      <MandateDrawer assignmentId={openMandate} onClose={() => setOpenMandate(null)} onChanged={() => void refresh()} />
    </div>
  )
}
