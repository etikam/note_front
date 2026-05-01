const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_REGEX = /^\d{6}$/

export function validateMatricule(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 'Le matricule est requis.'
  if (trimmed.length < 8 ) return 'Le matricule doit contenir au moins 8 caracteres.'
  return ''
}

export function validateDepartmentId(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 'Le departement doit etre un identifiant positif.'
  }
  return ''
}

export function validateEmail(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 'L email est requis.'
  if (!EMAIL_REGEX.test(trimmed)) return 'Format d email invalide.'
  return ''
}

export function validateOtp(value) {
  const normalized = String(value ?? '').replace(/\D/g, '')
  if (!OTP_REGEX.test(normalized)) return 'Le code OTP doit contenir 6 chiffres.'
  return ''
}

export function validatePassword(value) {
  const raw = String(value ?? '')
  if (!raw) return 'Le mot de passe est requis.'
  if (raw.length < 8) return 'Le mot de passe doit contenir au moins 8 caracteres.'
  if (!/[A-Za-z]/.test(raw) || !/\d/.test(raw)) {
    return 'Le mot de passe doit contenir lettres et chiffres.'
  }
  return ''
}

export function validatePasswordMatch(password, passwordConfirm) {
  const a = String(password ?? '')
  const b = String(passwordConfirm ?? '')
  if (!b) return 'Confirmez votre mot de passe.'
  if (a !== b) return 'Les deux mots de passe ne correspondent pas.'
  return ''
}

export function getPasswordStrength(password) {
  const value = String(password ?? '')
  if (!value) return { score: 0, label: 'Aucun mot de passe' }

  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  if (score <= 2) return { score, label: 'Faible' }
  if (score <= 4) return { score, label: 'Moyen' }
  return { score, label: 'Fort' }
}
