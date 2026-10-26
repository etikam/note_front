import { useSearchParams } from 'react-router-dom'
import { BookCopy, FileText, ScrollText } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { BatchTranscripts } from '@/features/notes/ui/BatchTranscripts'
import { IndividualTranscript } from '@/features/notes/ui/IndividualTranscript'
import { TranscriptRegistry } from '@/features/notes/ui/TranscriptRegistry'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusPill } from '@/shared/ui/StatusPill'
import { Tabs } from '@/shared/ui/Tabs'

const TABS = [
  { id: 'student', label: 'Relevé individuel', icon: FileText },
  { id: 'batch', label: 'Par niveau', icon: BookCopy },
  { id: 'registry', label: 'Registre des relevés', icon: ScrollText },
]

/** Relevés de notes officiels : aperçu A4, délivrance numérotée avec QR code, lots, registre. */
export default function TranscriptsPage() {
  const { academicYearLabel } = useAcademicYear()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'student'

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[{ label: 'Notes' }, { label: 'Relevés de notes' }, { label: TABS.find((t) => t.id === tab).label }]}
        title="Relevés de notes"
        description="Relevés établis sur les notes publiées. Un relevé délivré porte un numéro et un QR code : son authenticité se vérifie en ligne."
        meta={academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
      />
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={(id) => {
          const next = new URLSearchParams()
          if (id !== 'student') next.set('tab', id)
          if (id === 'student' && params.get('student')) next.set('student', params.get('student'))
          setParams(next, { replace: true })
        }}
        ariaLabel="Relevés"
      />
      {tab === 'student' ? <IndividualTranscript /> : tab === 'batch' ? <BatchTranscripts /> : <TranscriptRegistry />}
    </div>
  )
}
