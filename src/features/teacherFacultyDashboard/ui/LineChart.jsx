import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  CHART_PERIOD_OPTIONS,
  mapSeriesToPoints,
  sliceSeriesByMonths,
  yToSvg,
} from '@/features/teacherFacultyDashboard/lib/chartUtils'
import { cn } from '@/shared/lib/cn'
import { Field, Select } from '@/shared/ui'

const VIEW = {
  width: 460,
  height: 220,
  padding: { top: 20, right: 14, bottom: 44, left: 52 },
}

function formatYTick(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return ''
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
  if (Math.abs(v) < 10 && v % 1 !== 0) return v.toFixed(1)
  return String(Math.round(v * 100) / 100)
}

/**
 * Courbe en repère (axes + grille) + filtre période par graphique.
 * `values` = série complète 12 mois (mock ou API).
 */
export function LineChart({
  values = [],
  variant = 'accent',
  title,
  subtitle,
  animate = true,
  className,
  defaultPeriodMonths = 6,
}) {
  const uid = useId()
  const gradId = `${uid}-area`
  const [periodMonths, setPeriodMonths] = useState(defaultPeriodMonths)
  const [pathLen, setPathLen] = useState(0)
  const pathRef = useRef(null)

  const { values: slicedRaw, xLabels } = useMemo(
    () => sliceSeriesByMonths(values, periodMonths),
    [values, periodMonths]
  )

  const chartValues = useMemo(() => {
    if (slicedRaw.length === 1) return [slicedRaw[0], slicedRaw[0]]
    return slicedRaw
  }, [slicedRaw])

  const { points, linePath, areaPath, yMin, yMax, ticks } = useMemo(
    () => mapSeriesToPoints(chartValues, VIEW),
    [chartValues]
  )

  useLayoutEffect(() => {
    if (!pathRef.current || !animate) {
      setPathLen(0)
      return
    }
    const len = pathRef.current.getTotalLength?.() ?? 0
    setPathLen(len)
  }, [linePath, animate, periodMonths])

  const bottomY = VIEW.padding.top + (VIEW.height - VIEW.padding.top - VIEW.padding.bottom)
  const innerW = VIEW.width - VIEW.padding.left - VIEW.padding.right
  const axisX1 = VIEW.padding.left
  const axisX2 = VIEW.width - VIEW.padding.right

  function xAtIndex(i, n) {
    if (n <= 1) return VIEW.padding.left + innerW / 2
    return VIEW.padding.left + (i / Math.max(1, n - 1)) * innerW
  }

  const toneClass = `tfd-line-chart--${variant}`

  const xLabelCount = slicedRaw.length

  if (!values?.length) {
    return (
      <div className={cn('tfd-line-chart', toneClass, className)}>
        <div className="tfd-line-chart__toolbar">
          <div className="tfd-line-chart__titles">
            {title ? <p className="tfd-line-chart__title">{title}</p> : null}
            <span className="text-muted">Aucune donnée pour cette série.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('tfd-line-chart', toneClass, className)}>
      <div className="tfd-line-chart__toolbar">
        <div className="tfd-line-chart__titles">
          {title ? <p className="tfd-line-chart__title">{title}</p> : null}
          {subtitle ? <span className="tfd-line-chart__subtitle text-muted">{subtitle}</span> : null}
        </div>
        <Field label="Période" htmlFor={`${uid}-period`} className="tfd-line-chart__period-field">
          <Select
            id={`${uid}-period`}
            className="tfd-line-chart__period-select"
            value={String(periodMonths)}
            onChange={(e) => setPeriodMonths(Number(e.target.value))}
            aria-label="Période affichée sur le graphique"
          >
            {CHART_PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="tfd-line-chart__svg-wrap">
        <svg
          className="tfd-line-chart__svg"
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={title ? `Graphique : ${title}` : 'Graphique'}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--tfd-chart-line)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--tfd-chart-line)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Repère : axes */}
          <line
            x1={axisX1}
            y1={VIEW.padding.top}
            x2={axisX1}
            y2={bottomY}
            className="tfd-line-chart__axis tfd-line-chart__axis--y"
          />
          <line
            x1={axisX1}
            y1={bottomY}
            x2={axisX2}
            y2={bottomY}
            className="tfd-line-chart__axis tfd-line-chart__axis--x"
          />

          {/* Grille horizontale (graduations Y) */}
          {ticks.map((tick, i) => {
            const y = yToSvg(tick, yMin, yMax, VIEW)
            return (
              <g key={`h-${i}`}>
                <line
                  x1={axisX1}
                  y1={y}
                  x2={axisX2}
                  y2={y}
                  className="tfd-line-chart__grid tfd-line-chart__grid--major"
                />
                <text
                  x={axisX1 - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="tfd-line-chart__y-tick"
                >
                  {formatYTick(tick)}
                </text>
              </g>
            )
          })}

          {/* Grille verticale (un trait par mois affiché) */}
          {slicedRaw.map((_, i) => {
            const x = xAtIndex(i, xLabelCount)
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={VIEW.padding.top}
                x2={x}
                y2={bottomY}
                className="tfd-line-chart__grid tfd-line-chart__grid--vertical"
              />
            )
          })}

          {areaPath ? (
            <path d={areaPath} fill={`url(#${gradId})`} className="tfd-line-chart__area" />
          ) : null}

          {linePath ? (
            <path
              ref={pathRef}
              d={linePath}
              fill="none"
              className={cn('tfd-line-chart__line', animate && pathLen > 0 && 'tfd-line-chart__line--animate')}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={
                animate && pathLen > 0 ? { '--tfd-path-len': String(pathLen) } : undefined
              }
            />
          ) : null}

          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3.2} className="tfd-line-chart__dot" />
          ))}

          {/* Axe X : libellés mois (série réelle, pas le doublon technique) */}
          {slicedRaw.length > 0 &&
            slicedRaw.map((_, i) => {
              const x = xAtIndex(i, xLabelCount)
              const label = xLabels[i] ?? ''
              return (
                <text
                  key={`x-${i}`}
                  x={x}
                  y={VIEW.height - 12}
                  textAnchor="middle"
                  className="tfd-line-chart__axis-label"
                >
                  {label}
                </text>
              )
            })}
        </svg>
      </div>
    </div>
  )
}
