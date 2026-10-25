import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Info, Lock, Plus, ShieldCheck, Trash2, Users } from 'lucide-react'

import { apiErrorMessage, deleteRole, fetchAccessCatalog, fetchRoles, updateRole } from '@/features/access/api/accessApi'
import { useAccess } from '@/features/access/model/useAccess'
import { SCOPE_LEVEL_LABELS, SCOPE_LEVEL_ORDER, SCOPE_LEVEL_PHRASES, groupCatalog } from '@/features/admin/model/accessLabels'
import { CreateRoleDialog } from '@/features/admin/ui/CreateRoleDialog'
import { PermissionMatrix } from '@/features/admin/ui/PermissionMatrix'
import { useAuth } from '@/features/auth/model/AuthContext'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Field, Input, Select } from '@/shared/ui/Field'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton, SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

function sortRoles(roles) {
  return [...roles].sort(
    (a, b) =>
      SCOPE_LEVEL_ORDER.indexOf(a.scope_level) - SCOPE_LEVEL_ORDER.indexOf(b.scope_level) ||
      Number(b.is_system) - Number(a.is_system) ||
      a.name.localeCompare(b.name, 'fr'),
  )
}

function draftOf(role) {
  return {
    name: role.name,
    description: role.description ?? '',
    scope_level: role.scope_level,
    max_holders: role.max_holders ?? '',
    permissions: [...(role.permissions ?? [])].sort(),
  }
}

function sameDraft(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function RoleListItem({ role, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full items-start gap-3 border-b border-[var(--app-border)] px-4 py-3 text-left last:border-0 outline-none transition-colors',
        'focus-visible:bg-[var(--app-hover)]',
        active ? 'bg-brand-50/70 dark:bg-white/[0.05]' : 'hover:bg-[var(--app-hover)]',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-brand-600 text-white dark:bg-brand-500' : 'bg-[var(--app-subtle)] text-[var(--app-muted)]',
        )}
      >
        {role.is_system ? <Lock size={14} aria-hidden /> : <ShieldCheck size={15} aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[var(--app-fg)]">{role.name}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[var(--app-muted)]">
          <span>{SCOPE_LEVEL_LABELS[role.scope_level]}</span>
          <span aria-hidden>·</span>
          <span>{role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}</span>
        </span>
      </span>
      {role.scope_level !== 'own' ? (
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-[var(--app-muted)]" title="Titulaires actifs">
          <Users size={12} aria-hidden />
          {role.active_holders}
        </span>
      ) : null}
    </button>
  )
}

