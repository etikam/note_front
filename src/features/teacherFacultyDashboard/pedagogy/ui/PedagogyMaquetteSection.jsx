import { useEffect, useMemo, useState } from 'react'
import { Download, FilePlus2, Layers, Plus, Printer } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { fetchCoursesList } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'

/**
 * @param {{
 *   yearFocusId: number | null
 *   yearFocusLabel: string | null
 *   canStructure: boolean
 *   unitsForOfferSelect: Array<{ id: number; code: string; name: string; total_credits?: number }>
 *   reloadKey: number
 *   onCreateTeachingUnit: () => void
 *   onOpenTeachingUnit: (unit: { id: number; code: string; name: string; total_credits?: number }, tier?: 'offered' | 'catalog') => void
 * }} props
 */
export function PedagogyMaquetteSection({
  yearFocusId,
  yearFocusLabel,
  canStructure,
  unitsForOfferSelect,
  reloadKey,
  onCreateTeachingUnit,
  onOpenTeachingUnit,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [calendarSemesterFilter, setCalendarSemesterFilter] = useState('')
  const [programSemesterFilter, setProgramSemesterFilter] = useState('')

  useEffect(() => {
    if (!yearFocusId) {
      setRows([])
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await fetchCoursesList({
          academic_year_id: yearFocusId,
          page: 1,
          page_size: 1000,
          ordering: 'code',
        })
        if (!cancelled) setRows(data.results ?? [])
      } catch (e) {
        if (!cancelled) {
          setRows([])
          dispatchToast({ type: 'error', message: e?.message ?? 'Impossible de charger la maquette.' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [yearFocusId, reloadKey])

  const filterOptions = useMemo(() => {
    const departmentMap = new Map()
    const levelMap = new Map()
    const unitMap = new Map()
    const calendarMap = new Map()
    const programSet = new Set()
    for (const row of rows) {
      const deptId = row.department ?? row.department_id ?? null
      const deptCode = row.department_code ?? row.teaching_unit_department_code ?? null
      const deptName = row.department_name ?? row.teaching_unit_department_name ?? null
      const deptKey = deptId != null ? `id:${deptId}` : deptCode ? `code:${deptCode}` : 'unknown'
      const deptLabel = deptName || deptCode || 'Département non renseigné'
      departmentMap.set(deptKey, { id: deptKey, code: deptCode, name: deptLabel })

      if (row.level != null) levelMap.set(String(row.level), row.level_name ?? `Niveau #${row.level}`)
      if (row.teaching_unit != null) {
        unitMap.set(String(row.teaching_unit), {
          id: String(row.teaching_unit),
          code: row.teaching_unit_code ?? 'UE-?',
          name: row.teaching_unit_name ?? 'UE non renseignée',
        })
      }
      if (row.semester != null) calendarMap.set(String(row.semester), row.semester_label ?? `Semestre #${row.semester}`)
      if (row.program_semester != null) programSet.add(String(row.program_semester))
    }
    return {
      departments: Array.from(departmentMap.values()).sort((a, b) =>
        `${a.code ?? ''} ${a.name}`.localeCompare(`${b.code ?? ''} ${b.name}`, 'fr', { sensitivity: 'base' }),
      ),
      levels: Array.from(levelMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr', { sensitivity: 'base' })),
      units: Array.from(unitMap.values()).sort((a, b) =>
        `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`, 'fr', { sensitivity: 'base' }),
      ),
      calendarSemesters: Array.from(calendarMap.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label), 'fr', { sensitivity: 'base' })),
      programSemesters: Array.from(programSet)
        .map((s) => Number(s))
        .sort((a, b) => a - b)
        .map((value) => String(value)),
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      const deptId = row.department ?? row.department_id ?? null
      const deptCode = row.department_code ?? row.teaching_unit_department_code ?? null
      const deptKey = deptId != null ? `id:${deptId}` : deptCode ? `code:${deptCode}` : 'unknown'
      if (departmentFilter && deptKey !== departmentFilter) return false
      if (levelFilter && String(row.level ?? '') !== levelFilter) return false
      if (unitFilter && String(row.teaching_unit ?? '') !== unitFilter) return false
      if (calendarSemesterFilter && String(row.semester ?? '') !== calendarSemesterFilter) return false
      if (programSemesterFilter && String(row.program_semester ?? '') !== programSemesterFilter) return false
      if (!q) return true
      const haystack = [
        row.code,
        row.name,
        row.department_code,
        row.department_name,
        row.level_name,
        row.teaching_unit_code,
        row.teaching_unit_name,
        row.semester_label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, search, departmentFilter, levelFilter, unitFilter, calendarSemesterFilter, programSemesterFilter])

  const grouped = useMemo(() => {
    const normalize = (value) => String(value ?? '').trim().toLowerCase()
    /** @type {Map<string, { departmentKey: string, departmentCode: string, departmentName: string, levels: Map<string, { levelId: number|null, levelName: string, teachingUnits: Map<string, { unitId: number|null, unitCode: string, unitName: string, courses: Array<any>, _courseIds: Set<string> }> }> }>} */
    const byDepartment = new Map()
    for (const c of filteredRows) {
      const departmentId = c.department ?? c.department_id ?? null
      const departmentCode = c.department_code ?? c.teaching_unit_department_code ?? 'DEP-?'
      const departmentName = c.department_name ?? c.teaching_unit_department_name ?? 'Département non renseigné'
      const departmentKey = departmentId != null ? `id:${departmentId}` : departmentCode ? `code:${departmentCode}` : 'unknown'
      if (!byDepartment.has(departmentKey)) {
        byDepartment.set(departmentKey, {
          departmentKey,
          departmentCode,
          departmentName,
          levels: new Map(),
        })
      }
      const departmentGroup = byDepartment.get(departmentKey)

      const levelId = c.level ?? null
      const levelName = c.level_name ?? 'Niveau non renseigné'
      const levelKey = normalize(levelName) || `${levelId ?? 'x'}`
      if (!departmentGroup.levels.has(levelKey)) {
        departmentGroup.levels.set(levelKey, { levelId, levelName, teachingUnits: new Map() })
      }
      const levelGroup = departmentGroup.levels.get(levelKey)
      const unitId = c.teaching_unit ?? null
      const unitCode = c.teaching_unit_code ?? 'UE-?'
      const unitName = c.teaching_unit_name ?? 'UE non renseignée'
      const unitKey = `${normalize(unitCode)}::${normalize(unitName)}` || `${unitId ?? 'x'}::${unitCode}`
      if (!levelGroup.teachingUnits.has(unitKey)) {
        levelGroup.teachingUnits.set(unitKey, { unitId, unitCode, unitName, courses: [], _courseIds: new Set() })
      }
      const ueGroup = levelGroup.teachingUnits.get(unitKey)
      const courseId = String(c.id ?? `${c.code ?? ''}-${c.name ?? ''}`)
      if (!ueGroup._courseIds.has(courseId)) {
        ueGroup._courseIds.add(courseId)
        ueGroup.courses.push(c)
      }
    }
    return Array.from(byDepartment.values())
      .sort((a, b) =>
        `${a.departmentCode} ${a.departmentName}`.localeCompare(`${b.departmentCode} ${b.departmentName}`, 'fr', {
          sensitivity: 'base',
        }),
      )
      .map((department) => ({
        ...department,
        levels: Array.from(department.levels.values())
          .sort((a, b) => String(a.levelName).localeCompare(String(b.levelName), 'fr', { sensitivity: 'base' }))
          .map((lvl) => ({
            ...lvl,
            teachingUnits: Array.from(lvl.teachingUnits.values())
              .map((ue) => ({
                ...ue,
                courses: [...ue.courses].sort((a, b) =>
                  `${a.code ?? ''} ${a.name ?? ''}`.localeCompare(`${b.code ?? ''} ${b.name ?? ''}`, 'fr', {
                    sensitivity: 'base',
                  }),
                ),
              }))
              .sort((a, b) =>
                `${a.unitCode} ${a.unitName}`.localeCompare(`${b.unitCode} ${b.unitName}`, 'fr', {
                  sensitivity: 'base',
                }),
              ),
          })),
      }))
  }, [filteredRows])

  const usedUnitIds = useMemo(() => new Set(filteredRows.map((r) => Number(r.teaching_unit)).filter(Boolean)), [filteredRows])
  const unofferedUnits = useMemo(
    () => unitsForOfferSelect.filter((u) => !usedUnitIds.has(Number(u.id))),
    [unitsForOfferSelect, usedUnitIds],
  )

  const filtersLabel = useMemo(() => {
    const chips = []
    const department = filterOptions.departments.find((x) => x.id === departmentFilter)
    const level = filterOptions.levels.find((x) => x.id === levelFilter)
    const unit = filterOptions.units.find((x) => x.id === unitFilter)
    const calendar = filterOptions.calendarSemesters.find((x) => x.id === calendarSemesterFilter)
    if (department) chips.push(`Département: ${department.code ? `${department.code} - ` : ''}${department.name}`)
    if (level) chips.push(`Niveau: ${level.name}`)
    if (unit) chips.push(`UE: ${unit.code} - ${unit.name}`)
    if (calendar) chips.push(`Sem. calendaire: ${calendar.label}`)
    if (programSemesterFilter) chips.push(`Sem. parcours: S${programSemesterFilter}`)
    if (search.trim()) chips.push(`Recherche: "${search.trim()}"`)
    return chips
  }, [filterOptions, departmentFilter, levelFilter, unitFilter, calendarSemesterFilter, programSemesterFilter, search])

  const renderExportHtml = () => {
    const esc = (value) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
    const sections = grouped
      .map((department) => {
        const levelBlocks = department.levels
          .map((lvl) => {
            const ueBlocks = lvl.teachingUnits
              .map((ue) => {
                const lines = ue.courses
                  .map(
                    (c) => `<tr>
                  <td>${esc(c.code)}</td>
                  <td>${esc(c.name)}</td>
                  <td class="center">${esc(c.credits ?? '—')}</td>
                  <td>${esc(c.semester_label ?? '—')}</td>
                  <td class="center">${c.program_semester != null ? `S${esc(c.program_semester)}` : '—'}</td>
                </tr>`,
                  )
                  .join('')
                return `<article class="ue">
                <div class="ue-head">
                  <div>
                    <p class="ue-code">${esc(ue.unitCode)}</p>
                    <h3>${esc(ue.unitName)}</h3>
                  </div>
                  <p class="ue-count">${esc(ue.courses.length)} matière(s)</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Code</th><th>Matière</th><th>Cr.</th><th>Sem. calendaire</th><th>Sem. parcours</th>
                    </tr>
                  </thead>
                  <tbody>${lines}</tbody>
                </table>
              </article>`
              })
              .join('')
            return `<section class="level">
            <div class="level-head">
              <h2>${esc(lvl.levelName)}</h2>
              <p>${esc(lvl.teachingUnits.reduce((acc, ue) => acc + ue.courses.length, 0))} matière(s)</p>
            </div>
            ${ueBlocks}
          </section>`
          })
          .join('')
        const departmentCount = department.levels.reduce(
          (total, lvl) => total + lvl.teachingUnits.reduce((acc, ue) => acc + ue.courses.length, 0),
          0,
        )
        return `<section class="department">
          <div class="department-head">
            <h2>${esc(department.departmentCode ? `${department.departmentCode} - ${department.departmentName}` : department.departmentName)}</h2>
            <p>${esc(departmentCount)} matière(s)</p>
          </div>
          ${levelBlocks}
        </section>`
      })
      .join('')

    const filters = filtersLabel.length
      ? `<div class="filters">${filtersLabel.map((f) => `<span>${esc(f)}</span>`).join('')}</div>`
      : ''

    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Maquette ${esc(yearFocusLabel ?? `#${yearFocusId}`)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #18181b; font-family: Inter, Arial, sans-serif; }
    .sheet { max-width: 980px; margin: 0 auto; }
    .header { border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 14px; }
    .header .kicker { margin: 0 0 4px; color: #71717a; text-transform: uppercase; letter-spacing: .06em; font-size: 11px; }
    .header h1 { margin: 0; font-size: 22px; font-family: Manrope, Inter, Arial, sans-serif; }
    .header .meta { margin: 8px 0 0; color: #52525b; font-size: 13px; }
    .filters { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .filters span { border: 1px solid #d4d4d8; border-radius: 999px; padding: 3px 8px; font-size: 11px; color: #3f3f46; }
    .level { page-break-inside: avoid; margin-bottom: 18px; }
    .department { page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #e4e4e7; border-radius: 12px; padding: 10px; }
    .department-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d4d4d8; margin-bottom: 8px; }
    .department-head h2 { margin: 0; font-size: 16px; color: #312e81; font-family: Manrope, Inter, Arial, sans-serif; }
    .department-head p { margin: 0 0 4px; font-size: 12px; color: #71717a; }
    .level-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #e4e4e7; margin-bottom: 8px; }
    .level-head h2 { margin: 0; font-size: 18px; font-family: Manrope, Inter, Arial, sans-serif; }
    .level-head p { margin: 0 0 3px; font-size: 12px; color: #71717a; }
    .ue { border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px; margin-bottom: 10px; page-break-inside: avoid; }
    .ue-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .ue-code { margin: 0; font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: #4338ca; font-weight: 700; }
    .ue h3 { margin: 3px 0 0; font-size: 14px; }
    .ue-count { margin: 0; font-size: 11px; color: #71717a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { text-align: left; border-bottom: 1px solid #e4e4e7; padding: 6px 6px 6px 0; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
    tbody td { border-bottom: 1px solid #f4f4f5; padding: 6px 6px 6px 0; vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    .center { text-align: center; }
  </style>
</head>
<body>
  <main class="sheet">
    <header class="header">
      <p class="kicker">Aperçu maquette</p>
      <h1>Plan des enseignements - ${esc(yearFocusLabel ?? `Année #${yearFocusId}`)}</h1>
      <p class="meta">Généré le ${esc(new Date().toLocaleString('fr-FR'))} · ${esc(filteredRows.length)} matière(s) affichée(s)</p>
      ${filters}
    </header>
    ${sections || '<p>Aucune matière pour les filtres sélectionnés.</p>'}
  </main>
</body>
</html>`
  }

  const downloadHtml = () => {
    const html = renderExportHtml()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeYear = String(yearFocusLabel ?? yearFocusId ?? 'maquette').replace(/[^\w-]+/g, '_')
    link.href = url
    link.download = `maquette_${safeYear}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const safeYear = String(yearFocusLabel ?? yearFocusId ?? 'maquette').replace(/[^\w-]+/g, '_')
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text('Aperçu maquette', 14, 12)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(25, 25, 27)
      doc.text(`Plan des enseignements - ${yearFocusLabel ?? `Année #${yearFocusId}`}`, 14, 20, { maxWidth: pageWidth - 28 })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(82, 82, 91)
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} · ${filteredRows.length} matière(s) affichée(s)`, 14, 27)

      let y = 33
      if (filtersLabel.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(63, 63, 70)
        doc.text('Filtres :', 14, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(82, 82, 91)
        for (const chip of filtersLabel) {
          const lines = doc.splitTextToSize(`• ${chip}`, pageWidth - 28)
          doc.text(lines, 14, y)
          y += lines.length * 4.2
        }
        y += 1
      }

      let sectionIndex = 0
      grouped.forEach((department) => {
        department.levels.forEach((lvl) => {
          const index = sectionIndex
          sectionIndex += 1
        if (index > 0) doc.addPage()
        let cursorY = index === 0 ? Math.max(y, 38) : 14

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(67, 56, 202)
        doc.text(
          department.departmentCode ? `${department.departmentCode} - ${department.departmentName}` : department.departmentName,
          14,
          cursorY,
        )
        cursorY += 7

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(24, 24, 27)
        doc.text(lvl.levelName, 14, cursorY)
        cursorY += 3

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(113, 113, 122)
        doc.text(`${lvl.teachingUnits.reduce((acc, ue) => acc + ue.courses.length, 0)} matière(s)`, pageWidth - 14, cursorY - 3, { align: 'right' })
        cursorY += 2

        lvl.teachingUnits.forEach((ue) => {
          autoTable(doc, {
            startY: cursorY + 2,
            head: [['Code', 'Matière', 'Cr.', 'Sem. calendaire', 'Sem. parcours']],
            body: ue.courses.map((c) => [
              c.code ?? '—',
              c.name ?? '—',
              c.credits ?? '—',
              c.semester_label ?? '—',
              c.program_semester != null ? `S${c.program_semester}` : '—',
            ]),
            theme: 'grid',
            headStyles: { fillColor: [244, 244, 245], textColor: [63, 63, 70], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9, textColor: [24, 24, 27] },
            margin: { left: 14, right: 14 },
            styles: { cellPadding: 2.1, lineColor: [228, 228, 231], lineWidth: 0.1 },
            columnStyles: {
              0: { cellWidth: 24 },
              1: { cellWidth: 'auto' },
              2: { cellWidth: 12, halign: 'center' },
              3: { cellWidth: 36 },
              4: { cellWidth: 25, halign: 'center' },
            },
            didDrawPage: () => {
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(10)
              doc.setTextColor(67, 56, 202)
              doc.text(`${ue.unitCode} - ${ue.unitName}`, 14, 8)
            },
          })
          cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 8) + 4
        })
        })
      })

      const pageCount = doc.getNumberOfPages()
      for (let p = 1; p <= pageCount; p += 1) {
        doc.setPage(p)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(113, 113, 122)
        doc.text(`Page ${p}/${pageCount}`, pageWidth - 14, 292, { align: 'right' })
      }

      doc.save(`maquette_${safeYear}.pdf`)
    } catch {
      dispatchToast({ type: 'error', message: 'Impossible de générer le PDF.' })
    }
  }

  if (!yearFocusId) {
    return (
      <Card className="p-8 border border-zinc-200/90 dark:border-[var(--app-border)] text-center text-sm text-zinc-500">
        Sélectionnez une année académique dans l’onglet « Années & semestres » pour construire et prévisualiser la maquette.
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-[var(--app-fg)]">Maquette de l’année {yearFocusLabel ?? `#${yearFocusId}`}</h3>
          <p className="text-sm text-[var(--app-muted)]">
            Vue structurée Département → Niveau → UE → Matières, présentée en mode document pour contrôle pédagogique.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={downloadHtml} disabled={loading}>
            <Download size={14} aria-hidden />
            Télécharger HTML
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={exportPdf} disabled={loading}>
            <Download size={14} aria-hidden />
            Télécharger PDF
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer size={14} aria-hidden />
            Imprimer
          </Button>
          {canStructure ? (
            <Button type="button" variant="primary" size="sm" onClick={onCreateTeachingUnit}>
              <Plus size={14} aria-hidden />
              Nouvelle UE
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-zinc-300/90 dark:border-[var(--app-border)]">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-7">
          <label className="flex flex-col gap-1 lg:col-span-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Recherche</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code, matière, UE..."
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Département</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
            >
              <option value="">Tous</option>
              {filterOptions.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.code ? `${department.code} - ` : ''}{department.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Niveau</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
            >
              <option value="">Tous</option>
              {filterOptions.levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">UE</span>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
            >
              <option value="">Toutes</option>
              {filterOptions.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Sem. calendaire</span>
            <select
              value={calendarSemesterFilter}
              onChange={(e) => setCalendarSemesterFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
            >
              <option value="">Tous</option>
              {filterOptions.calendarSemesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Sem. parcours</span>
            <select
              value={programSemesterFilter}
              onChange={(e) => setProgramSemesterFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]"
            >
              <option value="">Tous</option>
              {filterOptions.programSemesters.map((value) => (
                <option key={value} value={value}>
                  S{value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-[var(--app-border)]">
          <div className="flex flex-wrap items-center gap-2">
            {filtersLabel.length === 0 ? <span>Aucun filtre actif</span> : filtersLabel.map((chip) => <span key={chip} className="rounded-full border border-zinc-300 px-2 py-1 dark:border-[var(--app-border)]">{chip}</span>)}
          </div>
          <div className="flex items-center gap-2">
            <span>{filteredRows.length} matière(s) affichée(s)</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setDepartmentFilter('')
                setLevelFilter('')
                setUnitFilter('')
                setCalendarSemesterFilter('')
                setProgramSemesterFilter('')
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-zinc-300/90 dark:border-[var(--app-border)]">
        <div className="mx-auto w-full max-w-5xl bg-white px-6 py-7 dark:bg-[var(--app-elevated)] sm:px-10">
          <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-[var(--app-border)]">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Aperçu maquette</p>
            <h4 className="font-heading text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Plan des enseignements — {yearFocusLabel ?? `Année #${yearFocusId}`}
            </h4>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Spinner />
            </div>
          ) : grouped.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,black)] dark:text-zinc-400">
              Aucun cours enregistré pour cette année.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((department) => (
                <section key={department.departmentKey} className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-[var(--app-border)]">
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-2 dark:border-[var(--app-border)]">
                    <h5 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {department.departmentCode ? `${department.departmentCode} - ` : ''}{department.departmentName}
                    </h5>
                    <span className="text-xs text-zinc-500">
                      {department.levels.reduce(
                        (total, lvl) => total + lvl.teachingUnits.reduce((acc, ue) => acc + ue.courses.length, 0),
                        0,
                      )}{' '}
                      matière(s)
                    </span>
                  </div>
                  {department.levels.map((lvl) => (
                    <div key={`${department.departmentKey}-${lvl.levelId ?? 'x'}-${lvl.levelName}`} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h6 className="font-medium text-zinc-800 dark:text-zinc-200">{lvl.levelName}</h6>
                        <span className="text-xs text-zinc-500">
                          {lvl.teachingUnits.reduce((acc, ue) => acc + ue.courses.length, 0)} matière(s)
                        </span>
                      </div>
                      {lvl.teachingUnits.map((ue) => (
                    <article key={`${ue.unitId ?? 'x'}-${ue.unitCode}`} className="rounded-lg border border-zinc-200 p-3 dark:border-[var(--app-border)]">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-brand-700 dark:text-brand-300">{ue.unitCode}</p>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">{ue.unitName}</p>
                        </div>
                        {canStructure && ue.unitId ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onOpenTeachingUnit(
                                {
                                  id: ue.unitId,
                                  code: ue.unitCode,
                                  name: ue.unitName,
                                  total_credits: unitsForOfferSelect.find((x) => Number(x.id) === Number(ue.unitId))
                                    ?.total_credits,
                                },
                                'offered',
                              )
                            }
                          >
                            <Layers size={14} aria-hidden />
                            Construire
                          </Button>
                        ) : null}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[36rem] text-left text-sm">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wide text-zinc-500">
                              <th className="py-1.5 pr-2 font-mono">Code</th>
                              <th className="py-1.5 pr-2">Matière</th>
                              <th className="py-1.5 pr-2 text-center">Cr.</th>
                              <th className="py-1.5 pr-2">Sem. calendaire</th>
                              <th className="py-1.5 pr-2 text-center">Sem. parcours</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-[var(--app-border)]">
                            {ue.courses.map((c) => (
                              <tr key={c.id}>
                                <td className="py-1.5 pr-2 font-mono text-xs">{c.code}</td>
                                <td className="py-1.5 pr-2">{c.name}</td>
                                <td className="py-1.5 pr-2 text-center">{c.credits}</td>
                                <td className="py-1.5 pr-2 text-xs text-zinc-500">{c.semester_label ?? '—'}</td>
                                <td className="py-1.5 pr-2 text-center text-xs">{c.program_semester != null ? `S${c.program_semester}` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}

          {unofferedUnits.length > 0 ? (
            <section className="mt-8 border-t border-zinc-200 pt-4 dark:border-[var(--app-border)]">
              <details className="group rounded-xl border border-zinc-200 px-3 py-2 dark:border-[var(--app-border)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <h5 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    UE du catalogue non encore intégrées
                  </h5>
                  <span className="text-xs text-zinc-500">{unofferedUnits.length} UE</span>
                </summary>
                <div className="mt-3 space-y-2 max-h-80 overflow-auto pr-1">
                  {canStructure ? (
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={onCreateTeachingUnit}>
                        <Plus size={14} aria-hidden />
                        Créer une nouvelle UE
                      </Button>
                    </div>
                  ) : null}
                  {unofferedUnits.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-dashed border-zinc-300 px-3 py-2 dark:border-[var(--app-border)]"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{u.code}</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">{u.name}</p>
                      </div>
                      {canStructure ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenTeachingUnit(u, 'catalog')}>
                          <FilePlus2 size={14} aria-hidden />
                          Ajouter des matières
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            </section>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
