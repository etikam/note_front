import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, UserRound, X } from 'lucide-react'

import { apiErrorMessage, createAssignment, fetchCandidates } from '@/features/access/api/accessApi'
import { SCOPE_LEVEL_LABELS, SCOPE_LEVEL_ORDER, SCOPE_LEVEL_PHRASES, formatDate, formatPeriod } from '@/features/admin/model/accessLabels'
import { assignableEntities, entityLabel } from '@/features/admin/model/structureIndex'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { Field, Input, Select } from '@/shared/ui/Field'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Skeleton } from '@/shared/ui/Skeleton'

function Step({ n, title, done, children }) {
  return (
    <section className="relative pl-9">
      <span
        className={cn(
          'absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full text-[11.5px] font-semibold',
          done ? 'bg-brand-600 text-white dark:bg-brand-500' : 'bg-[var(--app-subtle)] text-[var(--app-muted)] ring-1 ring-[var(--app-border)]',
        )}
      >
        {done ? <Check size={13} aria-hidden /> : n}
      </span>
      <h3 className="mb-3 text-[13px] font-semibold text-[var(--app-fg)]">{title}</h3>
      {children}
    </section>
  )
}

function useCandidates(query, enabled) {
  const [state, setState] = useState({ loading: false, items: [], error: '' })
  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    const t = setTimeout(async () => {
      try {
        const items = await fetchCandidates(query.trim())
        if (!cancelled) setState({ loading: false, items, error: '' })
      } catch (err) {
        if (!cancelled) setState({ loading: false, items: [], error: apiErrorMessage(err, 'Recherche impossible.') })
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query, enabled])
  return state
}

/**
 * Assistant de nomination : rôle → entité → personne → période.
 * ``preset`` : ``{ roleCode?, level?, entityId? }`` pour ouvrir depuis un poste vacant.
 */
export function NominationDrawer({ open, onClose, roles, index, preset, onDone }) {
  const [roleCode, setRoleCode] = useState('')
  const [entityId, setEntityId] = useState('')
  const [person, setPerson] = useState(null)
  const [query, setQuery] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setRoleCode(preset?.roleCode ?? '')
    setEntityId(preset?.entityId != null ? String(preset.entityId) : '')
    setPerson(null)
    setQuery('')
    setStartsOn('')
    setEndsOn('')
    setNote('')
    setError('')
  }, [open, preset])

  const assignable = useMemo(
    () =>
      roles
        .filter((r) => r.scope_level !== 'own' && assignableEntities(index, r.scope_level).length > 0)
        .filter((r) => !preset?.level || r.scope_level === preset.level),
    [roles, index, preset],
  )
  const role = assignable.find((r) => r.code === roleCode) ?? null
  const level = role?.scope_level ?? null
  const entities = useMemo(() => (level ? assignableEntities(index, level) : []), [index, level])
  const entity =
    level === 'institution' ? entities[0] ?? null : entities.find((e) => String(e.id) === entityId) ?? null

  useEffect(() => {
    if (level && level !== 'institution' && entities.length === 1) setEntityId(String(entities[0].id))
  }, [level, entities])

  const candidates = useCandidates(query, open && Boolean(entity) && !person)
  const occupants = entity && role ? entity.holders.filter((h) => h.role_code === role.code) : []
  const full = Boolean(role?.max_holders && occupants.length >= role.max_holders)
  const alreadyHolder = person && occupants.some((h) => h.teacher_id === person.id)
  const datesInvalid = Boolean(startsOn && endsOn && endsOn < startsOn)
  const ready = role && entity && person && !datesInvalid && !alreadyHolder

  async function submit() {
    setSaving(true)
    setError('')
    const target = level === 'institution' ? {} : { [level]: entity.id }
    try {
      const created = await createAssignment({
        teacher: person.id,
        role: role.id,
        ...target,
        starts_on: startsOn || null,
        ends_on: endsOn || null,
        note: note.trim(),
      })
      onDone(created)
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Nomination impossible.'))
    } finally {
      setSaving(false)
    }
  }

  const groupedRoles = SCOPE_LEVEL_ORDER.map((lvl) => ({ lvl, items: assignable.filter((r) => r.scope_level === lvl) })).filter(
    (g) => g.items.length,
  )
  const entityGroups = useMemo(() => {
    if (level === 'department') return groupBy(entities, (e) => entityLabel({ ...e.faculty, level: 'faculty' }))
    if (level === 'program') return groupBy(entities, (e) => entityLabel({ ...e.department, level: 'department' }))
    return [{ label: null, items: entities }]
  }, [entities, level])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      dismissible={!saving}
      eyebrow="Nomination"
      title="Nommer à un rôle"
      description="La personne nommée agit sur l’entité choisie et tout ce qu’elle contient, pendant la période indiquée."
      width="lg"
      footer={
        <div className="flex w-full flex-col gap-3">
          {ready ? (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-[12.5px] leading-relaxed text-brand-900 dark:bg-brand-900/30 dark:text-brand-100">
              <strong>{person.full_name}</strong> sera <strong>{role.name}</strong>
              {level === 'institution' ? '' : <> de <strong>{entityLabel(entity)}</strong></>} · {formatPeriod(startsOn, endsOn).toLowerCase()}.
            </p>
          ) : null}
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={!ready || saving}>
              {saving ? 'Nomination…' : 'Confirmer la nomination'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        <Step n={1} title="Rôle" done={Boolean(role)}>
          <Select value={roleCode} onChange={(e) => { setRoleCode(e.target.value); setEntityId(''); setPerson(null) }} aria-label="Rôle" data-autofocus="">
            <option value="">Choisir un rôle…</option>
            {groupedRoles.map((g) => (
              <optgroup key={g.lvl} label={`Niveau ${SCOPE_LEVEL_LABELS[g.lvl].toLowerCase()}`}>
                {g.items.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          {role ? (
            <p className="mt-2 text-[12px] text-[var(--app-muted)]">
              Agit {SCOPE_LEVEL_PHRASES[role.scope_level]} · {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
              {role.max_holders ? ` · ${role.max_holders} titulaire${role.max_holders > 1 ? 's' : ''} max. par entité` : ''}
            </p>
          ) : null}
        </Step>

        {role && level !== 'institution' ? (
          <Step n={2} title={SCOPE_LEVEL_LABELS[level]} done={Boolean(entity)}>
            <Select value={entityId} onChange={(e) => { setEntityId(e.target.value); setPerson(null) }} aria-label={SCOPE_LEVEL_LABELS[level]}>
              <option value="">Choisir…</option>
              {entityGroups.map((g) =>
                g.label ? (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((e) => (
                      <option key={e.id} value={e.id}>
                        {entityLabel(e)}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  g.items.map((e) => (
                    <option key={e.id} value={e.id}>
                      {entityLabel(e)}
                    </option>
                  ))
                ),
              )}
            </Select>
          </Step>
        ) : null}

        {entity && occupants.length ? (
          <div
            className={cn(
              '-mt-3 ml-9 flex gap-2 rounded-lg px-3 py-2.5 text-[12.5px]',
              full ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200' : 'bg-[var(--app-subtle)] text-[var(--app-fg-soft)]',
            )}
          >
            {full ? <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden /> : null}
            <div>
              <p>
                {full ? 'Poste occupé par ' : 'Titulaire(s) actuel(s) : '}
                {occupants.map((h, i) => (
                  <span key={h.assignment_id}>
                    {i ? ', ' : ''}
                    <strong>{h.teacher_name}</strong>
                    {h.ends_on ? ` (jusqu’au ${formatDate(h.ends_on)})` : ''}
                  </span>
                ))}
                .
              </p>
              {full ? <p className="mt-1">Révoquez d’abord ce mandat, ou faites démarrer la nouvelle nomination après sa fin.</p> : null}
            </div>
          </div>
        ) : null}

        {entity ? (
          <Step n={level === 'institution' ? 2 : 3} title="Personne" done={Boolean(person)}>
            {person ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2.5">
                <Avatar name={person.full_name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[var(--app-fg)]">{person.full_name}</p>
                  <p className="truncate text-[11.5px] text-[var(--app-muted)]">
                    {person.matricule}
                    {person.grade ? ` · ${person.grade}` : ''}
                    {person.is_activated ? '' : ' · compte non activé'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPerson(null)}
                  className="rounded-md p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]"
                  aria-label="Changer de personne"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
                <div className="border-b border-[var(--app-border)] p-2">
                  <SearchInput value={query} onChange={setQuery} placeholder="Nom, matricule ou e-mail" autoFocus />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {candidates.loading && !candidates.items.length ? (
                    <div className="space-y-2 p-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : candidates.error ? (
                    <p className="p-4 text-[12.5px] text-red-700 dark:text-red-300">{candidates.error}</p>
                  ) : !candidates.items.length ? (
                    <p className="flex items-center gap-2 p-4 text-[12.5px] text-[var(--app-muted)]">
                      <UserRound size={15} aria-hidden /> Aucun enseignant actif ne correspond.
                    </p>
                  ) : (
                    candidates.items.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setPerson(c)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--app-hover)] focus-visible:bg-[var(--app-hover)] focus-visible:outline-none"
                      >
                        <Avatar name={c.full_name} size="xs" />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-fg)]">{c.full_name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-[var(--app-muted)]">{c.matricule}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            {alreadyHolder ? <p className="mt-2 text-[12px] text-amber-700 dark:text-amber-300">Cette personne occupe déjà ce poste.</p> : null}
          </Step>
        ) : null}

        {person ? (
          <Step n={level === 'institution' ? 3 : 4} title="Période du mandat" done={!datesInvalid}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Début (vide = immédiat)">
                <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
              </Field>
              <Field label="Fin (vide = sans limite)" error={datesInvalid ? 'La fin précède le début.' : null}>
                <Input type="date" value={endsOn} min={startsOn || undefined} onChange={(e) => setEndsOn(e.target.value)} />
              </Field>
            </div>
            <Field label="Note (optionnel)" className="mt-3">
              <Input value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} placeholder="Ex. décision n° 2026-014 du conseil" />
            </Field>
          </Step>
        ) : null}
      </div>
    </Drawer>
  )
}

function groupBy(items, labelOf) {
  const groups = new Map()
  for (const item of items) {
    const label = labelOf(item)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(item)
  }
  return [...groups.entries()].map(([label, list]) => ({ label, items: list }))
}
