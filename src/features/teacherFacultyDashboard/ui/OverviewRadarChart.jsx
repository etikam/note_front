import { useId, useMemo, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

const VIEW = { width: 440, height: 280, cx: 220, cy: 118, rMax: 92 }

function formatValue(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
  return String(Math.round(v))
}

/**
 * Radar normalisé (max des catégories = bordure) + valeurs brutes en légende.
 * @param {{ key?: string, label: string, value: number }[]} bars
 */
export function OverviewRadarChart({ bars = [], title, subtitle, className, loading = false, emptyMessage }) {
  const uid = useId()
  const gradId = `${uid}-radar-fill`
  const [hover, setHover] = useState(/** @type {number | null} */ (null))

  const series = useMemo(() => {
    const list = (bars ?? []).map((b) => ({
      key: b.key ?? b.label,
      label: b.label ?? b.key ?? '',
      value: Math.max(0, Number(b.value) || 0),
    }))
    const maxV = list.length ? Math.max(...list.map((x) => x.value), 1) : 1
    return list.map((b) => ({
      ...b,
      norm: maxV <= 0 ? 0 : Math.max(0.08, b.value / maxV),
    }))
  }, [bars])

  const n = series.length
  const points = useMemo(() => {
    if (!n) return []
    const { cx, cy, rMax } = VIEW
    return series.map((s, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
      const r = rMax * s.norm
      return {
        ...s,
        angle,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        lx: cx + (rMax + 22) * Math.cos(angle),
        ly: cy + (rMax + 22) * Math.sin(angle),
        ax: cx + rMax * Math.cos(angle),
        ay: cy + rMax * Math.sin(angle),
      }
    })
  }, [n, series])

  const pathD = useMemo(() => {
    if (!points.length) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z'
  }, [points])

  const ariaSummary = useMemo(() => {
    if (!series.length) return 'Aucune donnée'
    return series.map((s) => `${s.label}: ${formatValue(s.value)}`).join(', ')
  }, [series])

  if (loading) {
    return (
      <div className={cn('flex min-h-[220px] flex-col', className)} aria-busy="true">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
          {title ? <p className="text-sm font-semibold text-[var(--app-fg)]">{title}</p> : null}
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <Spinner size="lg" label="Chargement du graphique" />
        </div>
      </div>
    )
  }

  if (!n) {
    return (
      <div className={cn('flex flex-col', className)}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
          {title ? <p className="text-sm font-semibold text-[var(--app-fg)]">{title}</p> : null}
          {subtitle ? <span className="text-xs text-[var(--app-muted)]">{subtitle}</span> : null}
        </div>
        <p className="py-10 text-center text-sm text-[var(--app-muted)]">{emptyMessage ?? 'Aucune donnée à afficher.'}</p>
      </div>
    )
  }

  const rings = [0.35, 0.62, 1]

  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
        <div>
          {title ? <p className="text-sm font-semibold text-[var(--app-fg)]">{title}</p> : null}
          {subtitle ? <p className="mt-0.5 text-xs text-[var(--app-muted)]">{subtitle}</p> : null}
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          className="mx-auto max-h-[300px] w-full max-w-[min(100%,520px)]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Répartition radar : ${ariaSummary}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.38" />
              <stop offset="100%" stopColor="var(--color-secondary-500)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {rings.map((t, ri) => {
            const rr = VIEW.rMax * t
            const d = points
              .map((p, i) => {
                const a = p.angle
                const x = VIEW.cx + rr * Math.cos(a)
                const y = VIEW.cy + rr * Math.sin(a)
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
              })
              .join(' ')
            return (
              <path
                key={ri}
                d={`${d} Z`}
                fill="none"
                className="stroke-[var(--app-border)] dark:stroke-zinc-600/80"
                strokeWidth={ri === rings.length - 1 ? 1.25 : 0.75}
                opacity={ri === rings.length - 1 ? 0.95 : 0.45}
              />
            )
          })}

          {points.map((p, i) => (
            <line
              key={`spoke-${p.key}`}
              x1={VIEW.cx}
              y1={VIEW.cy}
              x2={p.ax}
              y2={p.ay}
              className="stroke-[var(--app-border)] dark:stroke-zinc-600/70"
              strokeWidth={0.75}
              strokeDasharray="3 4"
              opacity={0.65}
            />
          ))}

          <path
            d={pathD}
            fill={`url(#${gradId})`}
            className="stroke-brand-600 dark:stroke-brand-400"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <g key={`pt-${p.key}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 7 : 5}
                className={cn(
                  'cursor-default stroke-2 transition-all duration-150',
                  hover === i
                    ? 'fill-white stroke-brand-600 dark:fill-zinc-900 dark:stroke-brand-300'
                    : 'fill-brand-500 stroke-white dark:fill-brand-400 dark:stroke-zinc-900',
                )}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <text
                x={p.lx}
                y={p.ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[var(--app-muted)] text-[10px] font-semibold uppercase tracking-wide"
                style={{ fontSize: 10 }}
              >
                {p.label.length > 14 ? `${p.label.slice(0, 12)}…` : p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2 px-1 sm:grid-cols-4" aria-hidden>
        {series.map((s, i) => (
          <li
            key={s.key}
            className={cn(
              'rounded-xl border px-2.5 py-2 text-center transition-colors',
              hover === i
                ? 'border-brand-400/60 bg-brand-500/10 dark:border-brand-500/40'
                : 'border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,transparent)]',
            )}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">{s.label}</p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-[var(--app-fg)]">{formatValue(s.value)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
