import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Settings2 } from 'lucide-react'

import { fetchReviewQueue } from '@/features/gradeWorkflow/api/gradeWorkflowApi'
import { formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { useAccess } from '@/features/access/model/useAccess'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { StatusPill } from '@/shared/ui/StatusPill'

/** File des fiches de notes qui attendent une action de l'utilisateur (validation ou republication). */
export default function GradeValidationPage() {
  const navigate = useNavigate()
  const access = useAccess()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await fetchReviewQueue())
    } catch (err) {
      setError(err?.message || 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const columns = [
    {
      key: 'course',
      header: 'Cours',
      sortValue: (r) => r.course_code,
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--app-fg)]">{r.course_name}</span>
          <span className="font-mono text-[11px] text-[var(--app-muted)]">{r.course_code}</span>
        </span>
      ),
    },
    {
      key: 'program',
      header: 'Programme',
      sortValue: (r) => r.program_code,
      cell: (r) => (
        <span className="flex flex-col">
          <span>{r.program_code}</span>
          {r.level_name ? <span className="text-[11px] text-[var(--app-muted)]">{r.level_name}</span> : null}
        </span>
      ),
    },
    { key: 'teacher', header: 'Enseignant', sortValue: (r) => r.teacher_name ?? '', cell: (r) => r.teacher_name ?? '—' },
    {
      key: 'step',
      header: 'Étape',
      sortValue: (r) => r.step_index ?? 99,
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          {r.status === 'unlocked' ? (
            <StatusPill tone="warning">À republier</StatusPill>
          ) : (
            <StatusPill tone="info">
              {r.awaiting} · {r.step_index + 1}/{r.steps_count}
            </StatusPill>
          )}
          {r.substitute ? <StatusPill tone="neutral" dot={false}>Suppléance</StatusPill> : null}
        </span>
      ),
    },
    { key: 'submitted', header: 'Soumise le', sortValue: (r) => r.submitted_at ?? '', cell: (r) => formatDateTime(r.submitted_at) || '—' },
  ]

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Pédagogie' }, { label: 'Validation des notes' }]}
        title="Validation des notes"
        description="Fiches de notes qui attendent votre décision. Ouvrez un cours pour relire les notes, puis validez ou renvoyez la fiche avec un motif."
        actions={
          access.can('system.settings') ? (
            <Button as={Link} to="/admin/grade-circuit" variant="ghost">
              <Settings2 size={15} aria-hidden /> Circuit de validation
            </Button>
          ) : null
        }
      />
      <SectionCard flush>
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(r) => r.course_id}
          loading={loading}
          error={error ? { message: error, onRetry: load } : null}
          onRowClick={(r) => navigate(`/teacher/courses/${r.course_id}?tab=grades`)}
          initialSort={{ key: 'submitted', dir: 'asc' }}
          empty={{
            title: 'Rien à valider',
            description: 'Les fiches soumises à votre étape apparaîtront ici.',
          }}
        />
      </SectionCard>
    </div>
  )
}
