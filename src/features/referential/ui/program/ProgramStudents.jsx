import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileUp, UserPlus } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { apiErrorMessage } from '@/features/curriculum/api/curriculaApi'
import { createStudent } from '@/features/referential/api/referentialApi'
import { fetchStudentsList } from '@/features/teacher/students/api/studentsApi'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'

const INPUT = 'mt-1 h-9 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]'
const EMPTY = { matricule: '', last_name: '', first_name: '', INE: '', gender: '', birth_date: '', phone: '', level: '' }

function StudentDialog({ open, onClose, program, levels, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open) setForm({ ...EMPTY, level: levels[0] ? String(levels[0].id) : '' })
  }, [open, levels])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = { ...form, level: Number(form.level) }
      if (!body.birth_date) delete body.birth_date
      const saved = await createStudent(body)
      dispatchToast({ type: 'success', message: `${saved.first_name} ${saved.last_name} ajouté·e à ${program.code}.` })
      onCreated()
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      icon={UserPlus}
      title={`Ajouter un étudiant à ${program.code}`}
      description="L’étudiant activera ensuite son compte avec son matricule."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button type="submit" form="form-student" disabled={busy}>{busy ? 'Ajout…' : 'Ajouter'}</Button>
        </div>
      }
    >
      <form id="form-student" onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-[12.5px] font-medium">Matricule<input required className={INPUT} value={form.matricule} onChange={set('matricule')} /></label>
        <label className="text-[12.5px] font-medium">INE<input required className={INPUT} value={form.INE} onChange={set('INE')} /></label>
        <label className="text-[12.5px] font-medium">Nom<input required className={INPUT} value={form.last_name} onChange={set('last_name')} /></label>
        <label className="text-[12.5px] font-medium">Prénom<input required className={INPUT} value={form.first_name} onChange={set('first_name')} /></label>
        <label className="text-[12.5px] font-medium">
          Niveau
          <select required className={INPUT} value={form.level} onChange={set('level')}>
            {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <label className="text-[12.5px] font-medium">
          Sexe
          <select className={INPUT} value={form.gender} onChange={set('gender')}>
            <option value="">—</option>
            <option value="F">Féminin</option>
            <option value="M">Masculin</option>
          </select>
        </label>
        <label className="text-[12.5px] font-medium">Date de naissance<input type="date" className={INPUT} value={form.birth_date} onChange={set('birth_date')} /></label>
        <label className="text-[12.5px] font-medium">Téléphone<input className={INPUT} value={form.phone} onChange={set('phone')} /></label>
      </form>
    </Dialog>
  )
}

/** Étudiants du programme : recherche, filtre par niveau, ajout individuel et import. */
export function ProgramStudents({ program }) {
  const access = useAccess()
  const navigate = useNavigate()
  const canImport = access.covers('students.import', { programId: program.id, departmentId: program.department.id })
  const [levels, setLevels] = useState([])
  const [level, setLevel] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchLevels({ program: program.id }).then(setLevels).catch(() => setLevels([]))
  }, [program.id])

  const load = useCallback(async () => {
    const res = await fetchStudentsList({ program: program.id, level: level || undefined, q: q || undefined, page, page_size: 25, ordering: 'last_name' })
    setData(res)
  }, [program.id, level, q, page])

  useEffect(() => {
    const t = setTimeout(() => load().catch(() => setData({ results: [], count: 0 })), 200)
    return () => clearTimeout(t)
  }, [load])

  const rows = data?.results ?? []
  const count = data?.count ?? 0
  const pages = Math.max(1, Math.ceil(count / 25))

  return (
    <SectionCard
      title="Étudiants"
      description={`${count} étudiant${count > 1 ? 's' : ''} dans ${program.code}`}
      actions={
        canImport ? (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" as={Link} to={`/teacher/students/import-export?program=${program.id}`}>
              <FileUp size={14} aria-hidden /> Importer
            </Button>
            <Button size="sm" onClick={() => setAdding(true)} disabled={!levels.length} title={levels.length ? undefined : 'Ajoutez d’abord un niveau au programme.'}>
              <UserPlus size={14} aria-hidden /> Ajouter
            </Button>
          </div>
        ) : null
      }
      flush
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--app-border)] p-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Nom, matricule, INE…" className="max-w-xs" />
        <div className="flex flex-wrap gap-1">
          {[{ id: '', name: 'Tous' }, ...levels].map((l) => (
            <button
              key={l.id || 'all'}
              type="button"
              onClick={() => { setLevel(String(l.id)); setPage(1) }}
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-medium ring-1 ring-inset transition-colors',
                String(level) === String(l.id) ? 'bg-brand-600 text-white ring-brand-600 dark:bg-brand-500' : 'bg-[var(--app-elevated)] ring-[var(--app-border)] hover:ring-brand-400',
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>
      {!data ? (
        <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9" />)}</div>
      ) : !rows.length ? (
        <EmptyState
          compact
          title={q || level ? 'Aucun étudiant ne correspond' : 'Aucun étudiant dans ce programme'}
          description={canImport && !q && !level ? 'Ajoutez-les un par un ou importez un fichier CSV : le programme est déjà renseigné.' : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-[var(--app-muted)]">
              <tr className="border-b border-[var(--app-border)]">
                <th className="px-4 py-2 font-semibold">Matricule</th>
                <th className="px-4 py-2 font-semibold">Nom</th>
                <th className="px-4 py-2 font-semibold">Niveau</th>
                <th className="px-4 py-2 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} onClick={() => navigate(`/teacher/students/${s.id}`)} className="cursor-pointer border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-hover)]">
                  <td className="px-4 py-2 font-mono text-[12px] font-semibold">{s.matricule}</td>
                  <td className="px-4 py-2">{s.last_name} {s.first_name}</td>
                  <td className="px-4 py-2 text-[var(--app-fg-soft)]">{s.level_name ?? '—'}</td>
                  <td className="px-4 py-2 text-[var(--app-fg-soft)]">{s.status_display ?? s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 ? (
        <div className="flex items-center justify-end gap-2 border-t border-[var(--app-border)] px-4 py-2 text-[12px]">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
          <span className="tabular-nums text-[var(--app-muted)]">{page} / {pages}</span>
          <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
        </div>
      ) : null}
      <StudentDialog open={adding} onClose={() => setAdding(false)} program={program} levels={levels} onCreated={() => { setAdding(false); void load() }} />
    </SectionCard>
  )
}
