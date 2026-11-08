import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Award, CalendarRange, Download, FileClock, GraduationCap, Hourglass, Repeat2, Scale, ShieldAlert, Sparkles } from 'lucide-react'

import { apiErrorMessage } from '@/features/curriculum/api/curriculaApi'
import { downloadPassageCsv, fetchPassagePreview, fetchPassages, postPassage } from '@/features/referential/api/passageApi'
import { useReferential } from '@/features/referential/model/ReferentialContext'
import { formatDate } from '@/features/referential/ui/curriculumBits'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Dialog } from '@/shared/ui/Dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'

const DECISIONS = {
  passed: { label: 'Passe', tone: 'bg-green-50 text-green-800 ring-green-600/20 dark:bg-green-500/10 dark:text-green-200', Icon: ArrowRight },
  forced: { label: 'Passage forcé', tone: 'bg-brand-50 text-brand-800 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-200', Icon: ShieldAlert },
  repeat: { label: 'Redouble', tone: 'bg-secondary-50 text-secondary-800 ring-secondary-600/20 dark:bg-secondary-500/10 dark:text-secondary-200', Icon: Repeat2 },
  graduated: { label: 'Diplômé', tone: 'bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-200', Icon: Award },
  held: { label: 'En attente', tone: 'bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-500/10 dark:text-red-200', Icon: Hourglass },
}

const BLOCKS = {
  even: {
    title: 'Bloc pair',
    semesters: 'S1 → S2 · S3 → S4 · S5 → S6',
    when: 'Mi-année : les étudiants passent au second semestre de leur niveau.',
  },
  odd: {
    title: 'Bloc impair',
    semesters: 'S2 → S3 · S4 → S5 · fin de S6',
    when: 'Rentrée : passage au niveau suivant (nouvelle inscription), redoublement ou diplôme.',
  },
}

function DecisionPill({ decision }) {
  const d = DECISIONS[decision] ?? DECISIONS.held
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset', d.tone)}>
      <d.Icon size={12} aria-hidden /> {d.label}
    </span>
  )
}

/** Décision effective d'une ligne après ajustement. */
function effective(row, ov, parity) {
  if (!ov?.action) return row.decision
  if (ov.action === 'hold') return 'held'
  if (ov.action === 'pass' && row.can_force && ['held', 'repeat'].includes(row.decision)) return 'forced'
  if (ov.action === 'repeat' && parity === 'odd') return 'repeat'
  return row.decision
}

function OverrideCell({ row, value, parity, onChange }) {
  const options = [{ v: '', label: 'Décision proposée' }]
  if (row.can_force && ['held', 'repeat'].includes(row.decision)) options.push({ v: 'pass', label: 'Forcer le passage' })
  if (parity === 'odd' && ['passed', 'held'].includes(row.decision)) options.push({ v: 'repeat', label: 'Faire redoubler' })
  if (row.decision !== 'held') options.push({ v: 'hold', label: 'Mettre en attente' })
  if (options.length === 1) return null
  return (
    <div className="flex min-w-[11rem] flex-col gap-1">
      <select
        value={value?.action ?? ''}
        onChange={(e) => onChange(e.target.value ? { ...value, action: e.target.value } : null)}
        className="h-8 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2 text-[12px]"
        aria-label={`Ajuster la décision de ${row.student.name}`}
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
      {value?.action === 'pass' ? (
        <input
          value={value.justification ?? ''}
          onChange={(e) => onChange({ ...value, justification: e.target.value })}
          placeholder="Justification (obligatoire)"
          className={cn('h-8 rounded-lg border px-2 text-[12px]', value.justification?.trim() ? 'border-[var(--app-border)]' : 'border-red-400')}
        />
      ) : null}
    </div>
  )
}

