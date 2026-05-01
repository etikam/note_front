import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Statistiques enseignants (repliable) — effectif, répartition, affectations cours, comptes.
 */
export function FacultyStats({ stats }) {
  const [open, setOpen] = useState(true)
  const panelId = useId()
  const toggleId = useId()

  if (!stats?.cohort || !stats?.accounts || !stats?.assignments) return null

  const c = stats.cohort
  const a = stats.accounts
  const asg = stats.assignments
  const total = c.total ?? 0

  const fmt = (n) =>
    typeof n === 'number' ? n.toLocaleString('fr-FR') : '—'

  const pct = (part, whole) => {
    if (!whole) return '0 %'
    return `${Math.min(100, Math.round((part / whole) * 100))} %`
  }

  const deptRows = Array.isArray(c.by_department) ? c.by_department : []
  const roleRows = Array.isArray(c.by_role) ? c.by_role : []
  const gradeRows = Array.isArray(c.by_grade) ? c.by_grade : []

  const accountItems = [
    {
      key: 'active',
      label: 'Actifs',
      value: a.active ?? 0,
      hint: 'Compte opérationnel (statut actif).',
    },
    {
      key: 'inactive',
      label: 'Inactifs',
      value: a.inactive ?? 0,
      hint: 'Compte inactif côté RH.',
    },
    {
      key: 'suspended',
      label: 'Suspendus',
      value: a.suspended ?? 0,
      hint: 'Accès ou contrat suspendu.',
    },
    {
      key: 'on_leave',
      label: 'En congé',
      value: a.on_leave ?? 0,
      hint: 'Absence programmée (congé).',
    },
    {
      key: 'pending_activation',
      label: 'À activer',
      value: a.pending_activation ?? 0,
      hint: 'Fiche sans utilisateur lié (OTP / première connexion).',
    },
  ]

  const cardShell =
    'rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-[0_2px_16px_-8px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_28px_-14px_rgba(0,0,0,0.4)] overflow-hidden'

  return (
    <div className={cardShell}>
      <button
        type="button"
        id={toggleId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--app-canvas)]/80 sm:px-5"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown
          size={20}
          strokeWidth={2}
          className={`shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <span className="font-heading text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Statistiques
          </span>
          <span className="mt-0.5 block text-xs text-[var(--app-muted)] sm:inline sm:mt-0 sm:ml-2">
            Effectif, rôles, grades, affectations et comptes
          </span>
        </div>
        <span className="shrink-0 tabular-nums text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {fmt(total)} enseignant{total !== 1 ? 's' : ''}
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={toggleId}
          className="border-t border-[var(--app-border)] p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className={cardShell}>
              <header className="border-b border-[var(--app-border)] bg-indigo-50/80 dark:bg-indigo-950/25 px-5 py-4">
                <h2 className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Effectif & répartition
                </h2>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Selon la recherche et le filtre statut du tableau ci-dessous.
                </p>
              </header>
              <div className="space-y-6 p-5">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
                      Effectif total
                    </p>
                    <p className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(total)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-canvas)] px-3 py-1.5 text-sm">
                      <span className="text-[var(--app-muted)]">Femmes</span>
                      <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {fmt(c.female_count ?? 0)}
                      </span>
                      <span className="text-xs text-zinc-400">{pct(c.female_count ?? 0, total)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-canvas)] px-3 py-1.5 text-sm">
                      <span className="text-[var(--app-muted)]">Hommes</span>
                      <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {fmt(c.male_count ?? 0)}
                      </span>
                      <span className="text-xs text-zinc-400">{pct(c.male_count ?? 0, total)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-canvas)] px-3 py-1.5 text-sm">
                      <span className="text-[var(--app-muted)]">Genre N/R</span>
                      <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {fmt(c.gender_unknown_count ?? 0)}
                      </span>
                      <span className="text-xs text-zinc-400">{pct(c.gender_unknown_count ?? 0, total)}</span>
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-orange-200/80 bg-orange-50/50 px-4 py-3 text-sm dark:border-orange-900/40 dark:bg-orange-950/20">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">Profils suspendus : </span>
                  <span className="tabular-nums font-bold text-secondary-700 dark:text-secondary-400">
                    {fmt(c.suspended_count ?? 0)}
                  </span>
                  <span className="text-[var(--app-muted)]"> — statut « suspendu » dans ce périmètre.</span>
                </div>

                <div className="rounded-xl border border-brand-200/60 bg-brand-50/40 px-4 py-3 text-sm dark:border-brand-900/30 dark:bg-brand-950/20">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">Titulaires d&apos;un doctorat : </span>
                  <span className="tabular-nums font-bold text-brand-700 dark:text-brand-300">
                    {fmt(c.with_phd_count ?? 0)}
                  </span>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Département géré (chef de département)
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-[var(--app-border)]">
                    <table className="w-full min-w-[320px] text-left text-sm">
                      <caption className="sr-only">Répartition par département géré</caption>
                      <thead className="border-b border-[var(--app-border)] bg-[var(--app-canvas)] text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Département</th>
                          <th className="px-3 py-2 font-medium text-right">Total</th>
                          <th className="px-3 py-2 font-medium text-right">Femmes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--app-border)]">
                        {deptRows.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-[var(--app-muted)]">
                              Aucune ligne (effectif vide ou sans rattachement département).
                            </td>
                          </tr>
                        ) : (
                          deptRows.map((row, i) => (
                            <tr key={row.department_id ?? `d-${i}`} className="hover:bg-[var(--app-canvas)]/80">
                              <td className="px-3 py-2.5">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</span>
                                {row.code ? (
                                  <span className="ml-2 text-xs text-zinc-400">({row.code})</span>
                                ) : null}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fmt(row.count)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                                {fmt(row.female_count)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Par fonction institutionnelle
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-[var(--app-border)]">
                    <table className="w-full min-w-[320px] text-left text-sm">
                      <caption className="sr-only">Répartition par rôle</caption>
                      <thead className="border-b border-[var(--app-border)] bg-[var(--app-canvas)] text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Rôle</th>
                          <th className="px-3 py-2 font-medium text-right">Total</th>
                          <th className="px-3 py-2 font-medium text-right">Femmes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--app-border)]">
                        {roleRows.map((row, i) => (
                          <tr key={row.role || `r-${i}`} className="hover:bg-[var(--app-canvas)]/80">
                            <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                              {row.label}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fmt(row.count)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                              {fmt(row.female_count)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Par grade / titre
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-[var(--app-border)]">
                    <table className="w-full min-w-[320px] text-left text-sm">
                      <caption className="sr-only">Répartition par grade</caption>
                      <thead className="border-b border-[var(--app-border)] bg-[var(--app-canvas)] text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Grade</th>
                          <th className="px-3 py-2 font-medium text-right">Total</th>
                          <th className="px-3 py-2 font-medium text-right">Femmes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--app-border)]">
                        {gradeRows.map((row, i) => (
                          <tr key={row.grade || `g-${i}`} className="hover:bg-[var(--app-canvas)]/80">
                            <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                              {row.label}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{fmt(row.count)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                              {fmt(row.female_count)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Affectations cours
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-teal-200/70 bg-teal-50/60 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/25">
                      <p className="text-xs font-medium text-teal-800 dark:text-teal-200">Cours assignés (lignes)</p>
                      <p className="text-2xl font-bold tabular-nums text-teal-900 dark:text-teal-100">
                        {fmt(asg.assigned_courses ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-green-200/70 bg-green-50/60 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/25">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200">
                        Enseignants avec au moins un cours
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-green-900 dark:text-green-100">
                        {fmt(asg.teachers_with_course ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={cardShell}>
              <header className="border-b border-[var(--app-border)] bg-violet-50/80 dark:bg-violet-950/25 px-5 py-4">
                <h2 className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Comptes & accès
                </h2>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Statuts RH et situation du compte utilisateur.
                </p>
              </header>
              <p className="border-b border-[var(--app-border)] bg-[var(--app-canvas)]/40 px-5 py-2 text-xs text-[var(--app-muted)]">
                Les statuts actif / inactif / suspendu / congé sont exclusifs. « À activer » compte les fiches sans
                utilisateur lié et peut se cumuler avec un autre statut.
              </p>
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {accountItems.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-xl border border-[var(--app-border)] bg-[var(--app-canvas)]/60 px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.label}</p>
                      <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {fmt(item.value)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">{item.hint}</p>
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {item.key === 'pending_activation'
                        ? 'Indicateur transversal (sans User lié)'
                        : `${pct(item.value, total)} de l’effectif filtré`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  )
}
