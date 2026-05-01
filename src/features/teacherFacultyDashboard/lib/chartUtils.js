/**
 * Courbe lisse type Catmull-Rom → cubiques de Bézier (SVG path).
 * @param {Array<[number, number]>} points
 * @returns {string} attribut d
 */
export function smoothLinePath(points) {
  if (!points?.length) return ''
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i === 0 ? i : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

export const MONTH_LABELS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

/** Options de filtre période (nombre de derniers mois affichés). */
export const CHART_PERIOD_OPTIONS = [
  { value: 1, label: '1 mois' },
  { value: 2, label: '2 mois' },
  { value: 3, label: '3 mois' },
  { value: 6, label: '6 mois' },
  { value: 12, label: '12 mois' },
]

/**
 * Découpe la série annuelle (12 points, Jan→Déc) sur les N derniers mois.
 */
export function sliceSeriesByMonths(values, monthCount) {
  const full = Array.isArray(values) ? values.map((v) => Number(v)) : []
  const n = clamp(Math.floor(Number(monthCount)) || 12, 1, full.length || 12)
  const slice = full.slice(-n)
  const startIdx = Math.max(0, full.length - n)
  const xLabels = MONTH_LABELS_SHORT.slice(startIdx, startIdx + slice.length)
  return { values: slice, xLabels, startIdx }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

/**
 * Borne Y lisible + graduations (4 intervalles).
 */
export function computeYAxisScale(minVal, maxVal, tickCount = 4) {
  const min = Number(minVal)
  const max = Number(maxVal)
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { yMin: 0, yMax: 1, ticks: [0, 0.25, 0.5, 0.75, 1] }
  }
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1)
    return {
      yMin: min - pad,
      yMax: max + pad,
      ticks: [min - pad, min, min + pad, min + 2 * pad, min + 3 * pad].slice(0, 5),
    }
  }
  const rawSpan = max - min
  const pad = rawSpan * 0.06
  const yMin = min - pad
  const yMax = max + pad
  const span = yMax - yMin
  const ticks = []
  for (let i = 0; i <= tickCount; i += 1) {
    ticks.push(yMin + (i / tickCount) * span)
  }
  return { yMin, yMax, ticks }
}

/**
 * Mappe des valeurs sur la grille avec échelle Y explicite (repère).
 * @param {number[]} xLabels — libellés axe X (même longueur que values)
 */
export function mapSeriesToPoints(values, layout, yScale) {
  const {
    width = 400,
    height = 160,
    padding = { top: 12, right: 12, bottom: 28, left: 12 },
  } = layout

  const safe = Array.isArray(values) ? values.map((v) => Number(v)).filter((n) => Number.isFinite(n)) : []
  if (!safe.length) {
    return { points: [], linePath: '', areaPath: '', yMin: 0, yMax: 1, ticks: [] }
  }

  const dataMin = Math.min(...safe)
  const dataMax = Math.max(...safe)
  const { yMin, yMax, ticks } = yScale ?? computeYAxisScale(dataMin, dataMax, 4)
  const span = yMax - yMin || 1

  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const bottomY = padding.top + innerH

  const pts = safe.map((v, i) => {
    const x = padding.left + (i / Math.max(1, safe.length - 1)) * innerW
    const y = padding.top + (1 - (v - yMin) / span) * innerH
    return [x, y]
  })

  const linePath = smoothLinePath(pts)
  if (!linePath) {
    return { points: pts, linePath: '', areaPath: '', yMin, yMax, ticks }
  }

  const firstX = pts[0][0]
  const lastX = pts[pts.length - 1][0]
  const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`

  return { points: pts, linePath, areaPath, yMin, yMax, ticks }
}

/**
 * Coordonnée Y d'une valeur sur l'échelle (pour dessiner graduations).
 */
export function yToSvg(yValue, yMin, yMax, layout) {
  const { height = 160, padding = { top: 12, bottom: 28 } } = layout
  const innerH = height - padding.top - padding.bottom
  const span = yMax - yMin || 1
  return padding.top + (1 - (yValue - yMin) / span) * innerH
}
