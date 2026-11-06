import { Link } from 'react-router-dom'
import { CalendarX2 } from 'lucide-react'

import { refPaths, useReferential } from '@/features/referential/model/ReferentialContext'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'

/** L'entité demandée n'existe pas dans l'année consultée (ou hors du périmètre). */
export function NotInYear({ kind }) {
  const { yearLabel } = useReferential()
  const label = kind === 'program' ? 'Ce programme' : 'Ce département'
  return (
    <SectionCard>
      <EmptyState
        icon={CalendarX2}
        title={`${label} n’existe pas en ${yearLabel ?? 'cette année'}`}
        description="Chaque année a sa propre structure : il a pu être créé plus tard, retiré, ou ne pas encore être reconduit. Changez d’année ou revenez à l’établissement."
        action={
          <Link to={refPaths.home} className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Revenir à l’établissement
          </Link>
        }
      />
    </SectionCard>
  )
}
