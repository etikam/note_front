import { useId, useMemo } from 'react'

import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

const VIEW = { width: 520, height: 220, padX: 48, padY: 28, padBottom: 52 }

const VARIANTS = ['accent', 'secondary', 'tertiary', 'accent']

function formatTick(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return ''
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`
  return String(Math.round(v))
}

/**
 * Histogramme pour séries catégorielles (labels + valeurs entières).
 * @param {{ key?: string, label: string, value: number }[]} bars
 */
export function HistogramChart({ bars = [], title, subtitle, className, loading = false, emptyMessage }) {
  const uid = useId()

  const { maxY, ticks, norm } = useMemo(() => {
    const values = (bars ?? []).map((b) => Math.max(0, Number(b.value) || 0))
    const rawMax = values.length ? Math.max(...values, 1) : 1
    const nice = Math.ceil(rawMax * 1.08) || 1
    const step = nice <= 5 ? 1 : nice <= 12 ? 2 : Math.ceil(nice / 4)
    const top = Math.max(step * 4, nice)
    const t = []
    for (let y = 0; y <= top; y += step) t.push(y)
    if (t[t.length - 1] < top) t.push(top)
    return {
      maxY: top,
      ticks: t,
      norm: (v) => (top <= 0 ? 0 : Math.max(0, Math.min(1, v / top))),
    }
  }, [bars])

  const innerW = VIEW.width - VIEW.padX * 2
  const innerH = VIEW.height - VIEW.padY - VIEW.padBottom
  const baseY = VIEW.padY + innerH
  const n = bars?.length ?? 0
  const gap = n > 1 ? Math.min(14, innerW * 0.04) : 0
  const barW = n > 0 ? (innerW - gap * (n - 1)) / n : 0

  if (loading) {
    return (
      <div className={cn('tfd-histogram', className)} aria-busy="true">
        <div className="tfd-histogram__toolbar">
          {title ? <p className="tfd-histogram__title">{title}</p> : null}
        </div>
        <div className="tfd-histogram__loading">
          <Spinner size="lg" label="Chargement du graphique" />
        </div>
      </div>
    )
  }

  if (!n) {
    return (
      <div className={cn('tfd-histogram', className)}>
        <div className="tfd-histogram__toolbar">
          {title ? <p className="tfd-histogram__title">{title}</p> : null}
          {subtitle ? <span className="tfd-histogram__subtitle text-muted">{subtitle}</span> : null}
        </div>
        <p className="tfd-histogram__empty text-muted">{emptyMessage ?? 'Aucune donnée à afficher.'}</p>
      </div>
    )
  }

  return (
    <div className={cn('tfd-histogram', className)}>
      <div className="tfd-histogram__toolbar">
        <div className="tfd-histogram__titles">
          {title ? <p className="tfd-histogram__title">{title}</p> : null}
          {subtitle ? <span className="tfd-histogram__subtitle text-muted">{subtitle}</span> : null}
        </div>
      </div>

      <div className="tfd-histogram__svg-wrap">
        <svg
          className="tfd-histogram__svg"
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={title ? `Histogramme : ${title}` : 'Histogramme'}
        >
          <defs>
            {VARIANTS.map((variant, i) => (
              <linearGradient key={variant + i} id={`${uid}-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className={`tfd-histogram__grad-stop tfd-histogram__grad-stop--${variant}-0`} />
                <stop offset="100%" className={`tfd-histogram__grad-stop tfd-histogram__grad-stop--${variant}-1`} />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((tick, i) => {
            const y = baseY - norm(tick) * innerH
            return (
              <g key={`g-${tick}`}>
                <line
                  x1={VIEW.padX}
                  y1={y}
                  x2={VIEW.width - VIEW.padX}
                  y2={y}
                  className="tfd-histogram__grid"
                />
                <text
                  x={VIEW.padX - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="tfd-histogram__y-tick"
                >
                  {formatTick(tick)}
                </text>
              </g>
            )
          })}

          <line
            x1={VIEW.padX}
            y1={VIEW.padY}
            x2={VIEW.padX}
            y2={baseY}
            className="tfd-histogram__axis"
          />
          <line
            x1={VIEW.padX}
            y1={baseY}
            x2={VIEW.width - VIEW.padX}
            y2={baseY}
            className="tfd-histogram__axis"
          />

          {bars.map((b, i) => {
            const v = Math.max(0, Number(b.value) || 0)
            const h = norm(v) * innerH
            const x = VIEW.padX + i * (barW + gap)
            const y = baseY - h
            const variant = VARIANTS[i % VARIANTS.length]
            const rx = Math.min(8, barW * 0.2)
            return (
              <g key={b.key ?? b.label}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(barW, 4)}
                  height={Math.max(h, 0)}
                  rx={rx}
                  ry={rx}
                  fill={`url(#${uid}-bar-${i % VARIANTS.length})`}
                  className={cn('tfd-histogram__bar', `tfd-histogram__bar--${variant}`)}
                />
                {v > 0 ? (
                  <text
                    x={x + barW / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="tfd-histogram__value-label"
                  >
                    {formatTick(v)}
                  </text>
                ) : null}
                <text
                  x={x + barW / 2}
                  y={VIEW.height - 18}
                  textAnchor="middle"
                  className="tfd-histogram__x-label"
                >
                  {b.label.length > 12 ? `${b.label.slice(0, 11)}…` : b.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
