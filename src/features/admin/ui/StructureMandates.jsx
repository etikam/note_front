import { Plus, UserPlus } from 'lucide-react'

import { formatDate } from '@/features/admin/model/accessLabels'
import { vacanciesFor } from '@/features/admin/model/structureIndex'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'

function HolderChip({ holder, onOpen }) {
  const Tag = onOpen ? 'button' : 'span'
  return (
    <Tag
      {...(onOpen ? { type: 'button', onClick: () => onOpen(holder.assignment_id) } : {})}
      title={holder.ends_on ? `Jusqu’au ${formatDate(holder.ends_on)}` : undefined}
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-elevated)] py-0.5 pl-0.5 pr-2.5 text-left',
        onOpen && 'transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
      )}
    >
      <Avatar name={holder.teacher_name} size="xs" />
      <span className="min-w-0 truncate text-[12.5px]">
        <span className="font-medium text-[var(--app-fg)]">{holder.teacher_name}</span>
        <span className="text-[var(--app-muted)]"> · {holder.role_name}</span>
      </span>
    </Tag>
  )
}

function VacancyChip({ role, onNominate }) {
  const content = (
    <>
      <UserPlus size={13} aria-hidden />
      <span>
        {role.name} <span className="font-normal opacity-80">· vacant</span>
      </span>
    </>
  )
  const cls =
    'inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-[12px] font-medium border-amber-300 text-amber-800 dark:border-amber-500/40 dark:text-amber-200'
  return onNominate ? (
    <button type="button" onClick={onNominate} className={cn(cls, 'hover:bg-amber-50 dark:hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]')}>
      {content}
    </button>
  ) : (
    <span className={cls}>{content}</span>
  )
}

/** Titulaires + postes vacants d'une entité. */
export function EntityMandates({ entity, roles, onOpen, onNominate, emptyLabel = 'Aucun mandat' }) {
  const vacancies = vacanciesFor(entity, roles)
  const canAssign = Boolean(entity.can?.assign_roles && onNominate)
  if (!entity.holders.length && !vacancies.length) {
    return <span className="text-[12px] text-[var(--app-muted)]">{emptyLabel}</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entity.holders.map((h) => (
        <HolderChip key={h.assignment_id} holder={h} onOpen={onOpen} />
      ))}
      {vacancies.map((v) => (
        <VacancyChip key={v.role.code} role={v.role} onNominate={canAssign ? () => onNominate({ roleCode: v.role.code, level: entity.level, entityId: entity.id }) : null} />
      ))}
    </div>
  )
}

function AddButton({ entity, onNominate }) {
  if (!entity.can?.assign_roles) return null
  return (
    <button
      type="button"
      onClick={() => onNominate({ level: entity.level, entityId: entity.id })}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--app-muted)] opacity-70 transition hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
      aria-label={`Nommer sur ${entity.name}`}
      title="Nommer"
    >
      <Plus size={15} />
    </button>
  )
}

function CodeBadge({ code }) {
  return (
    <span className="inline-flex h-6 min-w-[3rem] shrink-0 items-center justify-center rounded-md bg-[var(--app-subtle)] px-1.5 font-mono text-[11px] font-semibold text-[var(--app-fg-soft)] ring-1 ring-[var(--app-border)]">
      {code}
    </span>
  )
}

/** Organigramme des mandats : faculté → départements → programmes. */
export function StructureMandates({ tree, roles, onOpen, onNominate, filter: match }) {
  return (
    <div className="flex flex-col gap-8">
      {tree.faculties.map((f) => {
        const faculty = { ...f, level: 'faculty' }
        const departments = f.departments
          .map((d) => {
            const dept = { ...d, level: 'department' }
            const all = d.programs.map((p) => ({ ...p, level: 'program' }))
            return { dept, programs: match(dept) ? all : all.filter(match), visible: match(dept) }
          })
          .filter(({ visible, programs }) => visible || programs.length)
        return (
          <section key={f.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Faculté</p>
                <h2 className="font-heading text-[15px] font-semibold text-[var(--app-fg)]">{f.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <EntityMandates entity={faculty} roles={roles} onOpen={onOpen} onNominate={onNominate} emptyLabel="" />
                <AddButton entity={faculty} onNominate={onNominate} />
              </div>
            </div>
            {departments.length ? (
              <div className="grid gap-3 xl:grid-cols-2">
                {departments.map(({ dept, programs }) => (
                  <article key={dept.id} className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
                    <header className="flex items-start gap-3 border-b border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-3">
                      <CodeBadge code={dept.code} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[var(--app-fg)]">{dept.name}</p>
                        <div className="mt-2">
                          <EntityMandates entity={dept} roles={roles} onOpen={onOpen} onNominate={onNominate} />
                        </div>
                      </div>
                      <AddButton entity={dept} onNominate={onNominate} />
                    </header>
                    <ul className="divide-y divide-[var(--app-border)]">
                      {programs.map((p) => (
                        <li key={p.id} className="group flex items-start gap-3 px-4 py-2.5">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-border-strong)]" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] text-[var(--app-fg)]">
                              <span className="font-mono text-[11px] text-[var(--app-muted)]">{p.code}</span> {p.name !== p.code ? p.name : ''}
                            </p>
                            <div className="mt-1.5">
                              <EntityMandates entity={p} roles={roles} onOpen={onOpen} onNominate={onNominate} />
                            </div>
                          </div>
                          <AddButton entity={p} onNominate={onNominate} />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--app-border)] px-4 py-6 text-center text-[12.5px] text-[var(--app-muted)]">
                Aucun département ne correspond.
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}
