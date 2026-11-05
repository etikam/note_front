import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Info, TrendingUp } from 'lucide-react'

import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'
import { fmtNote } from '@/features/notes/model/notesModel'
import { cn } from '@/shared/lib/cn'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const HEIGHT = 250
const PAD = { top: 18, right: 16, bottom: 34, left: 40 }

const signed = (v, digits = 1) => (v == null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits).replace('.', ',')}`)

function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    if (!ref.current) return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return width
}

/** Graduations « rondes » d'un intervalle. */
function ticks(min, max, count = 5) {
  const span = max - min || 1
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 100) / 100)
  return out
}

function TrajectoryChart({ points }) {
  const ref = useRef(null)
  const width = useWidth(ref)
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState(null)

  const geo = useMemo(() => {
    if (!width || !points.length) return null
    const values = points.flatMap((p) => [p.cumulative, p.promo_cumulative]).concat(0)
    let min = Math.min(...values)
    let max = Math.max(...values)
    const pad = Math.max(1, (max - min) * 0.12)
    min -= pad
    max += pad
    const innerW = width - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const step = points.length > 1 ? innerW / (points.length - 1) : 0
    const x = (i) => PAD.left + (points.length > 1 ? i * step : innerW / 2)
    const y = (v) => PAD.top + ((max - v) / (max - min)) * innerH
    const line = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ')
    const area = `${line('cumulative')} L${x(points.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`
    // Un groupe par cours (bandes alternées + code sous l'axe).
    const groups = []
    points.forEach((p, i) => {
      const last = groups[groups.length - 1]
      if (last && last.course_id === p.course_id) last.end = i
      else groups.push({ course_id: p.course_id, code: p.course_code, start: i, end: i })
    })
    return { x, y, line, area, groups, step, innerW, zero: y(0), yTicks: ticks(min, max) }
  }, [width, points])

  const hp = hover != null ? points[hover] : null

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: HEIGHT }} onMouseLeave={() => setHover(null)}>
      {geo ? (
        <svg width={width} height={HEIGHT} role="img" aria-label="Évolution de l’indice de l’étudiant par rapport au seuil et à sa promotion">
          <defs>
            <clipPath id={`above-${uid}`}>
              <rect x="0" y="0" width={width} height={geo.zero} />
            </clipPath>
            <clipPath id={`below-${uid}`}>
              <rect x="0" y={geo.zero} width={width} height={HEIGHT} />
            </clipPath>
          </defs>
          {geo.groups.map((g, i) =>
            i % 2 ? (
              <rect
                key={g.course_id + i}
                x={geo.x(g.start) - geo.step / 2}
                y={PAD.top}
                width={Math.max(geo.step, geo.x(g.end) - geo.x(g.start) + geo.step)}
                height={HEIGHT - PAD.top - PAD.bottom}
                className="fill-[var(--app-subtle)]"
              />
            ) : null,
          )}
          {geo.yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(v)} y2={geo.y(v)} className="stroke-[var(--app-border)]" strokeWidth="1" />
              <text x={PAD.left - 8} y={geo.y(v)} dy="0.32em" textAnchor="end" className="fill-[var(--app-muted)] text-[10.5px] tabular-nums">
                {v > 0 ? `+${v}` : v}
              </text>
            </g>
          ))}
          <path d={geo.area} clipPath={`url(#above-${uid})`} className="fill-brand-500/15 dark:fill-brand-400/20" />
          <path d={geo.area} clipPath={`url(#below-${uid})`} className="fill-red-500/15 dark:fill-red-400/20" />
          <line x1={PAD.left} x2={width - PAD.right} y1={geo.zero} y2={geo.zero} className="stroke-[var(--app-fg)]" strokeOpacity="0.55" strokeWidth="1.25" />
          <text x={width - PAD.right} y={geo.zero - 5} textAnchor="end" className="fill-[var(--app-muted)] text-[10.5px] font-medium">
            seuil de validation
          </text>
          <path d={geo.line('promo_cumulative')} fill="none" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d={geo.line('cumulative')} fill="none" className="stroke-brand-600 dark:stroke-brand-400" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={geo.x(i)}
              cy={geo.y(p.cumulative)}
              r={hover === i ? 5 : 3.5}
              className={cn(
                'stroke-[var(--app-elevated)]',
                p.kind === 'makeup' ? 'fill-secondary-500' : p.deviation < 0 ? 'fill-red-500' : 'fill-brand-600 dark:fill-brand-400',
              )}
              strokeWidth="2"
            />
          ))}
          {geo.groups.map((g, i) => {
            const cx = (geo.x(g.start) + geo.x(g.end)) / 2
            const room = geo.x(g.end) - geo.x(g.start) + geo.step
            return room > 30 || geo.groups.length <= 8 ? (
              <text key={g.course_id + i} x={cx} y={HEIGHT - PAD.bottom + 16} textAnchor="middle" className="fill-[var(--app-muted)] font-mono text-[10px]">
                {g.code.length > 10 ? `${g.code.slice(0, 9)}…` : g.code}
              </text>
            ) : null
          })}
          {hp ? <line x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-[var(--app-fg)]" strokeOpacity="0.25" /> : null}
          {/* Zones de survol plus larges que les points. */}
          {points.map((_, i) => (
            <rect key={`hit-${i}`} x={geo.x(i) - Math.max(8, geo.step / 2)} y={PAD.top} width={Math.max(16, geo.step)} height={HEIGHT - PAD.top - PAD.bottom} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} />
          ))}
        </svg>
      ) : null}
      {hp && geo ? (
        <div
          className="pointer-events-none absolute z-10 w-56 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] p-2.5 text-[12px] shadow-lg"
          style={{ left: Math.min(Math.max(0, geo.x(hover) - 112), width - 224), top: 0 }}
        >
          <p className="truncate font-semibold text-[var(--app-fg)]">{hp.course_name}</p>
          <p className="text-[11px] text-[var(--app-muted)]">
            <span className="font-mono">{hp.course_code}</span> · {hp.label}
            {hp.semester ? ` · S${hp.semester}` : ''}
            {hp.provisional ? ' · provisoire' : ''}
          </p>
          <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 tabular-nums">
            <dt className="text-[var(--app-muted)]">Note</dt>
            <dd className="text-right font-semibold">
              {fmtNote(hp.note)} / {hp.scale_max}
            </dd>
            <dt className="text-[var(--app-muted)]">Promotion</dt>
            <dd className="text-right">{fmtNote(hp.promo_mean)}</dd>
            <dt className="text-[var(--app-muted)]">Écart au seuil</dt>
            <dd className={cn('text-right', hp.deviation < 0 ? 'text-red-700 dark:text-red-300' : 'text-brand-700 dark:text-brand-300')}>{signed(hp.deviation)}</dd>
            <dt className="text-[var(--app-muted)]">Indice cumulé</dt>
            <dd className="text-right font-semibold">{signed(hp.cumulative)}</dd>
          </dl>
        </div>
      ) : null}
    </div>
  )
}

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight }

