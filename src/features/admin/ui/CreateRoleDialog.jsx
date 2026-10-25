import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'

import { createRole, apiErrorMessage } from '@/features/access/api/accessApi'
import { SCOPE_LEVEL_LABELS, SCOPE_LEVEL_ORDER, SCOPE_LEVEL_PHRASES } from '@/features/admin/model/accessLabels'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { Field, Input, Select } from '@/shared/ui/Field'

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

const EMPTY = { name: '', code: '', scope_level: 'department', description: '', max_holders: '' }

/** Création d'un rôle personnalisé ; les permissions se règlent ensuite dans l'éditeur. */
export function CreateRoleDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [codeTouched, setCodeTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setCodeTouched(false)
      setError('')
    }
  }, [open])

  const set = (key, value) =>
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'name' && !codeTouched) next.code = slugify(value)
      return next
    })

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const role = await createRole({
        name: form.name.trim(),
        code: form.code,
        scope_level: form.scope_level,
        description: form.description.trim(),
        max_holders: form.max_holders === '' ? null : Number(form.max_holders),
        permissions: [],
      })
      onCreated(role)
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Création impossible.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!saving}
      icon={KeyRound}
      title="Nouveau rôle"
      description="Ex. « Secrétaire de département » : choisissez le niveau de périmètre, puis cochez ses permissions."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="create-role-form" disabled={saving || !form.name.trim() || !form.code}>
            {saving ? 'Création…' : 'Créer le rôle'}
          </Button>
        </>
      }
    >
      <form id="create-role-form" onSubmit={submit} className="space-y-4">
        <Field label="Intitulé">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Secrétaire de département" required data-autofocus="" />
        </Field>
        <Field label="Identifiant technique">
          <Input
            value={form.code}
            onChange={(e) => {
              setCodeTouched(true)
              set('code', slugify(e.target.value))
            }}
            className="font-mono text-[13px]"
            required
          />
        </Field>
        <Field label="Niveau de périmètre">
          <Select value={form.scope_level} onChange={(e) => set('scope_level', e.target.value)}>
            {SCOPE_LEVEL_ORDER.map((lvl) => (
              <option key={lvl} value={lvl}>
                {SCOPE_LEVEL_LABELS[lvl]}
              </option>
            ))}
          </Select>
          <span className="text-[12px] text-[var(--app-muted)]">La personne nommée agira {SCOPE_LEVEL_PHRASES[form.scope_level]}.</span>
        </Field>
        <Field label="Titulaires simultanés par entité (vide = illimité)">
          <Input type="number" min={1} value={form.max_holders} onChange={(e) => set('max_holders', e.target.value)} />
        </Field>
        <Field label="Description (optionnel)">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
          />
        </Field>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p> : null}
      </form>
    </Dialog>
  )
}
