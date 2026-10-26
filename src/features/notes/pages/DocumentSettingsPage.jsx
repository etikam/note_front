import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { fetchDocumentSettings, saveDocumentSettings } from '@/features/notes/api/notesApi'
import { PaperPreview } from '@/features/notes/ui/IndividualTranscript'
import { TranscriptDocument } from '@/features/notes/ui/TranscriptDocument'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'

const INPUT =
  'mt-1 h-9 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-60'

/** Relevé fictif pour l'aperçu de l'en-tête. */
const SAMPLE = {
  student: { last_name: 'DIALLO', first_name: 'Aïssatou', matricule: 'MAT-0001', INE: 'INE-0001', birth_date: '2004-03-12', birth_place: 'Conakry', program: { code: 'DL', name: 'Développement logiciel' }, level: 'Licence 1', department: 'Département exemple' },
  academic_year: '2026-2027',
  grading: { scale_max: 10, pass_mark: 5 },
  structure: [
    {
      semester: 1,
      units: [
        { id: 1, code: 'UE-101', name: 'Programmation', credits: 6, courses: [{ id: 'a', code: 'INF101', name: 'Algorithmique', credits: 3 }, { id: 'b', code: 'INF102', name: 'Langage C', credits: 3 }] },
      ],
    },
  ],
  cells: { a: { state: 'graded', average: 7.4, status: 'PASSED' }, b: { state: 'graded', average: 6.1, status: 'PASSED' } },
  units: { 1: 6.75 },
  units_state: { 1: 'validated' },
  average: 6.75,
  credits_earned: 6,
  credits_attempted: 6,
  decision: 'admitted',
  decision_label: 'Admis',
  mention: 'Assez bien',
}

/** Paramètres → Documents officiels : en-tête, ville et signataire des relevés. */
export default function DocumentSettingsPage() {
  const access = useAccess()
  const canEdit = access.can('system.settings')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDocumentSettings()
      .then((d) => setForm({ ...d, header_text: (d.header_lines ?? []).join('\n') }))
      .catch((err) => dispatchToast({ type: 'error', message: err?.message || 'Chargement impossible.' }))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const doc = form ? { ...form, header_lines: form.header_text.split('\n').map((l) => l.trim()).filter(Boolean) } : null

  async function save() {
    setSaving(true)
    try {
      const { institution_name, header_lines, city, signatory_title, signatory_name, footer_note } = doc
      const saved = await saveDocumentSettings({ institution_name, header_lines, city, signatory_title, signatory_name, footer_note })
      setForm({ ...saved, header_text: saved.header_lines.join('\n') })
      dispatchToast({ type: 'success', message: 'En-tête des documents enregistré.' })
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Enregistrement impossible.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        variant="section"
        title="Documents officiels"
        description="En-tête, lieu et signataire imprimés sur les relevés de notes. Les relevés déjà délivrés gardent l’en-tête de leur date de délivrance."
        actions={
          canEdit && form ? (
            <Button onClick={save} disabled={saving || !form.institution_name.trim()}>
              <Save size={15} aria-hidden /> Enregistrer
            </Button>
          ) : null
        }
      />
      {!form ? (
        <SectionCard>
          <SkeletonLines lines={6} />
        </SectionCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <SectionCard title="En-tête et signature">
            <fieldset disabled={!canEdit} className="flex flex-col gap-3">
              <label className="text-[12.5px] font-medium text-[var(--app-fg-soft)]">
                Lignes de tutelle <span className="font-normal text-[var(--app-muted)]">(une par ligne, 5 au plus)</span>
                <textarea
                  rows={3}
                  value={form.header_text}
                  onChange={set('header_text')}
                  placeholder={'République de Guinée\nMinistère de l’Enseignement supérieur'}
                  className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
                />
              </label>
              <label className="text-[12.5px] font-medium text-[var(--app-fg-soft)]">
                Nom de l’établissement
                <input className={INPUT} value={form.institution_name} onChange={set('institution_name')} maxLength={200} />
              </label>
              <label className="text-[12.5px] font-medium text-[var(--app-fg-soft)]">
                Ville (« Fait à … »)
                <input className={INPUT} value={form.city} onChange={set('city')} maxLength={100} />
              </label>
              <label className="text-[12.5px] font-medium text-[var(--app-fg-soft)]">
                Titre du signataire
                <input className={INPUT} value={form.signatory_title} onChange={set('signatory_title')} maxLength={120} />
              </label>
              <label className="text-[12.5px] font-medium text-[var(--app-fg-soft)]">
                Nom du signataire
                <input className={INPUT} value={form.signatory_name} onChange={set('signatory_name')} maxLength={150} />
              </label>
              <label className="text-[12.5px] font-medium text-[var(--app-fg-soft)]">
                Mention de bas de page
                <input className={INPUT} value={form.footer_note} onChange={set('footer_note')} maxLength={300} placeholder="Ex. Il n’est délivré qu’un seul original." />
              </label>
              {!canEdit ? <p className="text-[12px] text-[var(--app-muted)]">Modification réservée aux paramètres système.</p> : null}
            </fieldset>
          </SectionCard>
          <PaperPreview>
            <TranscriptDocument document={doc} transcript={SAMPLE} periodLabel="Année académique 2026-2027 · exemple" />
          </PaperPreview>
        </div>
      )}
    </div>
  )
}
