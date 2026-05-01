export class HttpError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = options.status ?? null
    this.details = options.details ?? null
    /** @type {Record<string, string>} Erreurs par nom de champ (DRF). */
    this.fieldErrors = options.fieldErrors ?? {}
    this.raw = options.raw ?? null
  }
}

/**
 * Extrait un message lisible et les erreurs par champ depuis une réponse DRF
 * typique (`{ email: ['…'] }`, `non_field_errors`, `detail` chaîne ou liste).
 * @param {unknown} data
 * @returns {{ message: string, fieldErrors: Record<string, string> }}
 */
export function parseDrfErrorPayload(data) {
  const fieldErrors = {}
  const generalParts = []

  if (!data || typeof data !== 'object') {
    return { message: 'Erreur inconnue.', fieldErrors: {} }
  }

  if (typeof data.detail === 'string') {
    return { message: data.detail, fieldErrors: {} }
  }

  if (Array.isArray(data.detail)) {
    for (const item of data.detail) {
      if (typeof item === 'string') generalParts.push(item)
      else if (item && typeof item === 'object' && item.string != null) generalParts.push(String(item.string))
    }
  }

  for (const [key, val] of Object.entries(data)) {
    if (key === 'detail') continue
    const msgs = Array.isArray(val) ? val : val != null ? [val] : []
    const strings = []
    for (const m of msgs) {
      if (typeof m === 'string') strings.push(m)
      else if (m && typeof m === 'object' && m.string != null) strings.push(String(m.string))
    }
    const text = strings.join(' ').trim()
    if (!text) continue
    if (key === 'non_field_errors') {
      generalParts.push(text)
    } else {
      fieldErrors[key] = text
    }
  }

  const message =
    generalParts.filter(Boolean).join(' ').trim() ||
    Object.values(fieldErrors).join(' · ').trim() ||
    'Erreur de validation.'

  return { message, fieldErrors }
}

export function normalizeHttpError(error) {
  const status = error?.response?.status ?? null
  const data = error?.response?.data

  if (data && typeof data === 'object') {
    const { message, fieldErrors } = parseDrfErrorPayload(data)
    return new HttpError(message, { status, details: data, fieldErrors, raw: error })
  }

  if (error?.message) {
    return new HttpError(error.message, { status, raw: error })
  }

  return new HttpError('Erreur réseau inconnue.', { status, raw: error })
}
