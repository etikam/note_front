/**
 * Sites de programmes servis en host-aware par le même conteneur que la landing.
 *
 * Chaque programme a son sous-domaine (ex. `bioinfo.ci.edu.gn`). Le résolveur ci-dessous
 * est consommé par `main.jsx` AVANT les providers de l'app : sur un sous-domaine de
 * programme, on monte un site autonome (pas d'auth, pas de routeur, pas d'appel API).
 */

/** hostname → slug de programme. */
export const PROGRAM_HOSTS = {
  'bioinfo.ci.edu.gn': 'bioinformatique',
  // Permet un test local : http://bioinfo.localhost:5173
  'bioinfo.localhost': 'bioinformatique',
}

/** Retourne le slug du programme pour un hostname, ou `null` si ce n'est pas un site de programme. */
export function resolveProgramHost(hostname) {
  if (!hostname) return null
  return PROGRAM_HOSTS[hostname] || null
}
