import { useState } from 'react'
import { useAcademicYear } from '@/context/AcademicYearContext'

const bannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 1rem',
  borderBottom: '1px solid #e0e0e0',
  background: '#f8f9fa',
  fontSize: '0.9rem',
}

/**
 * Barre globale : choix de l'ID d'année académique (persisté).
 * À remplacer par une liste issue de l'API quand GET /academics/years/ existera.
 */
export function AcademicYearBanner() {
  const { academicYearId, setAcademicYearId, clearAcademicYear } = useAcademicYear()
  const [input, setInput] = useState(academicYearId ?? '')

  return (
    <header style={bannerStyle}>
      <strong>Année académique</strong>
      <label htmlFor="academic-year-id">
        ID (PK)
        <input
          id="academic-year-id"
          type="text"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ex. 1"
          style={{ marginLeft: '0.35rem', width: '5rem' }}
        />
      </label>
      <button
        type="button"
        onClick={() => setAcademicYearId(input.trim() || null)}
      >
        Appliquer
      </button>
      <button type="button" onClick={() => { clearAcademicYear(); setInput('') }}>
        Effacer
      </button>
      <span style={{ color: '#555' }}>
        Actif :{' '}
        <code>{academicYearId ?? 'aucun (backend utilisera is_current)'}</code>
      </span>
    </header>
  )
}
