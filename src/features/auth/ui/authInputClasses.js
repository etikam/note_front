const AUTH_UNDERLINE_CORE =
  'w-full min-h-[2.75rem] box-border border-0 border-b-2 border-zinc-300 dark:border-[var(--app-border)] ' +
  'bg-transparent pl-9 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-none shadow-none ' +
  'focus:outline-none focus:ring-0 focus:border-brand-600 dark:focus:border-brand-400 ' +
  'transition-[border-color] duration-150 disabled:opacity-50 disabled:cursor-not-allowed'

/**
 * Champs auth : ligne de soulignement (texte, email, mot de passe).
 */
export const authInputUnderline = `${AUTH_UNDERLINE_CORE} pr-4`

/**
 * Liste déroulante : même trait + flèche custom (icône à droite du parent).
 */
export const authSelectUnderline = `${AUTH_UNDERLINE_CORE} pr-9 cursor-pointer appearance-none`
