import { useMemo } from 'react'

import { groupProgramsByDepartment } from '@/features/academicYear/hooks/usePrograms'
import { Select } from '@/shared/ui/Field'

/**
 * Sélecteur de programme, groupé par département.
 * @param {{ programs: Array<{id:number, code:string, name:string, department:number, department_code:string, department_name:string}>, value: string, onChange: (value: string) => void, placeholder?: string, className?: string, required?: boolean, disabled?: boolean, id?: string }} props
 */
export function ProgramSelect({ programs, value, onChange, placeholder = 'Choisir un programme…', className, required, disabled, id }) {
  const groups = useMemo(() => groupProgramsByDepartment(programs), [programs])
  return (
    <Select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {groups.map((g) => (
        <optgroup key={g.department.id} label={`${g.department.code} — ${g.department.name}`}>
          {g.programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  )
}
