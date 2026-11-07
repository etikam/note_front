import { Link } from 'react-router-dom'
import { FileWarning, Hourglass, UserRound, Wallet } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'

const SHEET = { draft: 'En saisie', review: 'En validation', unlocked: 'Rouverte pour correction' }

const fmt = (n) => (n == null ? '—' : String(n).replace('.', ','))

function Section({ icon: Icon, title, count, tone, children, hint }) {
  return (
    <section className="rounded-xl border border-[var(--app-border)]">
      <header className={cn('flex items-center justify-between gap-2 rounded-t-xl px-4 py-2.5', tone)}>
        <h3 className="flex items-center gap-2 text-[13px] font-semibold"><Icon size={15} aria-hidden /> {title}</h3>
        <span className="text-[12px] font-semibold tabular-nums">{count}</span>
      </header>
      {hint ? <p className="border-b border-[var(--app-border)] px-4 py-2 text-[11.5px] text-[var(--app-muted)]">{hint}</p> : null}
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

function GradesTable({ rows }) {
  return (
    <table className="w-full text-[12.5px]">
      <thead className="text-left text-[10.5px] uppercase tracking-wider text-[var(--app-muted)]">
        <tr className="border-b border-[var(--app-border)]">
          <th className="px-4 py-1.5 font-semibold">Cours</th>
          <th className="px-2 py-1.5 font-semibold">UE</th>
          <th className="px-2 py-1.5 font-semibold">Année · semestre</th>
          <th className="px-2 py-1.5 text-right font-semibold">Crédits</th>
          <th className="px-4 py-1.5 text-right font-semibold">Moyenne</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={`${r.year}-${r.course}`} className="border-b border-[var(--app-border)] last:border-0">
            <td className="px-4 py-2"><span className="font-mono text-[11.5px] font-semibold">{r.course}</span> {r.course_name}</td>
            <td className="px-2 py-2 text-[var(--app-fg-soft)]"><span className="font-mono text-[11px]">{r.unit}</span> {r.unit_name}</td>
            <td className="px-2 py-2 tabular-nums text-[var(--app-fg-soft)]">{r.year}{r.semester ? ` · S${r.semester}` : ''}</td>
            <td className="px-2 py-2 text-right tabular-nums">{r.credits}</td>
            <td className="px-4 py-2 text-right font-semibold tabular-nums">{fmt(r.average)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Pourquoi un finissant ne peut pas (encore) recevoir son diplôme : notes en attente, dettes, rattrapages. */
export function GraduateBlockersDialog({ student, onClose }) {
  if (!student) return null
  const { debts, pending, unpublished } = student.blockers
  const { acquired, required } = student.credits
  const ratio = required ? Math.min(1, acquired / required) : 0

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      icon={UserRound}
      title={student.name}
      description={`${student.matricule} · ${student.program.code} — ${student.program.name} · ${student.level} · S${student.semester}${student.status === 'repeating' ? ' · redoublant' : ''}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" as={Link} to={`/teacher/students/${student.id}`}>Ouvrir la fiche</Button>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-[var(--app-subtle)]/70 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[12.5px] font-semibold">Crédits acquis sur le cycle</p>
            <p className="font-heading text-[18px] font-semibold tabular-nums">
              {acquired}<span className="text-[13px] text-[var(--app-muted)]"> / {required}</span>
            </p>
          </div>
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[var(--app-elevated)]" aria-hidden>
            <span className={cn('block h-full rounded-full', ratio >= 1 ? 'bg-green-500' : 'bg-brand-500')} style={{ width: `${ratio * 100}%` }} />
          </span>
          <p className="mt-2 text-[12px] text-[var(--app-fg-soft)]">{student.detail}</p>
        </div>

        {unpublished.length ? (
          <Section
            icon={FileWarning}
            title="Notes non encore publiées"
            count={unpublished.length}
            tone="bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-100"
            hint="Le résultat ne pourra être connu qu’une fois ces fiches publiées."
          >
            <ul className="divide-y divide-[var(--app-border)]">
              {unpublished.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[12.5px]">
                  <Link to={`/teacher/courses/${c.id}`} className="hover:underline">
                    <span className="font-mono text-[11.5px] font-semibold">{c.course}</span> {c.course_name}{c.semester ? <span className="text-[var(--app-muted)]"> · S{c.semester}</span> : null}
                  </Link>
                  <span className="flex items-center gap-3 text-[12px] text-[var(--app-muted)]">
                    {c.teacher ?? <span className="text-secondary-700 dark:text-secondary-300">sans enseignant</span>}
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">{SHEET[c.status] ?? c.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {debts.length ? (
          <Section
            icon={Wallet}
            title="Dettes à solder"
            count={debts.length}
            tone="bg-secondary-50 text-secondary-900 dark:bg-secondary-500/10 dark:text-secondary-100"
            hint="Cours non validés et non rattrapés depuis : chacun doit être repassé et validé."
          >
            <GradesTable rows={debts} />
          </Section>
        ) : null}

        {pending.length ? (
          <Section
            icon={Hourglass}
            title="Rattrapages non soldés"
            count={pending.length}
            tone="bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100"
            hint="Cours envoyés au rattrapage dont la note de rattrapage n’est pas encore connue ou validée."
          >
            <GradesTable rows={pending} />
          </Section>
        ) : null}
      </div>
    </Dialog>
  )
}
