import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SearchCheck, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

import { verifyTranscript } from '@/features/notes/api/notesApi'
import { fmtNote } from '@/features/notes/model/notesModel'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--app-border)] py-2 text-[13.5px] last:border-0">
      <dt className="text-[var(--app-muted)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--app-fg)]">{value || '—'}</dd>
    </div>
  )
}

/** Vérification publique d'un relevé (QR code ou code saisi) : authentique, annulé ou inconnu. */
export default function VerifyTranscriptPage() {
  const { code: param = '' } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(param)
  const [state, setState] = useState({ status: param ? 'loading' : 'idle', data: null })

  useEffect(() => {
    setCode(param)
    if (!param) {
      setState({ status: 'idle', data: null })
      return
    }
    setState({ status: 'loading', data: null })
    verifyTranscript(param)
      .then((data) => setState({ status: data.valid ? 'valid' : 'revoked', data }))
      .catch((err) => setState({ status: err?.status === 429 ? 'throttled' : 'unknown', data: null }))
  }, [param])

  const d = state.data
  const banner = {
    valid: { icon: ShieldCheck, title: 'Relevé authentique', text: 'Ce relevé a bien été délivré par l’établissement. Comparez les informations ci-dessous avec le document présenté.', tone: 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200' },
    revoked: { icon: ShieldX, title: 'Relevé annulé', text: 'Ce relevé a été délivré puis annulé par l’établissement : il n’a plus de valeur.', tone: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200' },
    unknown: { icon: ShieldAlert, title: 'Code inconnu', text: 'Aucun relevé ne correspond à ce code. Vérifiez la saisie : un document sans code valide n’est pas authentique.', tone: 'border-secondary-200 bg-secondary-50 text-secondary-800 dark:border-secondary-500/30 dark:bg-secondary-500/10 dark:text-secondary-200' },
    throttled: { icon: ShieldAlert, title: 'Trop de vérifications', text: 'Patientez une minute avant de réessayer.', tone: 'border-[var(--app-border)] bg-[var(--app-subtle)] text-[var(--app-fg-soft)]' },
  }[state.status]

  return (
    <main className="min-h-screen bg-[var(--app-canvas)] px-4 py-10 text-[var(--app-fg)]">
      <div className="mx-auto flex max-w-lg flex-col gap-5">
        <header className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm dark:bg-brand-500">
            <SearchCheck size={22} aria-hidden />
          </span>
          <h1 className="mt-3 font-heading text-[22px] font-semibold tracking-tight">Vérification d’un relevé de notes</h1>
          <p className="mt-1 text-[13.5px] text-[var(--app-muted)]">Scannez le QR code du relevé ou saisissez son code de vérification.</p>
        </header>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const c = code.trim().toUpperCase()
            if (c) navigate(`/verify/${encodeURIComponent(c)}`)
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 12 caractères"
            aria-label="Code de vérification"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 font-mono text-[14px] uppercase tracking-[0.12em] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
          />
          <Button type="submit">Vérifier</Button>
        </form>

        {state.status === 'loading' ? (
          <div className="flex justify-center py-8">
            <Spinner label="Vérification" />
          </div>
        ) : null}

        {banner ? (
          <section className={cn('flex gap-3 rounded-xl border p-4', banner.tone)} role="status">
            <banner.icon size={26} className="shrink-0" aria-hidden />
            <div>
              <h2 className="text-[15px] font-semibold">{banner.title}</h2>
              <p className="mt-0.5 text-[13px] leading-relaxed">{banner.text}</p>
            </div>
          </section>
        ) : null}

        {d ? (
          <section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 shadow-sm">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">{d.institution_name}</p>
            <dl className="mt-2">
              <Row label="Relevé n°" value={<span className="font-mono">{d.number}</span>} />
              <Row label="Délivré le" value={dateFmt.format(new Date(d.issued_at))} />
              {d.revoked_at ? <Row label="Annulé le" value={dateFmt.format(new Date(d.revoked_at))} /> : null}
              <Row label="Étudiant" value={d.student_name} />
              <Row label="Matricule" value={<span className="font-mono">{d.matricule}</span>} />
              <Row label="Programme" value={[d.program, d.level].filter(Boolean).join(' · ')} />
              <Row label="Période" value={d.period_label} />
              <Row label="Moyenne générale" value={fmtNote(d.average)} />
              <Row label="Crédits acquis" value={d.credits_attempted != null ? `${d.credits_earned ?? 0} / ${d.credits_attempted}` : null} />
              <Row label="Décision" value={[d.decision_label, d.mention ? `mention ${d.mention}` : null].filter(Boolean).join(' · ')} />
            </dl>
          </section>
        ) : null}
      </div>
    </main>
  )
}
