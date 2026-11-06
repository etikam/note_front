import { useState } from 'react'
import { UserPlus } from 'lucide-react'

import { MandateDrawer } from '@/features/admin/ui/MandateDrawer'
import { NominationDrawer } from '@/features/admin/ui/NominationDrawer'
import { EntityMandates } from '@/features/admin/ui/StructureMandates'
import { useReferential } from '@/features/referential/model/ReferentialContext'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { SectionCard } from '@/shared/ui/SectionCard'

/** Carte des responsables d'une entité, avec nomination et fiche de mandat. */
export function MandatesCard({ entity, title, className }) {
  const ref = useReferential()
  const [wizard, setWizard] = useState(null)
  const [openMandate, setOpenMandate] = useState(null)
  const nominate = ref.canAssign ? setWizard : null
  return (
    <SectionCard
      title={title}
      className={className}
      actions={
        entity.can?.assign_roles && nominate ? (
          <Button size="sm" variant="ghost" onClick={() => nominate({ level: entity.level, entityId: entity.id })}>
            <UserPlus size={14} aria-hidden /> Nommer
          </Button>
        ) : null
      }
    >
      <EntityMandates
        entity={entity}
        roles={ref.roles}
        onOpen={ref.canAssign ? setOpenMandate : null}
        onNominate={nominate}
        emptyLabel="Aucun responsable nommé."
      />
      {ref.canAssign ? (
        <>
          <NominationDrawer
            open={wizard != null}
            onClose={() => setWizard(null)}
            roles={ref.roles}
            index={ref.index}
            preset={wizard}
            onDone={(m) => {
              dispatchToast({ type: 'success', message: `${m.teacher_name} nommé·e ${m.role_name}.` })
              void ref.refreshMandates()
            }}
          />
          <MandateDrawer assignmentId={openMandate} onClose={() => setOpenMandate(null)} onChanged={() => void ref.refreshMandates()} />
        </>
      ) : null}
    </SectionCard>
  )
}
