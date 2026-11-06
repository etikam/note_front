import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { fetchRoles, fetchStructureTree } from '@/features/access/api/accessApi'
import { useAccess } from '@/features/access/model/useAccess'
import { indexStructure } from '@/features/admin/model/structureIndex'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAuth } from '@/features/auth/model/AuthContext'
import { apiErrorMessage, fetchCurricula } from '@/features/curriculum/api/curriculaApi'

const ReferentialContext = createContext(null)

/**
 * Données du référentiel pour l'année consultée : arbre de structure (responsables, effectifs,
 * droits) et maquettes (statut, contrôles), indexés par **identité** — les adresses restent
 * valables d'une année à l'autre.
 */
export function ReferentialProvider({ children }) {
  const access = useAccess()
  const { refreshMe } = useAuth()
  const { academicYearId, academicYearLabel, academicYears } = useAcademicYear()
  const canAssign = access.canManage('access.assign_roles')
  const canCurricula = access.canManageAny('curriculum.manage', 'curriculum.validate', 'structure.manage')
  const [tree, setTree] = useState(null)
  const [curricula, setCurricula] = useState(null)
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true)
      setError('')
      try {
        const [t, c, r] = await Promise.all([
          fetchStructureTree(),
          canCurricula ? fetchCurricula({ skipErrorToast: true }).catch(() => null) : Promise.resolve(null),
          canAssign ? fetchRoles() : Promise.resolve([]),
        ])
        setTree(t)
        setCurricula(c)
        setRoles(r)
      } catch (err) {
        setError(apiErrorMessage(err, 'Impossible de charger le référentiel.'))
      } finally {
        setLoading(false)
      }
    },
    [canAssign, canCurricula],
  )

  useEffect(() => {
    void load()
  }, [load, academicYearId])

  const value = useMemo(() => {
    const index = indexStructure(tree)
    const curriculumById = new Map((curricula?.programs ?? []).map((p) => [p.id, p]))
    const programs = index.programs.map((p) => ({ ...p, curriculum: curriculumById.get(p.id) ?? null }))
    const programByIdentity = new Map(programs.map((p) => [String(p.identity), p]))
    const programById = new Map(programs.map((p) => [p.id, p]))
    const departments = index.departments.map((d) => {
      const own = programs.filter((p) => p.department.id === d.id)
      const withCurriculum = own.filter((p) => p.curriculum)
      return {
        ...d,
        programs: own,
        readiness: {
          total: withCurriculum.length,
          validated: withCurriculum.filter((p) => p.curriculum.status === 'validated').length,
          errors: withCurriculum.reduce((s, p) => s + p.curriculum.errors, 0),
        },
      }
    })
    const departmentByIdentity = new Map(departments.map((d) => [String(d.identity), d]))
    const departmentById = new Map(departments.map((d) => [d.id, d]))
    const year = (academicYears ?? []).find((y) => String(y.id) === String(academicYearId)) ?? null
    return {
      loading,
      error,
      reload: load,
      refreshMandates: async () => {
        await load({ silent: true })
        await refreshMe()
      },
      tree,
      index,
      roles,
      canAssign,
      canCurricula,
      curricula,
      faculties: index.faculties,
      institution: index.byKey.get('institution') ?? null,
      departments,
      programs,
      departmentByIdentity,
      programByIdentity,
      departmentById,
      programById,
      year,
      yearId: academicYearId,
      yearLabel: academicYearLabel,
      previousYear: curricula?.previous_year ?? null,
      canReconduct: Boolean(curricula?.can?.reconduct),
    }
  }, [tree, curricula, roles, loading, error, load, refreshMe, canAssign, canCurricula, academicYears, academicYearId, academicYearLabel])

  return <ReferentialContext.Provider value={value}>{children}</ReferentialContext.Provider>
}

export function useReferential() {
  const ctx = useContext(ReferentialContext)
  if (!ctx) throw new Error('useReferential hors ReferentialProvider')
  return ctx
}

/** Adresses du référentiel (par identité). */
export const refPaths = {
  home: '/referentiel',
  explorer: '/referentiel/explorer',
  department: (d) => `/referentiel/departements/${d.identity}`,
  program: (p, tab) => `/referentiel/programmes/${p.identity}${tab ? `/${tab}` : ''}`,
}
