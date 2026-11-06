import { useCallback, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'

import { useAccess } from '@/features/access/model/useAccess'
import { IMPORT_REQUIRED_HEADERS } from '@/features/teacher/students/csvPreview'
import { buildCsvPreview } from '@/features/teacher/students/csvPreview'
import { validateStudentImportCsv } from '@/features/teacher/students/studentCsvValidation'
import { TeacherImportRowIssuesPanel } from '@/features/teacher/faculty/ui/TeacherImportRowIssuesPanel'
import {
  fetchStudentImportTemplateBlob,
  postStudentImport,
} from '@/features/teacher/students/api/studentsApi'
import {
  FileDropzone,
  getImportDisabledHint,
  HeaderIssuesAlert,
  ImportActionBar,
  ImportPageHeader,
  ImportProgressBlock,
  ImportResultPanel,
  ImportResultAlertModal,
  ImportSidebar,
  ImportStepCard,
  PreviewTablePanel,
  RequiredColumnsMatchList,
  SelectedFileRow,
  TemplateSection,
} from '@/features/teacher/students/ui/import'
import { PREVIEW_ROW_CAP } from '@/features/teacher/students/ui/import/import.constants'
import { Stack } from '@/shared/ui/Stack'

export function TeacherStudentsImportPage() {
  const access = useAccess()
  const canImport = access.canManage('students.import')
  const canViewReports = access.canManage('reports.view')
  // Import lancé depuis un programme du référentiel : le département et le programme sont déduits.
  const [searchParams] = useSearchParams()
  const programId = searchParams.get('program') ?? ''
  const requiredHeaders = programId ? IMPORT_REQUIRED_HEADERS.filter((h) => h !== 'department_code') : IMPORT_REQUIRED_HEADERS
  const inputRef = useRef(null)
  const resultRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [error, setError] = useState(null)

  const [pendingFile, setPendingFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const readFilePreview = useCallback((file) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      setError('Veuillez sélectionner un fichier .csv')
      return
    }
    setError(null)
    setResult(null)
    setResultModalOpen(false)
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const base = buildCsvPreview(text, PREVIEW_ROW_CAP, requiredHeaders)
      const rowValidation = validateStudentImportCsv(text, requiredHeaders)
      setPreview({ ...base, rowValidation })
    }
    reader.onerror = () => {
      setError('Lecture du fichier impossible.')
      setPendingFile(null)
      setPreview(null)
    }
    reader.readAsText(file, 'UTF-8')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId])

  const clearFile = useCallback(() => {
    setPendingFile(null)
    setPreview(null)
    setError(null)
    setResult(null)
    setResultModalOpen(false)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const downloadTemplate = useCallback(async () => {
    setError(null)
    try {
      const res = await fetchStudentImportTemplateBlob()
      const data = res.data
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'modele_import_etudiants.csv'
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
    setResultModalOpen(false)
    setUploadProgress(0)
    try {
      const form = new FormData()
      form.append('file', pendingFile)
      if (programId) form.append('program', programId)
      const data = await postStudentImport(form, {
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
      setResultModalOpen(true)
      setUploadProgress(100)
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (e) {
      setError(e?.message ?? 'Import impossible.')
    } finally {
      setBusy(false)
      setTimeout(() => setUploadProgress(null), 400)
    }
  }, [pendingFile, programId])

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) readFilePreview(f)
  }

  const rowIssuesCount = preview?.rowValidation?.totalIssueCount ?? 0
  const importAlreadyDone = Boolean(result)
  const canStartImport =
    Boolean(pendingFile && preview && preview.headerIssues.length === 0 && preview.totalDataRows > 0 && rowIssuesCount === 0) &&
    !importAlreadyDone

  const importHint =
    preview && pendingFile && !busy
      ? importAlreadyDone
        ? 'Import déjà effectué pour ce fichier — chargez un nouveau CSV pour importer à nouveau.'
        : preview.headerIssues.length > 0 || preview.totalDataRows === 0
          ? getImportDisabledHint(preview)
          : rowIssuesCount > 0
            ? 'Corrigez le rapport ci-dessus : les lignes en erreur doivent être corrigées avant l’import serveur.'
            : null
      : null

  const stepTwoState = result
    ? 'done'
    : preview && pendingFile && (preview.headerIssues.length > 0 || rowIssuesCount > 0)
      ? 'error'
      : 'current'

  if (!canImport) {
    return <Navigate to="/teacher/students/list" replace />
  }

  return (
    <div className="w-full text-[var(--app-fg)]">
      <ImportPageHeader canViewReports={canViewReports} />
      {programId ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-[12.5px] text-brand-900 dark:bg-brand-500/10 dark:text-brand-100">
          Import dans un programme : la colonne <span className="font-mono">department_code</span> est facultative, les niveaux sont ceux du programme.
          <Link to={`/referentiel/go?program=${programId}&tab=etudiants`} className="ml-auto font-semibold hover:underline">Revenir au programme</Link>
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <ImportStepCard step={1} title="Modèle CSV" state={pendingFile ? 'done' : 'current'} description="Partez du modèle officiel : les intitulés de colonnes sont ceux attendus par la plateforme.">
            <TemplateSection onDownload={downloadTemplate} />
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

              {preview && pendingFile ? <RequiredColumnsMatchList headers={preview.headers} requiredKeys={requiredHeaders} /> : null}

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
                    requiredKeys={requiredHeaders}
                  />
                  <ImportActionBar ready={canStartImport} count={preview.totalDataRows} entityLabel="étudiant" hint={importHint} busy={busy} onRun={runImport} />
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
              <div ref={resultRef}>
                <ImportResultPanel result={result} />
              </div>
            </ImportStepCard>
          ) : null}
        </div>

        <aside
          className="lg:sticky lg:top-20 lg:self-start"
          aria-label="Résumé fichier et statut d’import"
        >
          <ImportSidebar
            pendingFile={pendingFile}
            preview={preview}
            busy={busy}
            uploadProgress={uploadProgress}
            result={result}
            globalError={error}
            requiredColumnKeys={requiredHeaders}
          />
        </aside>
      </div>

      <ImportResultAlertModal
        open={resultModalOpen}
        result={result}
        entityLabel="étudiant"
        onClose={() => setResultModalOpen(false)}
      />
    </div>
  )
}
