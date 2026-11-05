import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAccess } from '@/features/access/model/useAccess'
import { validateTeacherImportCsv } from '@/features/teacher/faculty/teacherCsvValidation'
import { TEACHER_IMPORT_REQUIRED_COLUMNS } from '@/features/teacher/faculty/teacherImport.constants'
import { TeacherImportRowIssuesPanel } from '@/features/teacher/faculty/ui/TeacherImportRowIssuesPanel'
import { buildCsvPreview } from '@/features/teacher/students/csvPreview'
import {
  fetchTeacherGrades,
  fetchTeacherImportTemplateBlob,
  postTeacherImport,
} from '@/features/teacher/faculty/api/teachersApi'
import {
  FileDropzone,
  getImportDisabledHint,
  HeaderIssuesAlert,
  ImportActionBar,
  ImportPageHeader,
  ImportProgressBlock,
  ImportResultPanel,
  ImportSidebar,
  ImportStepCard,
  PreviewTablePanel,
  RequiredColumnsMatchList,
  SelectedFileRow,
  TemplateSection,
} from '@/features/teacher/students/ui/import'
import { PREVIEW_ROW_CAP } from '@/features/teacher/students/ui/import/import.constants'
import { Stack } from '@/shared/ui/Stack'


export function TeacherFacultyImportPage() {
  const access = useAccess()
  const canProvision = access.canGlobal('teachers.provision')
  const canViewReports = access.canManage('reports.view')
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [gradeChoices, setGradeChoices] = useState([])

  const [pendingFile, setPendingFile] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchTeacherGrades()
        if (cancelled || !Array.isArray(data)) return
        const values = data
          .map((item) => String(item?.value ?? '').trim())
          .filter((v) => v.length > 0)
        setGradeChoices(values)
      } catch {
        if (!cancelled) setGradeChoices([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const readFilePreview = useCallback((file) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier .csv')
      return
    }
    setError(null)
    setResult(null)
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const base = buildCsvPreview(text, PREVIEW_ROW_CAP, TEACHER_IMPORT_REQUIRED_COLUMNS)
      const rowValidation = validateTeacherImportCsv(text)
      setPreview({ ...base, rowValidation })
    }
    reader.onerror = () => {
      setError('Lecture du fichier impossible.')
      setPendingFile(null)
      setPreview(null)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const clearFile = useCallback(() => {
    setPendingFile(null)
    setPreview(null)
    setError(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

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

  const runImport = useCallback(async () => {
    if (!pendingFile) return
    setBusy(true)
    setError(null)
    setResult(null)
    setUploadProgress(0)
    try {
      const form = new FormData()
      form.append('file', pendingFile)
      const data = await postTeacherImport(form, {
        headers: { 'Content-Type': undefined },
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          } else {
            setUploadProgress(null)
          }
        },
      })
      setResult(data)
      setUploadProgress(100)
    } catch (e) {
      setError(e?.message ?? 'Import impossible.')
    } finally {
      setBusy(false)
      setTimeout(() => setUploadProgress(null), 400)
    }
  }, [pendingFile])

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) readFilePreview(f)
  }

  const rowIssuesCount = preview?.rowValidation?.totalIssueCount ?? 0
  const canStartImport = Boolean(
    pendingFile &&
      preview &&
      preview.headerIssues.length === 0 &&
      preview.totalDataRows > 0 &&
      rowIssuesCount === 0,
  )

  const importHint =
    preview && pendingFile && !busy
      ? preview.headerIssues.length > 0 || preview.totalDataRows === 0
        ? getImportDisabledHint(preview)
        : rowIssuesCount > 0
          ? 'Corrigez le rapport ci-dessus : les lignes en erreur doivent être corrigées avant l’import serveur.'
          : null
      : null

  const teacherTemplateDetails = (
    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 text-xs text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:text-zinc-400">
      <p className="font-semibold text-zinc-800 dark:text-zinc-200">Colonnes optionnelles (même ordre que le modèle)</p>
      <p className="mt-1 font-mono text-[11px]">gender, phone, teacher_role, grade_code</p>
      <p className="mt-2">
        Format : UTF-8, colonnes séparées par une virgule ou un point-virgule (comme les exports Excel régionaux). Les
        lignes avec matricule ou e-mail déjà présents sont ignorées.
      </p>
      <p className="mt-2">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">teacher_role</span> : laisser vide ou{' '}
        <span className="font-mono text-[11px]">teacher</span>. Les responsabilités (chef de département, directeur…)
        s’attribuent ensuite par nomination.
      </p>
      <p className="mt-1.5">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">grade_code</span> :{' '}
        <span className="font-mono text-[11px]">
          {gradeChoices.length > 0 ? gradeChoices.join(', ') : 'codes référentiel (chargement en cours...)'}
        </span>
      </p>
    </div>
  )

  const stepTwoState = result
    ? 'done'
    : preview && pendingFile && (preview.headerIssues.length > 0 || rowIssuesCount > 0)
      ? 'error'
      : 'current'

  if (!canProvision) {
    return <Navigate to="/teacher/faculty/list" replace />
  }

  return (
    <div className="w-full text-[var(--app-fg)]">
      <ImportPageHeader
        canViewReports={canViewReports}
        backTo="/teacher/faculty/list"
        title="Import enseignants"
        description={
          <>
            CSV UTF-8 — séparateur <strong className="font-semibold">virgule</strong> ou{' '}
            <strong className="font-semibold">point-virgule</strong> — création en masse de fiches enseignant (compte
            inactif jusqu’à activation). Colonnes facultatives dans le modèle : gender, phone, teacher_role,
            grade_code. Taille max. 5 Mo — l’aperçu est vérifié localement avant envoi. Chaque ligne doit avoir
            matricule, prénom, nom et e-mail valide (l’e-mail ne pourra pas être saisi à l’activation).
          </>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <ImportStepCard step={1} title="Modèle CSV" state={pendingFile ? 'done' : 'current'} description="Partez du modèle officiel : les intitulés de colonnes sont ceux attendus par la plateforme.">
            <TemplateSection
              onDownload={downloadTemplate}
              requiredColumns={TEACHER_IMPORT_REQUIRED_COLUMNS}
              detailsSlot={teacherTemplateDetails}
            />
          </ImportStepCard>

          <ImportStepCard step={2} title="Fichier à importer" state={stepTwoState} description="Déposez le fichier rempli : colonnes et lignes sont contrôlées immédiatement, avant tout envoi.">
            <Stack size="md">
              {!pendingFile ? (
                <FileDropzone
                  ref={inputRef}
                  drag={drag}
                  disabled={busy}
                  onDragEnter={() => setDrag(true)}
                  onDragLeave={() => setDrag(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onFileChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) readFilePreview(f)
                  }}
                  onPickClick={() => inputRef.current?.click()}
                />
              ) : (
                <SelectedFileRow
                  file={pendingFile}
                  dataRowCount={preview?.totalDataRows ?? 0}
                  busy={busy}
                  onClear={clearFile}
                />
              )}

              {preview && pendingFile ? (
                <RequiredColumnsMatchList headers={preview.headers} requiredKeys={TEACHER_IMPORT_REQUIRED_COLUMNS} />
              ) : null}

              {busy ? <ImportProgressBlock uploadProgress={uploadProgress} /> : null}

              {preview && pendingFile && !busy ? (
                <Stack size="md">
                  <HeaderIssuesAlert messages={preview.headerIssues} />
                  {preview.headerIssues.length === 0 && preview.rowValidation ? (
                    <TeacherImportRowIssuesPanel rowValidation={preview.rowValidation} />
                  ) : null}
                  <PreviewTablePanel
                    headers={preview.headers}
                    dataRows={preview.dataRows}
                    totalDataRows={preview.totalDataRows}
                    requiredKeys={TEACHER_IMPORT_REQUIRED_COLUMNS}
                  />
                  <ImportActionBar ready={canStartImport} count={preview.totalDataRows} entityLabel="enseignant" hint={importHint} busy={busy} onRun={runImport} />
                </Stack>
              ) : null}
            </Stack>
          </ImportStepCard>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100" role="alert">
              {error}
            </p>
          ) : null}

          {result ? (
            <ImportStepCard step={3} title="Résultat" state={(result?.error_count ?? 0) > 0 ? 'error' : 'done'} description="Bilan de l’import ligne par ligne.">
              <ImportResultPanel result={result} />
            </ImportStepCard>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start" aria-label="Résumé fichier et statut d’import">
          <ImportSidebar
            pendingFile={pendingFile}
            preview={preview}
            busy={busy}
            uploadProgress={uploadProgress}
            result={result}
            globalError={error}
            requiredColumnKeys={TEACHER_IMPORT_REQUIRED_COLUMNS}
          />
        </aside>
      </div>
    </div>
  )
}
