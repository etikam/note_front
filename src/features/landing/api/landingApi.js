/**
 * Accès au contenu public de la page d'accueil.
 *
 * Volontairement sur `fetch` brut (pas le client authentifié) : la landing est publique et
 * doit se charger même avec un jeton périmé, sans déclencher le rafraîchissement ni les toasts.
 */
import { config } from '@/core/config'
import { endpoints } from '@/shared/api/endpoints'

export async function fetchLandingContent(signal) {
  const url = `${config.apiBaseUrl}${endpoints.public.landing}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!res.ok) {
    throw new Error(`Landing API ${res.status}`)
  }
  return res.json()
}
