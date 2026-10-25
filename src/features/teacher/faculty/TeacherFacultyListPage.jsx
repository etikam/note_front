import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Upload, UserPlus } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { TEACHER_ROLE_OPTIONS, TEACHER_STATUS } from '@/features/teacher/faculty/facultyList.constants'
import { useTeacherDirectoryList } from '@/features/teacher/faculty/hooks/useTeacherDirectoryList'
import { TeacherCreateDialog } from '@/features/teacher/faculty/ui/TeacherCreateDialog'
import { TeacherMandates } from '@/features/teacher/faculty/ui/TeacherMandates'
import { TeacherPreviewDrawer } from '@/features/teacher/faculty/ui/TeacherPreviewDrawer'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Pagination } from '@/shared/ui/Pagination'
import { SearchInput } from '@/shared/ui/SearchInput'
import { ServerTable } from '@/shared/ui/ServerTable'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

const pct = (part, total) => (total ? Math.round((100 * part) / total) : 0)
const STATUS_TABS = [{ id: '', label: 'Tous' }, ...Object.entries(TEACHER_STATUS).map(([id, s]) => ({ id, label: s.label }))]

function SummaryStrip({ stats }) {
  if (!stats?.cohort) return null
  const c = stats.cohort
  const asg = stats.assignments ?? {}
  const items = [
    { label: 'Enseignants', value: c.total ?? 0 },
    { label: 'Avec au moins un cours', value: asg.teachers_with_course ?? 0, hint: `${pct(asg.teachers_with_course, c.total)} %` },
    { label: 'Cours affectés', value: asg.assigned_courses ?? 0 },
    { label: 'Docteurs', value: c.with_phd_count ?? 0, hint: `${pct(c.with_phd_count, c.total)} %` },
    { label: 'Femmes', value: c.female_count ?? 0, hint: `${pct(c.female_count, c.total)} %` },
  ]
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] sm:grid-cols-5 sm:divide-x sm:divide-[var(--app-border)]">
      {items.map((it) => (
        <div key={it.label} className="px-4 py-3">
          <dt className="truncate text-[11.5px] text-[var(--app-muted)]">{it.label}</dt>
          <dd className="mt-0.5 flex items-baseline gap-2">
            <span className="font-heading text-[20px] font-semibold tabular-nums text-[var(--app-fg)]">{it.value}</span>
            {it.hint ? <span className="text-[11.5px] text-[var(--app-muted)]">{it.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function TeacherFacultyListPage() {
  const access = useAccess()
  const canProvision = access.canGlobal('teachers.provision')
  const dir = useTeacherDirectoryList()
  const [preview, setPreview] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const accounts = dir.stats?.accounts

  const columns = [
    {
      key: 'name',
      header: 'Enseignant',
      orderingField: 'last_name',
      cell: (t) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={`${t.first_name} ${t.last_name}`} src={t.photo_url} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-[var(--app-fg)]">
              {t.last_name} {t.first_name}
            </span>
            <span className="block truncate font-mono text-[11.5px] text-[var(--app-muted)]">{t.matricule}</span>
          </span>
        </span>
      ),
    },
    { key: 'grade', header: 'Grade', orderingField: 'grade', cell: (t) => <span className="text-[var(--app-fg-soft)]">{t.grade_name || '—'}</span> },
    { key: 'mandates', header: 'Mandats', cell: (t) => <span className="block max-w-[16rem] text-[12.5px]"><TeacherMandates mandates={t.mandates} compact /></span> },
    {
      key: 'load',
      header: 'Charge',
      orderingField: 'courses_count',
      align: 'right',
      cell: (t) =>
        t.courses_count ? (
          <span className="flex flex-col items-end">
            <span className="tabular-nums">{t.courses_count} cours</span>
            {t.credits_total ? <span className="text-[11.5px] tabular-nums text-[var(--app-muted)]">{t.credits_total} crédits</span> : null}
          </span>
        ) : (
          <span className="text-[var(--app-muted)]">Aucun cours</span>
        ),
    },
    {
      key: 'account',
      header: 'Compte',
      cell: (t) => (
        <span className={cn('text-[12.5px]', t.is_active ? 'text-[var(--app-fg-soft)]' : 'text-[var(--app-muted)]')}>{t.is_active ? 'Activé' : 'Non activé'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      orderingField: 'status',
      cell: (t) => {
        const st = TEACHER_STATUS[t.status]
        return st ? <StatusPill tone={st.tone}>{st.label}</StatusPill> : t.status
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <SummaryStrip stats={dir.stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Statut">
          {STATUS_TABS.map((t) => {
            const count = t.id ? accounts?.[TEACHER_STATUS[t.id].statKey] : dir.stats?.cohort?.total
            const active = dir.status === t.id
            return (
              <button
                key={t.id || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => dir.setStatus(t.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors',
                  active ? 'bg-[var(--app-fg)] text-[var(--app-canvas)]' : 'text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]',
                )}
              >
                {t.label}
                {count != null ? <span className="ml-1.5 tabular-nums opacity-70">{count}</span> : null}
              </button>
            )
          })}
        </div>
        {canProvision ? (
          <div className="flex gap-2">
            <Button as={Link} to="/teacher/faculty/import-export" variant="ghost" size="sm">
              <Upload size={14} aria-hidden /> Importer
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <UserPlus size={14} aria-hidden /> Ajouter un enseignant
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={dir.q} onChange={dir.setQ} placeholder="Nom, matricule, e-mail…" className="w-full sm:w-72" />
        <ScopeSelect
          className={cn(SELECT, 'max-w-[15rem]')}
          options={dir.scopeOptions}
          departmentId=""
          programId={dir.programId}
          onChange={dir.setScope}
          allLabel="Tous les programmes"
        />
        <select className={SELECT} value={dir.teacherRole} onChange={(e) => dir.setTeacherRole(e.target.value)} aria-label="Mandat">
          <option value="">Tous les mandats</option>
          {TEACHER_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === 'teacher' ? 'Sans mandat' : o.label}
            </option>
          ))}
        </select>
        {dir.activeFilterCount ? (
          <button type="button" onClick={dir.resetFilters} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]">
            <RotateCcw size={13} aria-hidden /> Réinitialiser
          </button>
        ) : null}
      </div>

      <ServerTable
        columns={columns}
        rows={dir.results}
        loading={dir.loading}
        error={dir.error ? { message: dir.error, onRetry: dir.load } : null}
        ordering={dir.ordering}
        onOrderingChange={(o) => dir.setOrdering(o ?? '-created_at')}
        onRowClick={setPreview}
        activeRowId={preview?.id}
        empty={{
          title: 'Aucun enseignant',
          description: dir.activeFilterCount || dir.q ? 'Modifiez ou réinitialisez les filtres.' : 'Les enseignants intervenant dans votre périmètre apparaîtront ici.',
        }}
        footer={<Pagination page={dir.page} pageSize={dir.pageSize} count={dir.count} onPageChange={dir.setPage} onPageSizeChange={dir.setPageSize} />}
      />

      <TeacherPreviewDrawer teacher={preview} onClose={() => setPreview(null)} />
      <TeacherCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(t) => {
          dispatchToast({ type: 'success', message: `Fiche de ${t?.first_name ?? ''} ${t?.last_name ?? ''} créée.` })
          void dir.load()
        }}
      />
    </div>
  )
}
