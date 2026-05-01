import { useCallback, useRef, useState } from 'react'
import { Download, UploadCloud } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import {
  fetchTeacherImportTemplateBlob,
  postTeacherImport,
} from '@/features/teacher/faculty/api/teachersApi'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

export function TeacherFacultyImportPage() {
  const { user } = useAuth()
  const canProvision = Boolean(user?.capabilities?.can_provision_teacher)
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const downloadTemplate = useCallback(async () => {
    setError(null)
    try {
      const res = await fetchTeacherImportTemplateBlob()
      const blob =
        res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modele_import_enseignants.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e?.message ?? 'Téléchargement impossible.')
    }
  }, [])

  const runImport = useCallback(async (file) => {
    if (!file?.name?.toLowerCase().endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier .csv')
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const data = await postTeacherImport(form, {
        headers: { 'Content-Type': undefined },
      })
      setResult(data)
    } catch (e) {
      setError(e?.message ?? 'Import impossible.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [])

  if (!canProvision) return null

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-600 dark:text-secondary-400 mb-1.5">
          Ressources humaines
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-900 dark:text-zinc-50 tracking-tight">
          Import enseignants
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          CSV UTF-8 — colonnes obligatoires : matricule, first_name, last_name, email. Optionnel : gender, phone,
          teacher_role, grade_code (codes MCF, PR, ATER…). Le statut du compte est géré par l’application.
        </p>
      </div>

      <Card className="p-5 sm:p-6 space-y-4">
        <Button type="button" variant="primary" size="sm" onClick={downloadTemplate}>
          <Download size={16} aria-hidden />
          Télécharger le modèle
        </Button>
        <div
          className={cn(
            'rounded-xl border-2 border-dashed border-zinc-300 px-4 py-10 text-center dark:border-[var(--app-border)]',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) runImport(f)
            }}
          />
          <UploadCloud className="mx-auto text-zinc-400" size={36} aria-hidden />
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Déposer un CSV ou</p>
          <Button type="button" variant="ghost" size="sm" className="mt-2" disabled={busy} onClick={() => inputRef.current?.click()}>
            Choisir un fichier
          </Button>
        </div>
        {busy ? (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Spinner size="sm" label="Import" />
            Traitement…
          </div>
        ) : null}
      </Card>

      {error ? (
        <p className="text-error text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <Card className="p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">Résultat</h2>
          <p className="mt-2 text-sm tabular-nums">
            Créés : {result.created_count ?? 0} · Ignorés : {result.skipped_count ?? 0} · Erreurs :{' '}
            {result.error_count ?? 0}
          </p>
        </Card>
      ) : null}
    </div>
  )
}
