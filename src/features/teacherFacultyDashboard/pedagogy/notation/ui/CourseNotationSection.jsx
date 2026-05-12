import { useCallback, useMemo, useState } from 'react'

import {
  fetchCourseGradeImportTemplateBlob,
  fetchCourseGradesExportBlob,
  postCourseGradesImport,
} from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { GradeImportWizardModal } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/GradeImportWizardModal'
import { NotationTable } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationTable'
import { NotationToolbar } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationToolbar'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Card } from '@/shared/ui/Card'

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}

function filenameFromContentDisposition(cd, fallback) {
  if (!cd || typeof cd !== 'string') return fallback
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd)
  return m?.[1]?.trim() || fallback
}

/**
 * @param {{
 *   courseId: string
 *   courseCode?: string
 *   roster: unknown[]
 *   onGradeSaved: (studentId: number, grade: unknown) => void
 *   canPublishGrades: boolean
 *   canEditGrades?: boolean
 *   onRosterReload?: () => Promise<void>
 * }} props
 */
export function CourseNotationSection({
  courseId,
  courseCode = 'cours',
  roster,
  onGradeSaved,
  canPublishGrades,
  canEditGrades = false,
  onRosterReload,
}) {
  const [q, setQ] = useState('')
  const [rowSaving, setRowSaving] = useState(null)
  const [importBusy, setImportBusy] = useState(false)
  const [importWizard, setImportWizard] = useState(
    /** @type {{ data: Record<string, unknown>, fileName: string } | null} */ (null),
  )

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return roster
    return roster.filter((r) => {
      const hay = `${r.matricule} ${r.first_name} ${r.last_name}`.toLowerCase()
      return hay.includes(s)
    })
  }, [q, roster])

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const res = await fetchCourseGradeImportTemplateBlob(courseId)
      const name = filenameFromContentDisposition(
        res.headers?.['content-disposition'],
        `modele_notes_${courseCode}.xlsx`,
      )
      triggerBlobDownload(res.data, name)
    } catch (e) {
      dispatchToast({
        type: 'error',
        message: e?.response?.data?.message ?? e?.message ?? 'Téléchargement impossible.',
      })
    }
  }, [courseCode, courseId])

  const handleExport = useCallback(
    async (fmt) => {
      try {
        const res = await fetchCourseGradesExportBlob(courseId, fmt)
        const ext = fmt === 'pdf' ? 'pdf' : 'xlsx'
        const name = filenameFromContentDisposition(
          res.headers?.['content-disposition'],
          `notes_${courseCode}.${ext}`,
        )
        triggerBlobDownload(res.data, name)
      } catch (e) {
        dispatchToast({
          type: 'error',
          message: e?.response?.data?.message ?? e?.message ?? 'Export impossible.',
        })
      }
    },
    [courseCode, courseId],
  )

  const handleImportFile = useCallback(
    async (file) => {
      setImportBusy(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const data = await postCourseGradesImport(courseId, fd)
        const errN = (data?.errors?.length ?? 0) + (data?.file_errors?.length ?? 0)
        if (errN > 0) {
          dispatchToast({
            type: 'warning',
            message: 'Analyse terminée : des lignes ou le fichier posent problème — voir le rapport.',
          })
        } else {
          dispatchToast({
            type: 'success',
            message: 'Fichier analysé. Vérifiez le résumé puis validez l’import.',
          })
        }
        setImportWizard({ data, fileName: file.name })
      } catch (e) {
        dispatchToast({
          type: 'error',
          message: e?.response?.data?.message ?? e?.response?.data?.detail ?? e?.message ?? 'Analyse refusée.',
        })
      } finally {
        setImportBusy(false)
      }
    },
    [courseId],
  )

  return (
    <Card className="min-w-0 overflow-hidden border border-zinc-200/90 shadow-sm dark:border-[var(--app-border)]">
      <div className="border-b border-zinc-100 bg-zinc-50/90 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
        <div className="px-4 pt-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notation</h2>
          <p className="pb-2 text-xs text-zinc-500">
            Saisie 0–10 · moyenne pondérée 30/30/40 · rattrapage activé par le serveur · enregistrement au blur.
            {canEditGrades ? ' · import Excel : analyse du fichier puis validation avant enregistrement.' : ''}
          </p>
        </div>
        <NotationToolbar
          q={q}
          onQChange={setQ}
          total={roster.length}
          filtered={filtered.length}
          canEditGrades={canEditGrades}
          importBusy={importBusy}
          onDownloadTemplate={handleDownloadTemplate}
          onExportXlsx={() => handleExport('xlsx')}
          onExportPdf={() => handleExport('pdf')}
          onImportFileSelected={handleImportFile}
        />
      </div>
      {roster.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Aucun étudiant inscrit approuvé pour ce cours.
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Aucun étudiant ne correspond à cette recherche.
        </div>
      ) : (
        <NotationTable
          courseId={courseId}
          rows={filtered}
          canPublishGrades={canPublishGrades}
          rowSaving={rowSaving}
          setRowSaving={setRowSaving}
          onGradeSaved={onGradeSaved}
        />
      )}
      <GradeImportWizardModal
        open={importWizard != null}
        onClose={() => setImportWizard(null)}
        courseId={courseId}
        fileName={importWizard?.fileName}
        preview={importWizard?.data ?? null}
        onCommitted={async () => {
          await onRosterReload?.()
        }}
      />
    </Card>
  )
}
