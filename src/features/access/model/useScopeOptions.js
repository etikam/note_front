import { useMemo } from 'react'

import { groupProgramsByDepartment, usePrograms } from '@/features/academicYear/hooks/usePrograms'
import { useAccess } from '@/features/access/model/useAccess'

/**
 * Départements et programmes proposés comme filtres pour une permission : ceux du périmètre
 * de l'utilisateur. Sans périmètre d'entité (seulement « ses cours »), tout est proposé : le
 * serveur restreint de toute façon les résultats.
 *
 * @returns {{ loading: boolean, departments: Array<{id, code, name, programs: any[]}>, programs: any[],
 *   lockedDepartmentId: number|null, lockedProgramId: number|null, programById: Map<number, any> }}
 */
export function useScopeOptions(permission, { enabled = true } = {}) {
  const access = useAccess()
  const { programs, loading } = usePrograms({ enabled })

  return useMemo(() => {
    const scoped = access.canManage(permission)
    const visible = scoped ? programs.filter((p) => access.covers(permission, { program: p })) : programs
    const departments = groupProgramsByDepartment(visible).map((g) => ({ ...g.department, programs: g.programs }))
    const scope = access.scopeOf(permission)
    const wide = Boolean(scope?.institution || scope?.faculty_ids?.length)
    // Un périmètre réduit à une seule entité fixe le filtre (chef d'un département, directeur d'un programme).
    const lockedProgramId = scoped && !wide && visible.length === 1 && !scope?.department_ids?.length ? visible[0].id : null
    const lockedDepartmentId = scoped && !wide && departments.length === 1 && !lockedProgramId ? departments[0].id : null
    return {
      loading,
      departments,
      programs: visible,
      lockedDepartmentId,
      lockedProgramId,
      programById: new Map(visible.map((p) => [p.id, p])),
    }
  }, [access, permission, programs, loading])
}
