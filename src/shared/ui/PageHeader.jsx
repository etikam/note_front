import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/** Fil d'Ariane : ``[{ label, to? }]`` — le dernier élément est la page courante. */
export function Breadcrumbs({ items, className }) {
  if (!items?.length) return null
  return (
    <nav aria-label="Fil d’Ariane" className={cn('flex min-w-0 items-center gap-1 text-[12px] text-[var(--app-muted)]', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 ? <ChevronRight size={12} className="shrink-0 opacity-60" aria-hidden /> : null}
            {item.to && !last ? (
              <Link to={item.to} className="truncate rounded hover:text-[var(--app-fg)] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={cn('truncate', last && 'font-medium text-[var(--app-fg-soft)]')} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

/** En-tête de page : fil d'Ariane, titre, description, métadonnées et actions principales. */
export function PageHeader({ breadcrumbs, title, description, meta, actions, className }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-3', className)}>
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-3xl">
          <h1 className="font-heading text-[22px] font-semibold leading-tight tracking-tight text-[var(--app-fg)] sm:text-2xl">{title}</h1>
          {description ? <p className="mt-1.5 text-sm leading-relaxed text-[var(--app-muted)]">{description}</p> : null}
          {meta ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
