import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

import { cellResult, fmtNote, UNIT_STATE, verifyUrl } from '@/features/notes/model/notesModel'

const INK = '#0f172a'
const ACCENT = '#1e3a8a'
const MUTED = '#64748b'
const RULE = '#cbd5e1'

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function QrImage({ text, size = 84 }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(text, { margin: 0, width: size * 3, errorCorrectionLevel: 'M', color: { dark: INK, light: '#ffffff' } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(''))
    return () => {
      alive = false
    }
  }, [text, size])
  return src ? <img src={src} width={size} height={size} alt="QR code de vérification" /> : <span style={{ width: size, height: size, display: 'inline-block' }} />
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function Identity({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '3px 0' }}>
      <dt style={{ width: 118, flexShrink: 0, color: MUTED }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 600, color: INK }}>{value || '—'}</dd>
    </div>
  )
}

const th = { textAlign: 'left', padding: '5px 8px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', background: ACCENT }
const td = { padding: '4px 8px', borderBottom: `1px solid ${RULE}`, verticalAlign: 'top' }

/**
 * Relevé de notes officiel (feuille A4, couleurs fixes : le papier ne suit pas le thème).
 * ``issue`` (relevé délivré : numéro, code, date) ajoute le QR code de vérification ;
 * sans ``issue`` le document porte le filigrane « APERÇU ».
 */