function Report({ report, onClose }) {
  const t = report.totals
  return (
    <SectionCard
      title={`Passage exécuté — ${report.parity_label}`}
      description={`${report.year.label}${report.source_year ? ` (depuis ${report.source_year.label})` : ''} · ${formatDate(report.executed_at)}${report.executed_by ? ` · ${report.executed_by}` : ''}`}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => downloadPassageCsv(report.id, `passage-${report.year.label}-${report.parity}.csv`)}>
            <Download size={14} aria-hidden /> Rapport CSV
          </Button>
          <Button size="sm" onClick={onClose}>Nouvelle simulation</Button>
        </div>
      }
    >
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {[
          ['Passent', (t.passed ?? 0) + (t.forced ?? 0), 'passed'],
          ['Redoublent', t.repeat ?? 0, 'repeat'],
          ['Diplômés', t.graduated ?? 0, 'graduated'],
          ['En attente', t.held ?? 0, 'held'],
          ['Inscriptions aux cours', t.enrollments ?? 0, null],
          ['Total', t.total ?? 0, null],
        ].map(([label, v, key]) => (
          <div key={label} className="rounded-xl bg-[var(--app-subtle)] px-3 py-2.5">
            <dd className="font-heading text-[20px] font-semibold tabular-nums">{v}</dd>
            <dt className="flex items-center gap-1 text-[11px] text-[var(--app-muted)]">{key ? <DecisionPill decision={key} /> : label}</dt>
          </div>
        ))}
      </dl>
      {report.lines.some((l) => l.decision === 'held') ? (
        <div className="mt-4">
          <h4 className="mb-2 text-[12.5px] font-semibold">Restés en attente</h4>
          <ul className="space-y-1 text-[12.5px]">
            {report.lines.filter((l) => l.decision === 'held').map((l) => (
              <li key={l.student.id} className="flex flex-wrap gap-2">
                <span className="font-mono font-semibold">{l.student.matricule}</span> {l.student.name}
                <span className="text-[var(--app-muted)]">— {l.reasons.join(' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  )
}

function History({ yearId, reloadKey }) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    fetchPassages(yearId, { skipErrorToast: true }).then(setRows).catch(() => setRows([]))
  }, [yearId, reloadKey])
  if (!rows?.length) return null
  return (
    <SectionCard title="Historique des passages" description="Chaque exécution est conservée avec la décision prise pour chaque étudiant.">
      <ul className="divide-y divide-[var(--app-border)]">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[12.5px]">
            <span className="flex items-center gap-2">
              <FileClock size={15} className="text-[var(--app-muted)]" aria-hidden />
              <span className="font-semibold">{p.parity_label}</span>
              <span className="text-[var(--app-muted)]">{formatDate(p.executed_at)}{p.executed_by ? ` · ${p.executed_by}` : ''}</span>
            </span>
            <span className="flex flex-wrap items-center gap-3 text-[12px] tabular-nums text-[var(--app-fg-soft)]">
              <span>{(p.totals.passed ?? 0) + (p.totals.forced ?? 0)} passent</span>
              {p.totals.repeat ? <span>{p.totals.repeat} redoublent</span> : null}
              {p.totals.graduated ? <span>{p.totals.graduated} diplômés</span> : null}
              {p.totals.held ? <span className="text-red-700 dark:text-red-300">{p.totals.held} en attente</span> : null}
              <button type="button" onClick={() => downloadPassageCsv(p.id, `passage-${p.year}-${p.parity}.csv`)} className="flex items-center gap-1 font-medium text-brand-700 hover:underline dark:text-brand-300">
                <Download size={13} aria-hidden /> CSV
              </button>
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

/** Passage de semestre : simulation détaillée, ajustements, exécution et rapport. */
export default function PassagePage() {
  const ref = useReferential()
  const [params, setParams] = useSearchParams()
  const parity = params.get('parity') === 'odd' ? 'odd' : 'even'
  const [data, setData] = useState(null)
  const [overrides, setOverrides] = useState({})
  const [filter, setFilter] = useState('')
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [enroll, setEnroll] = useState(true)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    setData(null)
    setOverrides({})
    try {
      setData(await fetchPassagePreview(ref.yearId, parity, { skipErrorToast: true }))
    } catch (err) {
      setData({ error: apiErrorMessage(err) })
    }
  }, [ref.yearId, parity])

  useEffect(() => {
    if (ref.yearId) void load()
  }, [load, ref.yearId])

  const rows = useMemo(() => data?.rows ?? [], [data])
  const decided = useMemo(() => rows.map((r) => ({ ...r, final: effective(r, overrides[r.student.id], parity) })), [rows, overrides, parity])
  const totals = useMemo(() => {
    const t = {}
    for (const r of decided) t[r.final] = (t[r.final] ?? 0) + 1
    return t
  }, [decided])
  const visible = decided.filter(
    (r) => (!filter || r.final === filter) && (!q || `${r.student.matricule} ${r.student.name}`.toLowerCase().includes(q.toLowerCase())),
  )
  const groups = useMemo(() => {
    const m = new Map()
    for (const r of visible) {
      const key = `${r.program.code} · ${r.from.level}`
      if (!m.has(key)) m.set(key, { key, program: r.program, rows: [] })
      m.get(key).rows.push(r)
    }
    return [...m.values()]
  }, [visible])
  const missingJustification = Object.values(overrides).some((o) => o?.action === 'pass' && !o.justification?.trim())

  const run = async () => {
    setBusy(true)
    try {
      const body = {
        parity,
        enroll,
        note,
        overrides: Object.fromEntries(Object.entries(overrides).filter(([, v]) => v?.action)),
      }
      const res = await postPassage(ref.yearId, body)
      setReport(res)
      setConfirm(false)
      setReloadKey((k) => k + 1)
      dispatchToast({ type: 'success', message: `Passage exécuté : ${res.totals.total ?? 0} étudiant(s) traités.` })
      void ref.reload({ silent: true })
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const rules = data?.rules

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">Passage de semestre · {ref.yearLabel}</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight">Faire avancer les étudiants éligibles</h1>
        <p className="mt-1.5 max-w-3xl text-[13px] text-[var(--app-fg-soft)]">
          À l’ouverture d’un bloc du calendrier, chaque étudiant est examiné selon le règlement : il passe, redouble, est diplômé ou reste en attente.
          Simulez, ajustez si besoin, puis exécutez : le rapport est conservé.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.entries(BLOCKS).map(([id, b]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setReport(null); setParams({ parity: id }, { replace: true }) }}
              className={cn(
                'rounded-2xl border p-4 text-left transition-colors',
                parity === id ? 'border-brand-500 bg-[var(--app-elevated)] shadow-md ring-2 ring-brand-500/20' : 'border-[var(--app-border)] bg-[var(--app-elevated)]/60 hover:border-brand-400/60',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-heading text-[15px] font-semibold"><CalendarRange size={16} aria-hidden /> {b.title}</span>
                {data?.year?.active_parity === id ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase text-green-800 dark:bg-green-500/15 dark:text-green-200">ouvert</span> : null}
              </span>
              <span className="mt-1 block font-mono text-[12px] text-brand-700 dark:text-brand-300">{b.semesters}</span>
              <span className="mt-1 block text-[12px] text-[var(--app-muted)]">{b.when}</span>
            </button>
          ))}
        </div>
        {rules ? (
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--app-fg-soft)]">
            <Scale size={14} className="text-brand-600" aria-hidden />
            <span>{rules.max_debts_same_parity == null ? 'Dettes illimitées' : `≤ ${rules.max_debts_same_parity} dette(s) non soldée(s) sur les semestres de même parité`}</span>
            <span>{rules.block_on_pending_makeup ? 'Un rattrapage non soldé met en attente' : 'Les rattrapages en attente ne bloquent pas'}</span>
            <span>{rules.published_only ? 'Notes publiées seulement' : 'Toutes les notes'}</span>
            <Link to="/settings/regulation" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">Règlement</Link>
          </p>
        ) : null}
      </section>

      {report ? <Report report={report} onClose={() => { setReport(null); void load() }} /> : null}

      {!report ? (
        !data ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : data.error ? (
          <SectionCard><EmptyState tone="error" title="Simulation impossible" description={data.error} onRetry={load} /></SectionCard>
        ) : !rows.length ? (
          <SectionCard>
            <EmptyState
              icon={Sparkles}
              title="Aucun étudiant à faire passer"
              description={
                parity === 'odd'
                  ? data.source_year
                    ? `Aucun étudiant de ${data.source_year.label} en S2, S4 ou S6 n’attend son passage en ${ref.yearLabel}.`
                    : 'Aucune année précédente avec des inscriptions : le bloc impair part des inscriptions de l’année précédente.'
                  : `Aucun étudiant de ${ref.yearLabel} n’est en S1, S3 ou S5.`
              }
            />
          </SectionCard>
        ) : (
          <SectionCard
            flush
            title={`${rows.length} étudiant${rows.length > 1 ? 's' : ''} examiné${rows.length > 1 ? 's' : ''}`}
            description={data.source_year && parity === 'odd' ? `Inscrits en ${data.source_year.label} → ${ref.yearLabel}` : ref.yearLabel}
            actions={
              data.can_execute ? (
                <Button onClick={() => setConfirm(true)} disabled={missingJustification} title={missingJustification ? 'Une justification manque pour un passage forcé.' : undefined}>
                  <GraduationCap size={15} aria-hidden /> Exécuter le passage
                </Button>
              ) : (
                <span className="text-[12px] text-[var(--app-muted)]">Exécution réservée à la direction</span>
              )
            }
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--app-border)] p-3">
              <button type="button" onClick={() => setFilter('')} className={cn('rounded-full px-3 py-1 text-[12px] font-medium ring-1 ring-inset', !filter ? 'bg-[var(--app-fg)] text-[var(--app-elevated)] ring-transparent' : 'ring-[var(--app-border)]')}>
                Tous {rows.length}
              </button>
              {Object.keys(DECISIONS).filter((k) => totals[k]).map((k) => (
                <button key={k} type="button" onClick={() => setFilter(filter === k ? '' : k)} className={cn('rounded-full ring-offset-1', filter === k && 'ring-2 ring-brand-500')}>
                  <span className="flex items-center gap-1"><DecisionPill decision={k} /><span className="pr-1 text-[12px] font-semibold tabular-nums">{totals[k]}</span></span>
                </button>
              ))}
              <SearchInput value={q} onChange={setQ} placeholder="Matricule ou nom" className="ml-auto max-w-xs" />
            </div>
            {groups.map((g) => (
              <div key={g.key}>
                <h4 className="bg-[var(--app-subtle)]/60 px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                  {g.program.department} · {g.key}
                </h4>
                <table className="w-full text-[13px]">
                  <tbody>
                    {g.rows.map((r) => (
                      <tr key={r.student.id} className="border-b border-[var(--app-border)] align-top last:border-0">
                        <td className="w-[14rem] px-4 py-2.5">
                          <Link to={`/teacher/students/${r.student.id}`} className="font-medium hover:underline">{r.student.name}</Link>
                          <span className="block font-mono text-[11px] text-[var(--app-muted)]">{r.student.matricule}{r.status === 'repeating' ? ' · redoublant' : ''}</span>
                        </td>
                        <td className="w-[11rem] px-2 py-2.5 text-[12px] tabular-nums">
                          S{r.from.semester}
                          {r.to.semester ? <> <ArrowRight size={11} className="inline text-[var(--app-muted)]" aria-hidden /> S{r.to.semester}{r.to.level && r.to.level !== r.from.level ? <span className="text-[var(--app-muted)]"> · {r.to.level}</span> : null}</> : null}
                        </td>
                        <td className="w-[9rem] px-2 py-2.5"><DecisionPill decision={r.final} /></td>
                        <td className="px-2 py-2.5 text-[12px] leading-snug text-[var(--app-fg-soft)]">{r.reasons.join(' ') || '—'}</td>
                        <td className="px-4 py-2.5">
                          {data.can_execute ? (
                            <OverrideCell row={r} parity={parity} value={overrides[r.student.id]} onChange={(v) => setOverrides((o) => ({ ...o, [r.student.id]: v }))} />
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {!groups.length ? <EmptyState compact title="Aucun étudiant pour ce filtre" /> : null}
          </SectionCard>
        )
      ) : null}

      <History yearId={ref.yearId} reloadKey={reloadKey} />

      <Dialog
        open={confirm}
        onClose={busy ? () => {} : () => setConfirm(false)}
        icon={GraduationCap}
        title={`Exécuter le passage — ${BLOCKS[parity].title.toLowerCase()}`}
        description="Les inscriptions sont mises à jour et le bloc est ouvert pour l’année. Les étudiants en attente pourront être repris par un nouveau passage."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)} disabled={busy}>Annuler</Button>
            <Button onClick={run} disabled={busy}>{busy ? 'Exécution…' : 'Exécuter'}</Button>
          </div>
        }
      >
        <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {['passed', 'forced', 'repeat', 'graduated', 'held'].filter((k) => totals[k]).map((k) => (
            <div key={k} className="rounded-lg bg-[var(--app-subtle)] px-3 py-2">
              <dd className="font-heading text-[18px] font-semibold tabular-nums">{totals[k]}</dd>
              <dt><DecisionPill decision={k} /></dt>
            </div>
          ))}
        </dl>
        <Checkbox
          checked={enroll}
          onChange={setEnroll}
          label={<span className="text-[13px] font-medium">Inscrire aux cours du semestre d’arrivée</span>}
          description="Un redoublant n’est inscrit qu’aux cours qu’il n’a pas encore validés."
        />
        <label className="mt-3 block text-[12.5px] font-medium">
          Note pour le rapport <span className="font-normal text-[var(--app-muted)]">(facultatif)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-1 h-9 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px]" placeholder="Ex. Après le jury du 2 février" />
        </label>
      </Dialog>
    </div>
  )
}
