/** Exports des rapports : CSV (ouvrable dans Excel) et PDF (jsPDF, chargé à la demande). */

const fmt = (v) => (v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v))

/** Télécharge un CSV « ; » avec BOM UTF-8 (accents corrects dans Excel). */
export function downloadCsv(filename, header, rows) {
  const escape = (v) => {
    const s = fmt(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const text = [header, ...rows].map((r) => r.map(escape).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Document PDF tabulaire : titre, lignes d'en-tête, puis tables (``[{ head, body, title? }]``).
 * ``orientation`` : ``landscape`` pour les PV larges.
 */
export async function downloadPdf(filename, { title, subtitle = [], tables, orientation = 'portrait', footer }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const width = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(24, 24, 27)
  doc.text(title, 14, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(82, 82, 91)
  let y = 22
  for (const line of subtitle) {
    doc.text(line, 14, y)
    y += 4.8
  }
  y += 2
  for (const t of tables) {
    if (t.title) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(49, 46, 129)
      doc.text(t.title, 14, y + 2)
      y += 5
    }
    autoTable(doc, {
      startY: y,
      head: t.head,
      body: t.body,
      theme: 'grid',
      headStyles: { fillColor: [244, 244, 245], textColor: [39, 39, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center', valign: 'middle' },
      bodyStyles: { fontSize: 7.5, textColor: [24, 24, 27] },
      styles: { cellPadding: 1.6, lineColor: [212, 212, 216], lineWidth: 0.1 },
      margin: { left: 14, right: 14 },
      columnStyles: t.columnStyles ?? {},
    })
    y = (doc.lastAutoTable?.finalY ?? y) + 8
  }
  if (footer) {
    doc.setFontSize(9)
    doc.setTextColor(82, 82, 91)
    doc.text(footer, 14, Math.min(y, doc.internal.pageSize.getHeight() - 20))
  }
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p)
    doc.setFontSize(7.5)
    doc.setTextColor(113, 113, 122)
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} · page ${p}/${pages}`, width - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }
  doc.save(filename)
}

export const fmtNote = (v) => (v == null ? '—' : Number(v).toFixed(2).replace('.', ','))
