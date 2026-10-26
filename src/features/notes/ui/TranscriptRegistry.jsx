import { useEffect, useState } from 'react'
import { Ban, Link2, Printer } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { formatDateTime } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { fetchIssuedTranscript, fetchTranscriptRegistry, revokeTranscript } from '@/features/notes/api/notesApi'
import { fmtNote } from '@/features/notes/model/notesModel'
import { SELECT } from '@/features/notes/ui/NotesFilterBar'
import { usePrintDocuments } from '@/features/notes/ui/PrintPortal'
import { verifyUrl } from '@/features/notes/model/notesModel'
import { TranscriptDocument } from '@/features/notes/ui/TranscriptDocument'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { Pagination } from '@/shared/ui/Pagination'
import { SearchInput } from '@/shared/ui/SearchInput'
import { ServerTable } from '@/shared/ui/ServerTable'
import { StatusPill } from '@/shared/ui/StatusPill'

/** Registre des relevés délivrés : recherche, réimpression à l'identique, annulation motivée. */
export function TranscriptRegistry() {
  const access = useAccess()
  const canIssue = access.canManage('transcripts.issue')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [state, setState] = useState({ rows: [], count: 0, loading: true, error: null })
  const [reload, setReload] = useState(0)
  const [revoking, setRevoking] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const { print, portal } = usePrintDocuments()

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchTranscriptRegistry({ q: debounced, state: stateFilter, page, pageSize }, { signal: controller.signal })
      .then((d) => setState({ rows: d.results ?? [], count: d.count ?? 0, loading: false, error: null }))
      .catch((err) => !controller.signal.aborted && setState({ rows: [], count: 0, loading: false, error: { message: err?.message || 'Chargement impossible.' } }))
    return () => controller.abort()
  }, [debounced, stateFilter, page, pageSize, reload])

  async function reprint(row) {
    try {
      const issue = await fetchIssuedTranscript(row.id)
      print(<TranscriptDocument document={issue.snapshot.document} transcript={issue.snapshot.transcript} issue={issue} periodLabel={issue.period_label} />)
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Relevé introuvable.' })
    }
  }

  async function copyLink(row) {
    try {
      await navigator.clipboard.writeText(verifyUrl(row.code))
      dispatchToast({ type: 'success', message: 'Lien de vérification copié.' })
    } catch {
      dispatchToast({ type: 'error', message: verifyUrl(row.code) })
    }
  }

  async function confirmRevoke() {
    setBusy(true)
    try {
      await revokeTranscript(revoking.id, reason)
      dispatchToast({ type: 'success', message: `Relevé ${revoking.number} annulé.` })
      setRevoking(null)
      setReason('')
      setReload((n) => n + 1)
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.message || 'Annulation impossible.' })
    } finally {
      setBusy(false)
    }
  }

  const iconBtn = 'inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--app-muted)] hover:bg-[var(--app-subtle)] hover:text-[var(--app-fg)]'
  const columns = [
    {
      key: 'number',
      header: 'Numéro',
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-mono text-[12.5px] font-semibold">{r.number}</span>
          <span className="font-mono text-[10.5px] text-[var(--app-muted)]">{r.code}</span>
        </span>
      ),
    },
    {
      key: 'student',
      header: 'Étudiant',
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-medium">{r.student_name}</span>
          <span className="font-mono text-[11px] text-[var(--app-muted)]">{r.matricule}</span>
        </span>
      ),
    },
    { key: 'period', header: 'Période', cell: (r) => <span className="text-[12.5px]">{r.period_label}</span> },
    {
      key: 'result',
      header: 'Résultat',
      cell: (r) => (
        <span className="flex flex-col text-[12.5px]">
          <span className="font-semibold tabular-nums">{fmtNote(r.average)}</span>
          <span className="text-[var(--app-muted)]">
            {r.decision_label}
            {r.mention ? ` · ${r.mention}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'issued',
      header: 'Délivré',
      cell: (r) => (
        <span className="flex flex-col text-[12.5px]">
          <span className="tabular-nums">{formatDateTime(r.issued_at)}</span>
          <span className="text-[var(--app-muted)]">{r.issued_by_name ?? '—'}</span>
        </span>
      ),
    },
    {
      key: 'state',
      header: 'État',
      cell: (r) =>
        r.revoked_at ? (
          <StatusPill tone="danger" title={r.revoke_reason}>
            Annulé
          </StatusPill>
        ) : (
          <StatusPill tone="success">Valide</StatusPill>
        ),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <span className="flex justify-end gap-0.5">
          <button type="button" className={iconBtn} onClick={() => reprint(r)} title="Réimprimer à l’identique" aria-label="Réimprimer">
            <Printer size={14} />
          </button>
          <button type="button" className={iconBtn} onClick={() => copyLink(r)} title="Copier le lien de vérification" aria-label="Copier le lien de vérification">
            <Link2 size={14} />
          </button>
          {canIssue && !r.revoked_at ? (
            <button type="button" className={`${iconBtn} hover:text-red-700`} onClick={() => setRevoking(r)} title="Annuler ce relevé" aria-label="Annuler">
              <Ban size={14} />
            </button>
          ) : null}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-2">
        <SearchInput value={q} onChange={setQ} placeholder="Numéro, code, étudiant, matricule" className="w-full max-w-xs" ariaLabel="Rechercher un relevé" />
        <select
          className={SELECT}
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value)
            setPage(1)
          }}
          aria-label="État"
        >
          <option value="">Tous les relevés</option>
          <option value="valid">Valides</option>
          <option value="revoked">Annulés</option>
        </select>
        <span className="ml-auto pr-1 text-[12px] tabular-nums text-[var(--app-muted)]">
          {state.count} relevé{state.count > 1 ? 's' : ''}
        </span>
      </div>
      <ServerTable
        columns={columns}
        rows={state.rows}
        loading={state.loading}
        error={state.error}
        empty={{ title: 'Aucun relevé délivré', description: 'Les relevés officiels délivrés (individuels ou en lot) sont enregistrés ici, avec leur code de vérification.' }}
        footer={
          <Pagination
            page={page}
            pageSize={pageSize}
            count={state.count}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        }
      />
      <Dialog
        open={Boolean(revoking)}
        onClose={() => !busy && setRevoking(null)}
        dismissible={!busy}
        title={`Annuler le relevé ${revoking?.number ?? ''}`}
        description="Le relevé reste au registre ; la vérification en ligne indiquera qu’il est annulé. Cette action est définitive."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevoking(null)} disabled={busy}>
              Fermer
            </Button>
            <Button variant="danger" onClick={confirmRevoke} disabled={busy || !reason.trim()}>
              Annuler le relevé
            </Button>
          </>
        }
      >
        <label className="block text-[12.5px] font-medium text-[var(--app-fg-soft)]">
          Motif de l’annulation
          <textarea
            className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. erreur de saisie corrigée, relevé remplacé par…"
          />
        </label>
      </Dialog>
      {portal}
    </div>
  )
}