export default function RolesPage() {
  const access = useAccess()
  const { refreshMe } = useAuth()
  const canEdit = access.can('access.manage_roles')
  const [params, setParams] = useSearchParams()
  const [catalog, setCatalog] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [cat, list] = await Promise.all([fetchAccessCatalog(), fetchRoles()])
      setCatalog(cat)
      setRoles(sortRoles(list))
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Impossible de charger les rôles.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = useMemo(() => {
    const code = params.get('role')
    return roles.find((r) => r.code === code) ?? roles[0] ?? null
  }, [roles, params])

  useEffect(() => {
    setDraft(selected ? draftOf(selected) : null)
  }, [selected])

  const dirty = Boolean(selected && draft && !sameDraft(draft, draftOf(selected)))
  const levelLocked = !canEdit || selected?.is_system || (selected?.active_holders ?? 0) > 0

  const selectRole = (role) => {
    if (dirty && !window.confirm('Abandonner les modifications non enregistrées ?')) return
    setParams({ role: role.code }, { replace: true })
  }

  function changeLevel(level) {
    const allowed = new Set((catalog?.permissions ?? []).filter((p) => p.levels.includes(level)).map((p) => p.code))
    setDraft((d) => {
      const kept = d.permissions.filter((code) => allowed.has(code))
      if (kept.length < d.permissions.length) {
        dispatchToast({ type: 'info', message: `${d.permissions.length - kept.length} permission(s) retirée(s) : sans effet à ce niveau.` })
      }
      return { ...d, scope_level: level, permissions: kept }
    })
  }

  async function save() {
    setSaving(true)
    try {
      const updated = await updateRole(selected.id, {
        ...draft,
        name: draft.name.trim(),
        max_holders: draft.max_holders === '' ? null : Number(draft.max_holders),
      })
      setRoles((rs) => sortRoles(rs.map((r) => (r.id === updated.id ? updated : r))))
      dispatchToast({ type: 'success', message: `Rôle « ${updated.name} » enregistré.` })
      await refreshMe()
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err, 'Enregistrement impossible.') })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    try {
      await deleteRole(selected.id)
      dispatchToast({ type: 'success', message: `Rôle « ${selected.name} » supprimé.` })
      setParams({}, { replace: true })
      await load()
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err, 'Suppression impossible.') })
      throw err
    }
  }

  const groups = useMemo(() => groupCatalog(catalog?.permissions ?? []), [catalog])
  const grantedGroups = draft ? groups.filter((g) => g.permissions.some((p) => draft.permissions.includes(p.code))).map((g) => g.name) : []

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Administration' }, { label: 'Rôles & permissions' }]}
        title="Rôles & permissions"
        description="Un rôle regroupe des permissions et fixe un niveau de périmètre. Il s’attribue par une nomination sur une entité précise : la personne nommée agit alors sur cette entité et tout ce qu’elle contient."
        actions={
          <>
            {access.canManage('access.assign_roles') ? (
              <Button as={Link} to="/admin/nominations" variant="ghost">
                Nominations
              </Button>
            ) : null}
            {canEdit ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={15} aria-hidden /> Nouveau rôle
              </Button>
            ) : null}
          </>
        }
      />

      {loadError ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={loadError} onRetry={load} />
        </SectionCard>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <SectionCard title="Rôles" description={loading ? null : `${roles.length} rôle${roles.length > 1 ? 's' : ''}`} flush className="lg:sticky lg:top-20">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div role="list">
                {roles.map((r) => (
                  <RoleListItem key={r.id} role={r} active={r.id === selected?.id} onSelect={() => selectRole(r)} />
                ))}
              </div>
            )}
          </SectionCard>

          {loading || !selected || !draft ? (
            <SectionCard>
              <SkeletonLines lines={6} />
            </SectionCard>
          ) : (
            <div className="flex min-w-0 flex-col gap-4">
              {!canEdit ? (
                <p className="flex items-start gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-3 text-[13px] text-[var(--app-fg-soft)]">
                  <Info size={16} className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
                  Consultation seule : seul un profil autorisé à définir les rôles peut les modifier.
                </p>
              ) : null}

              <SectionCard
                title={
                  <span className="flex items-center gap-2">
                    {selected.name}
                    {selected.is_system ? <StatusPill tone="neutral" dot={false}>Rôle système</StatusPill> : <StatusPill tone="info" dot={false}>Personnalisé</StatusPill>}
                  </span>
                }
                description={`Agit ${SCOPE_LEVEL_PHRASES[draft.scope_level]} · ${selected.active_holders} titulaire${selected.active_holders > 1 ? 's' : ''} actif${selected.active_holders > 1 ? 's' : ''}`}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Intitulé">
                    <Input value={draft.name} disabled={!canEdit} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                  </Field>
                  <Field label="Niveau de périmètre">
                    <Select value={draft.scope_level} disabled={levelLocked} onChange={(e) => changeLevel(e.target.value)}>
                      {SCOPE_LEVEL_ORDER.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {SCOPE_LEVEL_LABELS[lvl]}
                        </option>
                      ))}
                    </Select>
                    {levelLocked && canEdit ? (
                      <span className="text-[11.5px] text-[var(--app-muted)]">
                        {selected.is_system ? 'Niveau fixe pour un rôle système.' : 'Niveau figé : ce rôle a déjà des titulaires.'}
                      </span>
                    ) : null}
                  </Field>
                  <Field label="Titulaires simultanés par entité">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Illimité"
                      value={draft.max_holders}
                      disabled={!canEdit}
                      onChange={(e) => setDraft((d) => ({ ...d, max_holders: e.target.value }))}
                    />
                  </Field>
                  <Field label="Description">
                    <Input value={draft.description} disabled={!canEdit} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="—" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Permissions"
                description={
                  draft.permissions.length
                    ? `${draft.permissions.length} permission${draft.permissions.length > 1 ? 's' : ''} · ${grantedGroups.join(', ')}`
                    : 'Aucune permission : ce rôle ne donne encore aucun droit.'
                }
                bodyClassName="bg-[var(--app-subtle)] rounded-b-xl"
              >
                <PermissionMatrix
                  catalog={catalog.permissions}
                  scopeLevel={draft.scope_level}
                  value={draft.permissions}
                  readOnly={!canEdit}
                  onChange={(permissions) => setDraft((d) => ({ ...d, permissions }))}
                />
              </SectionCard>

              {canEdit && !selected.is_system ? (
                <SectionCard>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--app-fg)]">Supprimer ce rôle</p>
                      <p className="text-[12.5px] text-[var(--app-muted)]">Possible uniquement s’il n’a jamais été attribué.</p>
                    </div>
                    <Button variant="ghost" className="text-red-700 dark:text-red-300" onClick={() => setConfirmDelete(true)}>
                      <Trash2 size={15} aria-hidden /> Supprimer
                    </Button>
                  </div>
                </SectionCard>
              ) : null}

              {dirty ? (
                <div className="ds-pop-in sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-3 shadow-lg">
                  <p className="text-[13px] font-medium text-[var(--app-fg)]">Modifications non enregistrées</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setDraft(draftOf(selected))} disabled={saving}>
                      Annuler
                    </Button>
                    <Button onClick={save} disabled={saving || !draft.name.trim()}>
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      <CreateRoleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(role) => {
          setRoles((rs) => sortRoles([...rs, role]))
          setParams({ role: role.code }, { replace: true })
          dispatchToast({ type: 'success', message: `Rôle « ${role.name} » créé : cochez maintenant ses permissions.` })
        }}
      />
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Supprimer « ${selected?.name ?? ''} » ?`}
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        onConfirm={remove}
      />
    </div>
  )
}
