import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Spinner } from '@/shared/ui/Spinner'

const SERIES = [
  { key: 'inscrits', dataKey: 'inscrits', label: 'Total inscrits', fill: 'var(--ov-chart-enrolled)' },
  { key: 'admis', dataKey: 'admis', label: 'Total admis', fill: 'var(--ov-chart-passed)' },
  { key: 'dette', dataKey: 'dette', label: 'Admis avec dette', fill: 'var(--ov-chart-debt)' },
]

function formatTick(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return String(n)
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2.5 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-[var(--app-fg)]">{label}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[var(--app-muted)]">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-[var(--app-fg)]">
              {new Intl.NumberFormat('fr-FR').format(entry.value ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChartTooltipWrapper(props) {
  return <ChartTooltip {...props} />
}

export function OverviewLevelChart({ byLevel = [], loading }) {
  const chartData = useMemo(
    () =>
      (byLevel ?? []).map((row) => ({
        name: row.label,
        inscrits: row.enrolled ?? 0,
        admis: row.passed ?? 0,
        dette: row.passed_with_debt ?? 0,
      })),
    [byLevel],
  )

  const showBrush = chartData.length > 8

  return (
    <div
      className="overview-level-chart rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm"
      style={{
        '--ov-chart-enrolled': 'var(--color-brand-500)',
        '--ov-chart-passed': '#22c55e',
        '--ov-chart-debt': '#f59e0b',
      }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--app-fg)]">Statistiques par niveau</h2>
          <p className="mt-0.5 text-xs text-[var(--app-muted)]">
            Survolez les barres pour le détail. Faites défiler l&apos;axe si besoin.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[min(420px,50vh)] items-center justify-center">
          <Spinner size="lg" label="Chargement du graphique" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="flex h-[min(280px,40vh)] items-center justify-center text-sm text-[var(--app-muted)]">
          Aucune donnée pour ces filtres.
        </p>
      ) : (
        <div className="h-[min(420px,55vh)] w-full min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: showBrush ? 28 : 8 }}
              barCategoryGap="18%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.6} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--app-muted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--app-border)' }}
                interval={0}
                angle={chartData.length > 5 ? -32 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 72 : 36}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={formatTick}
                tick={{ fontSize: 11, fill: 'var(--app-muted)' }}
                tickLine={false}
                axisLine={false}
                width={44}
                label={{
                  value: "Nombre d'étudiants",
                  angle: -90,
                  position: 'insideLeft',
                  offset: 12,
                  style: { fontSize: 11, fill: 'var(--app-muted)' },
                }}
              />
              <Tooltip content={<ChartTooltipWrapper />} cursor={{ fill: 'var(--app-nav-hover)', opacity: 0.35 }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
                formatter={(value) => (
                  <span className="text-[var(--app-muted)]">{value}</span>
                )}
              />
              {SERIES.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.dataKey}
                  name={s.label}
                  fill={s.fill}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              ))}
              {showBrush && (
                <Brush
                  dataKey="name"
                  height={24}
                  stroke="var(--color-brand-500)"
                  fill="color-mix(in srgb, var(--app-elevated) 92%, var(--app-canvas))"
                  travellerWidth={10}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
