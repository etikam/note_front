import { Link } from 'react-router-dom'
import { Building2, ChevronRight, MapPin, Users } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

/**
 * Vue « Départements » du référentiel Académie (liste API, périmètre, accès étudiants).
 */
export function PedagogyDepartmentsSection({
  departments = [],
  loading = false,
  onRefresh,
  managedDepartmentId = null,
}) {
  const { academicYearLabel } = useAcademicYear()
  const sorted = [...departments].sort((a, b) => String(a.code).localeCompare(String(b.code)))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <Card className="rounded-2xl border border-[var(--app-border)] p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-[var(--app-fg)]">
              <Building2 size={18} className="text-brand-600 dark:text-brand-400" aria-hidden />
              Structure des départements
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 border border-[var(--app-border)] text-[var(--app-fg)]"
              onClick={onRefresh}
              disabled={loading}
            >
              Actualiser la liste
            </Button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
            Unités d’enseignement rattachées à la faculté. Les codes sont utilisés dans les cours, les affectations et les
            filtres étudiants.
          </p>

          {loading ? (
            <div className="mt-10 flex justify-center py-8">
              <Spinner label="Chargement des départements" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_96%,var(--app-canvas))] px-4 py-8 text-center text-sm text-[var(--app-muted)] dark:bg-white/[0.03]">
              Aucun département renvoyé par l’API pour votre périmètre.
            </p>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {sorted.map((d) => {
                const isManaged = managedDepartmentId != null && Number(d.id) === Number(managedDepartmentId)
                return (
                  <li key={d.id}>
                    <Card
                      className={cn(
                        'h-full rounded-xl border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md',
                        isManaged
                          ? 'border-brand-400/50 bg-brand-500/[0.06] ring-1 ring-brand-500/15 dark:border-brand-500/35 dark:bg-brand-950/25'
                          : 'border-[var(--app-border)] bg-[var(--app-elevated)]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                            {d.code}
                          </p>
                          <p className="mt-1 font-heading text-base font-semibold leading-snug text-[var(--app-fg)]">{d.name}</p>
                          {isManaged ? (
                            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800 dark:bg-brand-400/15 dark:text-brand-200">
                              <MapPin size={11} aria-hidden />
                              Votre département
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button as={Link} to="/teacher/students/list" variant="soft" size="sm" className="gap-1.5">
                          <Users size={14} aria-hidden />
                          Étudiants
                          <ChevronRight size={14} className="opacity-70" aria-hidden />
                        </Button>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="h-fit rounded-2xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] p-5 shadow-sm dark:bg-white/[0.03]">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">Contexte</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-[var(--app-muted)]">Année focalisée</dt>
              <dd className="mt-0.5 font-semibold text-[var(--app-fg)]">{academicYearLabel ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[var(--app-muted)]">Départements listés</dt>
              <dd className="mt-0.5 font-heading text-2xl font-bold tabular-nums text-[var(--app-fg)]">{sorted.length}</dd>
            </div>
            {managedDepartmentId != null ? (
              <div>
                <dt className="text-xs font-medium text-[var(--app-muted)]">Périmètre</dt>
                <dd className="mt-0.5 text-[var(--app-fg)]">
                  Vue alignée sur le département dont vous êtes responsable lorsque les données sont filtrées côté
                  serveur.
                </dd>
              </div>
            ) : (
              <div>
                <dt className="text-xs font-medium text-[var(--app-muted)]">Périmètre</dt>
                <dd className="mt-0.5 text-[var(--app-fg)]">Vue faculté : tous les départements accessibles à votre rôle.</dd>
              </div>
            )}
          </dl>
          <p className="mt-5 border-t border-[var(--app-border)] pt-4 text-xs leading-relaxed text-[var(--app-muted)]">
            Les niveaux et cours par département se configurent dans les onglets « UE & offres » et « Cours » pour l’année
            sélectionnée dans l’en-tête.
          </p>
        </Card>
      </div>
    </div>
  )
}
