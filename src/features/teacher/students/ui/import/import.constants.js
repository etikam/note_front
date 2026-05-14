/** Colonnes obligatoires du CSV (aligné backend / csvPreview). */
export const REQUIRED_COLUMNS = [
  'matricule',
  'first_name',
  'last_name',
  'INE',
  'department_code',
  'level_cycle',
  'level_number',
]

/** Colonnes facultatives (API import) : gender, status, phone, birth_date, cohorte_promotion, cohorte_annee_entree. */

export const PREVIEW_ROW_CAP = 15

export const MAX_FILE_SIZE_LABEL = '5 Mo'

/** Classes tableau partagées (aperçu + résultat détail). */
export const importTableClassName =
  'w-full min-w-[36rem] border-collapse text-left text-[13px] leading-tight ' +
  '[&_th]:sticky [&_th]:top-0 [&_th]:z-[1] [&_th]:bg-zinc-100 [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:text-zinc-700 [&_th]:border-b [&_th]:border-zinc-200 ' +
  'dark:[&_th]:bg-brand-900/60 dark:[&_th]:text-zinc-200 dark:[&_th]:border-brand-800 ' +
  '[&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-zinc-100 dark:[&_td]:border-brand-900/50 ' +
  '[&_tbody_tr:hover]:bg-zinc-50/80 dark:[&_tbody_tr:hover]:bg-brand-950/30'
