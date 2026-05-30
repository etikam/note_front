import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FileSearch } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { canAdminGradeImport } from '@/core/accessControl'
import {
  fetchCourseGradeImportTemplateBlob,
  postCourseAdminGradesImport,
  postCourseAdminGradesImportCommit,
} from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { AdminGradeImportResultPanel } from '@/features/teacher/students/ui/gradesImport/AdminGradeImportResultPanel'
import { GradeImportAnalysisPanel } from '@/features/teacher/students/ui/gradesImport/GradeImportAnalysisPanel'
import {
  buildConflictDecisions,
  conflictsAllResolved,
  GradeImportConflictResolution,
} from '@/features/teacher/students/ui/gradesImport/GradeImportConflictResolution'
import {
  defaultAdminValidationStatus,
  GradeImportCommitSection,
} from '@/features/teacher/students/ui/gradesImport/GradeImportCommitSection'
import { GradeImportCourseSelector } from '@/features/teacher/students/ui/gradesImport/GradeImportCourseSelector'
import { GRADE_IMPORT_TEMPLATE_COLUMNS } from '@/features/teacher/students/ui/gradesImport/gradeImport.constants'
import { canLaunchGradeImport, gradeImportLaunchHint } from '@/features/teacher/students/ui/gradesImport/gradeImport.utils'
import {
  FileDropzone,
  ImportPageHeader,
  ImportProgressBlock,
  ImportStepCard,
  SelectedFileRow,
  TemplateSection,
} from '@/features/teacher/students/ui/import'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Stack } from '@/shared/ui/Stack'

function filenameFromContentDisposition(cd, fallback) {
  if (!cd || typeof cd !== 'string') return fallback
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd)
  return m?.[1]?.trim() || fallback
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * @param {{ embedded?: boolean }} props — `embedded` : sous-onglet du dashboard (sans en-tête retour).
 */
