import { AlertTriangle, ArrowUpRight, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

const SEVERITY_LABEL = {
  danger: 'Urgent',
  warning: 'Attention',
  info: 'Info',
  success: 'OK',
  neutral: 'Info',
}

const SEVERITY_BADGE = {
  danger: 'danger',
  warning: 'warning',
  info: 'info',
  success: 'success',
  neutral: 'neutral',
}

const ROW_ACCENT = {
  danger: 'border-l-red-500',
  warning: 'border-l-secondary-500',
  info: 'border-l-brand-500',
  success: 'border-l-brand-600',
  neutral: 'border-l-zinc-400',
}

function FeedSection({ icon: Icon, title, subtitle, count, children, emptyMessage }) {
  const items = Array.isArray(children) ? children : []
  const hasItems = items.length > 0

  return (
    <section className="flex h-full min-h-[11rem] flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 dark:text-brand-200">
            <Icon size={17} strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--app-fg)]">{title}</h2>
            <p className="text-xs text-[var(--app-muted)]">{subtitle}</p>
          </div>
        </div>
        {count > 0 ? <Badge tone="secondary">{count}</Badge> : null}
      </header>
      {hasItems ? (
        <ul className="max-h-72 flex-1 divide-y divide-[var(--app-border)] overflow-y-auto">{items}</ul>
      ) : (
        <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-[var(--app-muted)] sm:px-5">
          {emptyMessage}
        </p>
      )}
    </section>
  )
}

function FeedRow({ item }) {
  const severity = item.severity ?? 'info'
  const badgeTone = SEVERITY_BADGE[severity] ?? 'neutral'

  return (
    <li
      className={cn(
        'border-l-4 transition-colors hover:bg-[var(--app-nav-hover)]/35',
        ROW_ACCENT[severity] ?? ROW_ACCENT.info,
      )}
    >
      <article className="flex flex-col gap-2.5 px-4 py-3.5 lg:px-5">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={badgeTone} className="text-[10px] uppercase tracking-wide">
              {SEVERITY_LABEL[severity] ?? 'Info'}
            </Badge>
            <p className="text-sm font-semibold text-[var(--app-fg)]">{item.title}</p>
          </div>
          <p className="text-sm leading-relaxed text-[var(--app-muted)]">{item.message}</p>
        </div>
        {item.action_href && item.action_label ? (
          <Button asChild variant="ghost" size="sm" className="min-h-[40px] w-fit shrink-0 px-0">
            <Link to={item.action_href}>
              {item.action_label}
              <ArrowUpRight size={14} className="ml-1" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </article>
    </li>
  )
}

/** Zone alertes + notifications du dashboard étudiant (`/students/me/stats/`). */
export function StudentDashboardFeed({ alerts = [], notifications = [], loading = false, className }) {
  if (loading) {
    return (
      <div
        className={cn(
          'flex min-h-[11rem] items-center justify-center rounded-2xl border border-[var(--app-border)] py-12 md:col-span-2',
          className,
        )}
      >
        <Spinner size="lg" label="Chargement des alertes" />
      </div>
    )
  }

  return (
    <section
      className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch', className)}
      aria-label="Notifications et alertes"
    >
      <FeedSection
        icon={AlertTriangle}
        title="Alertes"
        subtitle="Actions recommandées sur votre dossier."
        count={alerts?.length ?? 0}
        emptyMessage="Aucune alerte pour le moment."
      >
        {(alerts ?? []).map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
      </FeedSection>

      <FeedSection
        icon={Bell}
        title="Notifications"
        subtitle="Informations utiles sur votre scolarité."
        count={notifications?.length ?? 0}
        emptyMessage="Aucune notification."
      >
        {(notifications ?? []).map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
      </FeedSection>
    </section>
  )
}
