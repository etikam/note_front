import { useCallback, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Play } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { buildCsvPreview } from '@/features/teacher/students/csvPreview'
import {
  fetchStudentImportTemplateBlob,
  postStudentImport,
} from '@/features/teacher/students/api/studentsApi'
import {
  FileDropzone,
  getImportDisabledHint,
  HeaderIssuesAlert,
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
import { Button } from '@/shared/ui/Button'
import { Stack } from '@/shared/ui/Stack'

export function TeacherStudentsImportPage() {
  const { user } = useAuth()
  const canImport = Boolean(user?.capabilities?.can_import_data)
  const canViewReports = Boolean(user?.capabilities?.can_view_reports)
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [result, setResult] = useState(null)
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
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setPreview(buildCsvPreview(text, PREVIEW_ROW_CAP))
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
    setUploadProgress(0)
    try {
      const form = new FormData()
      form.append('file', pendingFile)
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

  const canStartImport =
    Boolean(pendingFile && preview && preview.headerIssues.length === 0 && preview.totalDataRows > 0)

  const importHint = preview && pendingFile && !busy ? getImportDisabledHint(preview) : null

  if (!canImport) {
    return <Navigate to="/teacher/students/list" replace />
  }

  return (
    <div className="w-full max-w-7xl text-zinc-900 dark:text-zinc-100">
      <ImportPageHeader canViewReports={canViewReports} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <ImportStepCard step={1} title="Modèle CSV" accent="brand">
            <TemplateSection onDownload={downloadTemplate} />
          </ImportStepCard>

          <ImportStepCard step={2} title="Fichier à importer" accent="orange">
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

              {preview && pendingFile ? <RequiredColumnsMatchList headers={preview.headers} /> : null}

              {busy ? <ImportProgressBlock uploadProgress={uploadProgress} /> : null}

              {preview && pendingFile && !busy ? (
                <Stack size="md">
                  <HeaderIssuesAlert messages={preview.headerIssues} />
                  <PreviewTablePanel
                    headers={preview.headers}
                    dataRows={preview.dataRows}
                    totalDataRows={preview.totalDataRows}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="primary" disabled={!canStartImport} onClick={runImport}>
                      <Play size={16} aria-hidden />
                      Lancer l’import
                    </Button>
                    {!canStartImport && importHint ? (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{importHint}</span>
                    ) : null}
                  </div>
                </Stack>
              ) : null}
            </Stack>
          </ImportStepCard>

          {error ? (
            <p className="text-error text-sm" role="alert">
              {error}
            </p>
          ) : null}

          {result ? (
            <ImportStepCard step={3} title="Résultat" accent="brand">
              <ImportResultPanel result={result} />
            </ImportStepCard>
          ) : null}
        </div>

        <aside
          className="lg:sticky lg:top-6 lg:self-start"
          aria-label="Résumé fichier et statut d’import"
        >
          <ImportSidebar
            pendingFile={pendingFile}
            preview={preview}
            busy={busy}
            uploadProgress={uploadProgress}
            result={result}
            globalError={error}
          />
        </aside>
      </div>
    </div>
  )
}