/**
 * « Observation » de l'étudiant : indice cumulé de ses épreuves autour du seuil (0), comparé à sa
 * promotion, et diagnostic rédigé (tient le cap, décroche, à encourager…).
 */
export function StudentTrajectory({ studentId }) {
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    apiClient
      .get(`${API_PREFIX}/grades/students/${studentId}/trajectory/`, { skipErrorToast: true })
      .then(({ data: d }) => {
        if (cancelled) return
        setData(d)
        setState('ready')
      })
      .catch(() => !cancelled && setState('hidden'))
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (state === 'hidden') return null
  if (state === 'loading') {
    return (
      <SectionCard title="Observation de l’étudiant">
        <SkeletonLines lines={6} />
      </SectionCard>
    )
  }

  const d = data.diagnosis
  const trendDir = d.trend == null ? null : d.trend >= 0.3 ? 'up' : d.trend <= -0.3 ? 'down' : 'flat'
  const TrendIcon = trendDir ? TREND_ICON[trendDir] : Activity

  return (
    <SectionCard
      title="Observation de l’étudiant"
      description="Chaque épreuve fait monter la courbe au-dessus du seuil ou la fait descendre en dessous ; la promotion sert de repère."
      actions={<StatusPill tone={d.tone}>{d.label}</StatusPill>}
    >
      {!data.points.length ? (
        <p className="py-6 text-center text-[13px] text-[var(--app-muted)]">Aucune note encore saisie pour cet étudiant dans votre périmètre.</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0">
            <TrajectoryChart points={data.points} />
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--app-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-5 rounded bg-brand-600 dark:bg-brand-400" aria-hidden /> Indice de l’étudiant
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 border-t-2 border-dashed border-zinc-400" aria-hidden /> Promotion (moyenne des mêmes épreuves)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-secondary-500" aria-hidden /> Rattrapage
              </span>
              <span className="inline-flex items-center gap-1">
                <Info size={12} aria-hidden /> écarts ramenés sur 10 points
              </span>
            </div>
          </div>

          <aside className="flex flex-col gap-3">
            <div
              className={cn(
                'rounded-xl p-3.5 ring-1 ring-inset',
                {
                  success: 'bg-green-50 ring-green-600/15 dark:bg-green-500/10',
                  info: 'bg-brand-50 ring-brand-600/15 dark:bg-brand-500/10',
                  warning: 'bg-secondary-50 ring-secondary-600/20 dark:bg-secondary-500/10',
                  danger: 'bg-red-50 ring-red-600/15 dark:bg-red-500/10',
                  neutral: 'bg-[var(--app-subtle)] ring-[var(--app-border)]',
                }[d.tone],
              )}
            >
              <p className="flex items-center gap-2 font-heading text-[15px] font-semibold text-[var(--app-fg)]">
                <TrendIcon size={17} aria-hidden /> {d.label}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--app-fg-soft)]">{d.advice}</p>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-lg bg-[var(--app-subtle)] px-2.5 py-2">
                <dt className="text-[var(--app-muted)]">Niveau récent</dt>
                <dd className="text-[15px] font-semibold tabular-nums">{signed(d.level)}</dd>
                <span className="text-[10.5px] text-[var(--app-muted)]">pt / épreuve vs seuil</span>
              </div>
              <div className="rounded-lg bg-[var(--app-subtle)] px-2.5 py-2">
                <dt className="text-[var(--app-muted)]">Tendance</dt>
                <dd className="text-[15px] font-semibold tabular-nums">{signed(d.trend, 2)}</dd>
                <span className="text-[10.5px] text-[var(--app-muted)]">pt par épreuve</span>
              </div>
            </dl>
            {d.observations.length ? (
              <ul className="flex flex-col gap-1.5 text-[12.5px] text-[var(--app-fg-soft)]">
                {d.observations.map((o) => (
                  <li key={o} className="flex gap-2">
                    <TrendingUp size={13} className="mt-0.5 shrink-0 text-[var(--app-muted)]" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            ) : null}
            {data.best_course ? (
              <p className="border-t border-[var(--app-border)] pt-2.5 text-[12px] text-[var(--app-muted)]">
                Point fort : <span className="font-medium text-[var(--app-fg)]">{data.best_course.name}</span> ({fmtNote(data.best_course.average)})
                {data.weakest_course ? (
                  <>
                    <br />À travailler : <span className="font-medium text-[var(--app-fg)]">{data.weakest_course.name}</span> ({fmtNote(data.weakest_course.average)})
                  </>
                ) : null}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </SectionCard>
  )
}
