import { Navigate, useSearchParams } from 'react-router-dom'

import { refPaths, useReferential } from '@/features/referential/model/ReferentialContext'
import { NotInYear } from '@/features/referential/ui/NotInYear'

/** ``/referentiel/go?program=<id>`` ou ``?department=<id>`` : adresse par identifiant annuel → adresse par identité. */
export function GoRedirect() {
  const [params] = useSearchParams()
  const ref = useReferential()
  const programId = Number(params.get('program'))
  const departmentId = Number(params.get('department'))
  const tab = params.get('tab') || undefined
  if (programId) {
    const p = ref.programById.get(programId)
    return p ? <Navigate to={refPaths.program(p, tab)} replace /> : <NotInYear kind="program" />
  }
  if (departmentId) {
    const d = ref.departmentById.get(departmentId)
    return d ? <Navigate to={refPaths.department(d)} replace /> : <NotInYear kind="department" />
  }
  return <Navigate to={refPaths.home} replace />
}

/** Anciennes pages « Structure » (``?node=program:12``) et « Référentiel » (``?program=12``). */
export function LegacyReferentialRedirect() {
  const [params] = useSearchParams()
  const node = params.get('node') ?? ''
  const [level, id] = node.split(':')
  const program = params.get('program')
  const tab = params.get('tab')
  if (level === 'program' && id) return <Navigate to={`/referentiel/go?program=${id}`} replace />
  if (level === 'department' && id) return <Navigate to={`/referentiel/go?department=${id}`} replace />
  if (program) return <Navigate to={`/referentiel/go?program=${program}${tab === 'courses' ? '&tab=cours' : '&tab=maquette'}`} replace />
  if (tab === 'calendar') return <Navigate to="/settings/calendar" replace />
  return <Navigate to={refPaths.home} replace />
}
