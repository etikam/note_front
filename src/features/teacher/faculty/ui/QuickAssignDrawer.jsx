import { useEffect, useState } from 'react'
import { Check, UserRound } from 'lucide-react'

import { fetchCourseAssignmentTeachers, postCourseAssignment } from '@/features/teacher/faculty/api/courseAssignmentsApi'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Skeleton } from '@/shared/ui/Skeleton'

/** Affecte un enseignant du pool institutionnel à un cours sans enseignant. */
export function QuickAssignDrawer({ course, onClose, onAssigned }) {
  const [q, setQ] = useState('')
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (course) {
      setQ('')
      setPicked(null)
      setError('')
    }
  }, [course])

  useEffect(() => {
    if (!course) return undefined
    let cancelled = false
    setLoading(true)
    const t = setTimeout(() => {
      fetchCourseAssignmentTeachers(q.trim() ? { q: q.trim() } : {})
        .then((rows) => !cancelled && setTeachers(rows.filter((r) => r.status === 'active' || !r.status).slice(0, 40)))
        .catch(() => !cancelled && setTeachers([]))
        .finally(() => !cancelled && setLoading(false))
    }, 220)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q, course])

  async function assign() {
    setSaving(true)
    setError('')
    try {
      await postCourseAssignment({ course: course.id, teacher: picked.id })
      onAssigned?.(course, picked)
      onClose()
    } catch (err) {
      setError(err?.message || 'Affectation impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={Boolean(course)}
      onClose={onClose}
      dismissible={!saving}
      eyebrow="Affectation"
      title={course ? course.name : ''}
      description={course ? [course.code, course.program_code, course.level_name, course.module_label].filter(Boolean).join(' · ') : null}
      width="md"
      footer={
        <div className="flex w-full flex-col gap-2">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={assign} disabled={!picked || saving}>
              {saving ? 'Affectation…' : picked ? `Affecter à ${picked.full_name}` : 'Choisir un enseignant'}
            </Button>
          </div>
        </div>
      }
    >
      <p className="mb-3 text-[12.5px] text-[var(--app-muted)]">
        Tout enseignant actif de l’établissement peut recevoir ce cours, quel que soit son programme.
      </p>
      <SearchInput value={q} onChange={setQ} placeholder="Nom, matricule, e-mail" autoFocus />
      <ul className="mt-3 divide-y divide-[var(--app-border)] overflow-hidden rounded-xl border border-[var(--app-border)]">
        {loading && !teachers.length ? (
          Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="p-3">
              <Skeleton className="h-8 w-full" />
            </li>
          ))
        ) : !teachers.length ? (
          <li className="flex items-center gap-2 p-4 text-[12.5px] text-[var(--app-muted)]">
            <UserRound size={15} aria-hidden /> Aucun enseignant ne correspond.
          </li>
        ) : (
          teachers.map((t) => {
            const active = picked?.id === t.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setPicked(t)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none',
                    active ? 'bg-brand-50 dark:bg-white/[0.06]' : 'hover:bg-[var(--app-hover)] focus-visible:bg-[var(--app-hover)]',
                  )}
                >
                  <Avatar name={t.full_name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[var(--app-fg)]">{t.full_name}</span>
                    <span className="block truncate font-mono text-[11.5px] text-[var(--app-muted)]">{t.matricule}</span>
                  </span>
                  {active ? <Check size={16} className="text-brand-600 dark:text-brand-300" aria-hidden /> : null}
                </button>
              </li>
            )
          })
        )}
      </ul>
    </Drawer>
  )
}
