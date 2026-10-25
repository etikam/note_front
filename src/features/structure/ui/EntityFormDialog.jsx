import { useEffect, useState } from 'react'
import { Building2, GraduationCap } from 'lucide-react'

import { apiErrorMessage } from '@/features/access/api/accessApi'
import { entityLabel } from '@/features/admin/model/structureIndex'
import { createDepartment, createProgram, updateDepartment, updateProgram } from '@/features/structure/api/structureApi'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { Field, Input, Select } from '@/shared/ui/Field'

const KINDS = {
  department: {
    icon: Building2,
    parentKey: 'faculty',
    parentLabel: 'Faculté',
    create: createDepartment,
    update: updateDepartment,
    titles: ['Nouveau département', 'Modifier le département'],
    hint: 'Un programme du même nom pourra ensuite y être créé pour accueillir niveaux, maquette et étudiants.',
  },
  program: {
    icon: GraduationCap,
    parentKey: 'department',
    parentLabel: 'Département',
    create: createProgram,
    update: updateProgram,
    titles: ['Nouveau programme', 'Modifier le programme'],
    hint: 'Un programme est un cursus complet : il porte ses niveaux, sa maquette de cours, ses cohortes et ses étudiants.',
  },
}

/**
 * Création / édition d'un département ou d'un programme.
 * ``parents`` : entités (facultés ou départements) où l'utilisateur peut créer ; ``entity`` : élément édité.
 */
export function EntityFormDialog({ kind, open, onClose, entity = null, parents, defaultParentId = null, onSaved }) {
  const cfg = KINDS[kind]
  const [form, setForm] = useState({ code: '', name: '', description: '', parent: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const parent = entity ? entity[cfg.parentKey]?.id ?? entity[cfg.parentKey] : defaultParentId ?? (parents.length === 1 ? parents[0].id : '')
    setForm({ code: entity?.code ?? '', name: entity?.name ?? '', description: entity?.description ?? '', parent: parent ? String(parent) : '' })
    setFieldErrors({})
    setError('')
  }, [open, entity, defaultParentId, parents, cfg.parentKey])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const body = { code: form.code.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim(), [cfg.parentKey]: Number(form.parent) }
    try {
      const saved = entity ? await cfg.update(entity.id, body) : await cfg.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setFieldErrors(err?.fieldErrors ?? {})
      setError(apiErrorMessage(err, 'Enregistrement impossible.'))
    } finally {
      setSaving(false)
    }
  }

  const formId = `entity-form-${kind}`
  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!saving}
      icon={cfg.icon}
      title={cfg.titles[entity ? 1 : 0]}
      description={entity ? null : cfg.hint}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form={formId} disabled={saving || !form.code.trim() || !form.name.trim() || !form.parent}>
            {saving ? 'Enregistrement…' : entity ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <Field label={cfg.parentLabel} error={fieldErrors[cfg.parentKey]}>
          <Select value={form.parent} onChange={set('parent')} required>
            <option value="">Choisir…</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {entityLabel(p)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <Field label="Code" error={fieldErrors.code}>
            <Input value={form.code} onChange={set('code')} maxLength={20} className="font-mono uppercase" required data-autofocus="" />
          </Field>
          <Field label="Intitulé" error={fieldErrors.name}>
            <Input value={form.name} onChange={set('name')} maxLength={200} required />
          </Field>
        </div>
        <Field label="Description (optionnel)" error={fieldErrors.description}>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
          />
        </Field>
        {error && !Object.keys(fieldErrors).length ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>
        ) : null}
      </form>
    </Dialog>
  )
}