export function TranscriptDocument({ document: doc, transcript: t, issue = null, periodLabel, className = '' }) {
  const st = t.student
  const scale = t.grading?.scale_max ?? 10
  const issuedAt = issue?.issued_at ? new Date(issue.issued_at) : new Date()
  const watermark = !issue ? 'APERÇU' : issue.revoked_at ? 'ANNULÉ' : null
  const fullName = `${st.last_name ?? ''} ${st.first_name ?? ''}`.trim()

  return (
    <article
      className={`doc-sheet relative mx-auto flex flex-col overflow-hidden shadow-[0_1px_3px_rgb(0_0_0/0.12),0_12px_32px_-12px_rgb(15_23_42/0.25)] ${className}`}
      style={{ padding: '13mm 14mm 11mm', fontFamily: 'Inter, "Segoe UI", Arial, sans-serif', fontSize: 11, lineHeight: 1.45, color: INK }}
    >
      {watermark ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: watermark === 'ANNULÉ' ? 'rgb(220 38 38 / 0.10)' : 'rgb(30 58 138 / 0.07)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {watermark}
        </span>
      ) : null}

      {/* En-tête */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span
            style={{
              width: 50,
              height: 50,
              borderRadius: 999,
              border: `2px solid ${ACCENT}`,
              color: ACCENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            {initials(doc.institution_name) || 'CI'}
          </span>
          <div>
            {(doc.header_lines ?? []).map((line, i) => (
              <p key={i} style={{ margin: 0, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
                {line}
              </p>
            ))}
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '0.02em', color: ACCENT, textTransform: 'uppercase' }}>{doc.institution_name}</p>
            {st.department ? <p style={{ margin: 0, fontSize: 10, color: MUTED }}>{[st.faculty, st.department].filter(Boolean).join(' · ')}</p> : null}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 9.5, color: MUTED }}>
          <p style={{ margin: 0 }}>{issue ? 'Relevé n°' : 'Document provisoire'}</p>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{issue ? issue.number : 'Non délivré'}</p>
          <p style={{ margin: '2px 0 0' }}>{issue ? `Délivré le ${shortDate.format(issuedAt)}` : `Édité le ${shortDate.format(issuedAt)}`}</p>
        </div>
      </header>
      <div style={{ marginTop: 10, borderTop: `2.5px solid ${ACCENT}`, borderBottom: `1px solid ${ACCENT}`, height: 3 }} />

      {/* Titre */}
      <div style={{ textAlign: 'center', margin: '14px 0 12px' }}>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '0.22em', color: INK }}>RELEVÉ DE NOTES</h1>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: MUTED }}>{periodLabel}</p>
      </div>

      {/* Identité */}
      <dl
        style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 24,
          padding: '8px 12px',
          border: `1px solid ${RULE}`,
          borderRadius: 6,
          background: '#f8fafc',
          fontSize: 10.5,
        }}
      >
        <div>
          <Identity label="Nom et prénoms" value={fullName} />
          <Identity label="Matricule" value={st.matricule} />
          <Identity label="INE" value={st.INE} />
          <Identity
            label="Né(e) le"
            value={[st.birth_date ? shortDate.format(new Date(st.birth_date)) : null, st.birth_place ? `à ${st.birth_place}` : null].filter(Boolean).join(' ')}
          />
        </div>
        <div>
          <Identity label="Programme" value={st.program ? `${st.program.name} (${st.program.code})` : null} />
          <Identity label="Niveau" value={st.level} />
          <Identity label="Département" value={st.department} />
          <Identity label="Année" value={t.academic_year ?? 'Toutes les années'} />
        </div>
      </dl>

      {/* Résultats */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {t.structure.length === 0 ? <p style={{ color: MUTED, textAlign: 'center', padding: 24 }}>Aucun cours sur cette période.</p> : null}
        {t.structure.map((sem) => (
          <table key={sem.semester ?? 'x'} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 74 }}>{sem.semester ? `Semestre ${sem.semester}` : 'Cours'}</th>
                <th style={th}>Unité d’enseignement · élément</th>
                <th style={{ ...th, width: 52, textAlign: 'center' }}>Crédits</th>
                <th style={{ ...th, width: 70, textAlign: 'center' }}>Moy. /{scale}</th>
                <th style={{ ...th, width: 84 }}>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {sem.units.map((u) => {
                const state = UNIT_STATE[t.units_state?.[String(u.id)]]
                return [
                  <tr key={`u-${u.id}`} style={{ background: '#eef2f7' }}>
                    <td style={{ ...td, fontWeight: 700, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 9.5 }}>{u.code}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{u.name}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{u.credits}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtNote(t.units?.[String(u.id)])}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{state?.label ?? '—'}</td>
                  </tr>,
                  ...u.courses.map((c) => {
                    const cell = t.cells?.[c.id]
                    const res = cellResult(cell)
                    return (
                      <tr key={c.id}>
                        <td style={{ ...td, color: MUTED, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 9.5 }}>{c.code}</td>
                        <td style={{ ...td, paddingLeft: 18 }}>{c.name}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{c.credits ?? '—'}</td>
                        <td style={{ ...td, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                          {cell?.state === 'graded' ? fmtNote(cell.average) : <span style={{ color: MUTED }}>en attente</span>}
                        </td>
                        <td style={td}>{res?.label ?? ''}</td>
                      </tr>
                    )
                  }),
                ]
              })}
            </tbody>
          </table>
        ))}

        {/* Synthèse */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1.5px solid ${ACCENT}`, borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
          {[
            ['Moyenne générale', `${fmtNote(t.average)} / ${scale}`],
            ['Crédits acquis', `${t.credits_earned ?? 0} / ${t.credits_attempted ?? 0}`],
            ['Décision', t.decision_label],
            ['Mention', t.mention || '—'],
          ].map(([label, value], i) => (
            <div key={label} style={{ padding: '7px 10px', borderLeft: i ? `1px solid ${RULE}` : 0, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signature et vérification */}
      <footer style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: '55%' }}>
          {issue && !issue.revoked_at ? (
            <>
              <QrImage text={verifyUrl(issue.code)} />
              <div style={{ fontSize: 9, color: MUTED }}>
                <p style={{ margin: 0, fontWeight: 700, color: INK }}>Vérification d’authenticité</p>
                <p style={{ margin: '2px 0 0' }}>Scannez le code ou rendez-vous sur</p>
                <p style={{ margin: 0, color: ACCENT, wordBreak: 'break-all' }}>{window.location.host}/verify</p>
                <p style={{ margin: '2px 0 0' }}>
                  Code : <strong style={{ color: INK, letterSpacing: '0.08em', fontFamily: 'ui-monospace, Consolas, monospace' }}>{issue.code}</strong>
                </p>
              </div>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 9, color: MUTED, maxWidth: 260 }}>
              {issue?.revoked_at ? 'Ce relevé a été annulé et n’a plus de valeur.' : 'Aperçu sans valeur officielle : le relevé reçoit un numéro et un code de vérification lors de sa délivrance.'}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'center', minWidth: 210 }}>
          <p style={{ margin: 0, fontSize: 10.5 }}>
            Fait à {doc.city || '…'}, le {longDate.format(issuedAt)}
          </p>
          <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{doc.signatory_title}</p>
          <div style={{ height: 46 }} />
          <p style={{ margin: 0, fontWeight: 700 }}>{doc.signatory_name || ' '}</p>
        </div>
      </footer>

      <p style={{ margin: '12px 0 0', paddingTop: 6, borderTop: `1px solid ${RULE}`, fontSize: 8.5, color: MUTED, textAlign: 'center' }}>
        Barème : {scale} · seuil de validation : {fmtNote(t.grading?.pass_mark)} · seules les notes publiées figurent sur ce relevé.
        {doc.footer_note ? ` ${doc.footer_note}` : ''}
      </p>
    </article>
  )
}