export function TeacherGradesImportPage({ embedded = false }) {
  const { user } = useAuth()
  const allowed = canAdminGradeImport(user)
  const inputRef = useRef(null)
  const analysisRef = useRef(null)

  const [departmentId, setDepartmentId] = useState('')
  const [semester, setSemester] = useState('')
  const [courseId, setCourseId] = useState('')
  const [courseMeta, setCourseMeta] = useState(null)
  const [validationStatus, setValidationStatus] = useState(() => defaultAdminValidationStatus(user))
  const [published, setPublished] = useState(false)

  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [error, setError] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [commitResult, setCommitResult] = useState(null)
  const [conflictChoices, setConflictChoices] = useState({})
  const [partialConfirmOpen, setPartialConfirmOpen] = useState(false)

  const selectedCourse = courseId.trim().length > 0
  const courseLabel = courseMeta ? `${courseMeta.code} — ${courseMeta.name}` : ''

  const conflicts = useMemo(
    () => (Array.isArray(analysis?.conflicts) ? analysis.conflicts : []),
    [analysis],
  )
  const rowErrors = useMemo(
    () => (Array.isArray(analysis?.errors) ? analysis.errors : []),
    [analysis],
  )

  useEffect(() => {
    setAnalysis(null)
    setConflictChoices({})
  }, [courseId, departmentId, semester])

  const resetForAnotherImport = useCallback(() => {
    setDepartmentId('')
    setSemester('')
    setCourseId('')
    setCourseMeta(null)
    setPendingFile(null)
    setAnalysis(null)
    setCommitResult(null)
    setConflictChoices({})
    setError(null)
    setValidationStatus(defaultAdminValidationStatus(user))
    setPublished(false)
    if (inputRef.current) inputRef.current.value = ''
  }, [user])

  const clearFile = useCallback(() => {
    setPendingFile(null)
    setError(null)
    setAnalysis(null)
    setConflictChoices({})
    setCommitResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const readFile = useCallback((file) => {
    if (!file || !file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Veuillez sélectionner un fichier .xlsx')
      return
    }
    setError(null)
    setCommitResult(null)
    setPendingFile(file)
    setAnalysis(null)
    setConflictChoices({})
  }, [])

  const downloadTemplate = useCallback(async () => {
    if (!courseId) {
      setError('Choisissez d’abord un cours.')
      return
    }
    setError(null)
    try {
      const res = await fetchCourseGradeImportTemplateBlob(courseId)
      const data = res.data
      const blob = data instanceof Blob ? data : new Blob([data])
      const name = filenameFromContentDisposition(
        res.headers?.['content-disposition'],
        'modele_import_notes.xlsx',
      )
      triggerBlobDownload(blob, name)
    } catch (e) {
      setError(e?.message ?? 'Téléchargement impossible.')
    }
  }, [courseId])

  const runPreview = useCallback(async () => {
    if (!pendingFile || !courseId) return
    setBusy(true)
    setError(null)
    setCommitResult(null)
    setAnalysis(null)
    setConflictChoices({})
    setUploadProgress(0)
    try {
      const form = new FormData()
      form.append('file', pendingFile)
      const data = await postCourseAdminGradesImport(courseId, form, {
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        },
      })
      setAnalysis(data)
      const errN = (data?.errors?.length ?? 0) + (data?.file_errors?.length ?? 0)
      if (!data?.header_report?.headers_valid) {
        dispatchToast({
          type: 'error',
          message: 'Colonnes invalides — corrigez le fichier selon le rapport.',
        })
      } else if (errN > 0) {
        dispatchToast({
          type: 'warning',
          message: 'Analyse terminée : consultez le rapport (certaines lignes sont rejetées).',
        })
      } else if (!canLaunchGradeImport(data)) {
        dispatchToast({
          type: 'info',
          message: data?.detail ?? 'Aucune donnée importable pour ce fichier.',
        })
      } else {
        dispatchToast({
          type: 'success',
          message: 'Analyse terminée. Vérifiez le récapitulatif puis validez.',
        })
      }
      requestAnimationFrame(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (e) {
      setError(e?.response?.data?.detail ?? e?.message ?? 'Analyse refusée.')
    } finally {
      setBusy(false)
      setTimeout(() => setUploadProgress(null), 400)
    }
  }, [pendingFile, courseId])

  const performCommit = useCallback(async () => {
    if (!analysis?.batch_public_id || !courseId) return
    setCommitting(true)
    setError(null)
    try {
      const body = {
        batch_public_id: analysis.batch_public_id,
        validation_status: validationStatus,
        published,
      }
      if (conflicts.length) {
        body.decisions = buildConflictDecisions(conflicts, conflictChoices)
      }
      const out = await postCourseAdminGradesImportCommit(courseId, body)
      setCommitResult(out)
      dispatchToast({ type: 'success', message: 'Import des notes enregistré.' })
    } catch (e) {
      const msg = e?.response?.data?.detail ?? e?.message ?? 'Validation impossible.'
      setError(msg)
      dispatchToast({ type: 'error', message: msg })
      throw e
    } finally {
      setCommitting(false)
    }
  }, [analysis, courseId, validationStatus, published, conflicts, conflictChoices])

  const requestCommit = useCallback(() => {
    if (!canLaunchGradeImport(analysis)) return
    if (!conflictsAllResolved(conflicts, conflictChoices)) return
    if (rowErrors.length > 0) {
      setPartialConfirmOpen(true)
      return
    }
    void performCommit()
  }, [analysis, conflicts, conflictChoices, rowErrors.length, performCommit])

  if (!allowed) {
    return <Navigate to={embedded ? '/teacher/dashboard' : '/teacher/students/list'} replace />
  }

  const canAnalyze = Boolean(pendingFile && courseId && selectedCourse && !busy && !commitResult)
  const canCommit =
    canLaunchGradeImport(analysis) &&
    conflictsAllResolved(conflicts, conflictChoices) &&
    !busy &&
    !committing &&
    !commitResult
  const commitHint = !conflictsAllResolved(conflicts, conflictChoices)
    ? 'Résolvez tous les conflits avant de valider.'
    : gradeImportLaunchHint(analysis)

  return (
    <div className="w-full max-w-7xl text-zinc-900 dark:text-zinc-100">
      {embedded ? (
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Importez les notes d’un cours à partir d’un fichier Excel. Les étudiants du fichier seront inscrits au
          cours si nécessaire, sans contrôle d’éligibilité.
        </p>
      ) : (
        <ImportPageHeader
          title="Import des notes"
          description={
            <>
              Importez les notes d’un cours passé ou en cours à partir d’un fichier Excel. Les étudiants du
              fichier seront inscrits au cours si nécessaire. Réservé au directeur des études et au directeur
              général.
            </>
          }
        />
      )}

      <div className={embedded ? 'flex flex-col gap-8' : 'mt-8 flex flex-col gap-8'}>
        <ImportStepCard step={1} title="Cible" accent="brand">
          <GradeImportCourseSelector
            departmentId={departmentId}
            onDepartmentIdChange={setDepartmentId}
            semester={semester}
            onSemesterChange={setSemester}
            courseId={courseId}
            onCourseIdChange={setCourseId}
            onCourseMetaChange={setCourseMeta}
            disabled={busy || committing}
          />
        </ImportStepCard>

        <ImportStepCard step={2} title="Modèle Excel" accent="brand">
          <TemplateSection
            onDownload={downloadTemplate}
            requiredColumns={GRADE_IMPORT_TEMPLATE_COLUMNS}
            detailsSlot={
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Colonnes : matricule (obligatoire), nom, prénom (indicatifs), note1, note2, note3 (0–10, vides
                autorisées). Le modèle est prérempli avec les inscrits actuels du cours.
              </p>
            }
          />
          {!selectedCourse ? (
            <p className="text-sm text-zinc-500">Sélectionnez un cours à l’étape 1 pour télécharger le modèle.</p>
          ) : null}
        </ImportStepCard>

        <ImportStepCard step={3} title="Fichier à importer" accent="orange">
          <Stack size="md">
            {!pendingFile ? (
              <FileDropzone
                ref={inputRef}
                drag={drag}
                disabled={busy || !selectedCourse}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                fileKindLabel="Excel"
                inputAriaLabel="Sélectionner un fichier Excel"
                onDragEnter={() => setDrag(true)}
                onDragLeave={() => setDrag(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDrag(false)
                  const f = e.dataTransfer?.files?.[0]
                  if (f) readFile(f)
                }}
                onFileChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) readFile(f)
                }}
                onPickClick={() => inputRef.current?.click()}
              />
            ) : (
              <SelectedFileRow file={pendingFile} busy={busy} onClear={clearFile} />
            )}

            {busy ? <ImportProgressBlock uploadProgress={uploadProgress} /> : null}

            {pendingFile && selectedCourse && !busy ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="primary" disabled={!canAnalyze} onClick={runPreview}>
                  <FileSearch size={16} aria-hidden />
                  Analyser le fichier
                </Button>
                {commitResult ? (
                  <span className="text-sm text-zinc-500">Import déjà effectué — chargez un nouveau fichier.</span>
                ) : null}
              </div>
            ) : null}
          </Stack>
        </ImportStepCard>

        {analysis ? (
          <div ref={analysisRef}>
            <ImportStepCard step={4} title="Rapport et validation" accent="orange">
              <Stack size="md">
                <GradeImportAnalysisPanel analysis={analysis} />
                {conflicts.length ? (
                  <GradeImportConflictResolution
                    key={String(analysis.batch_public_id)}
                    conflicts={conflicts}
                    disabled={committing || Boolean(commitResult)}
                    onChoicesChange={setConflictChoices}
                  />
                ) : null}
                {!commitResult ? (
                  <GradeImportCommitSection
                    courseLabel={courseLabel}
                    fileName={pendingFile?.name ?? ''}
                    analysis={analysis}
                    validationStatus={validationStatus}
                    onValidationStatusChange={setValidationStatus}
                    published={published}
                    onPublishedChange={setPublished}
                    disabled={busy}
                    canCommit={canCommit}
                    commitHint={commitHint}
                    committing={committing}
                    onCommit={requestCommit}
                  />
                ) : null}
              </Stack>
            </ImportStepCard>
          </div>
        ) : null}

        {error ? (
          <p className="text-error text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {commitResult ? (
          <ImportStepCard step={5} title="Résultat" accent="brand">
            <AdminGradeImportResultPanel
              result={commitResult}
              courseId={courseId}
              courseLabel={courseLabel}
              fileName={pendingFile?.name ?? ''}
              validationStatus={validationStatus}
              published={published}
              onStartAnother={resetForAnotherImport}
            />
          </ImportStepCard>
        ) : null}
      </div>

      <ConfirmModal
        open={partialConfirmOpen}
        onClose={() => setPartialConfirmOpen(false)}
        title="Import partiel"
        message={`${rowErrors.length} ligne(s) du fichier seront ignorées (matricule invalide ou doublon). Les autres lignes seront importées. Continuer ?`}
        confirmLabel="Continuer l’import"
        cancelLabel="Annuler"
        variant="primary"
        onConfirm={performCommit}
      />
    </div>
  )
}
