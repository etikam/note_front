export { API_PREFIX } from '@/shared/api/endpoints'

export const AUTH_API_PREFIX = `${API_PREFIX}/auth/`

export function isAuthApiPath(url) {
  if (!url || typeof url !== 'string') return false
  const normalized = url.startsWith('http') ? new URL(url).pathname : url
  return normalized.startsWith(AUTH_API_PREFIX)
}
