import { cn } from '@/shared/lib/cn'

const PALETTE = [
  'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-100',
  'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-100',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-100',
  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-100',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-100',
]

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function hash(text) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** Avatar à initiales (photo si fournie), couleur stable dérivée du nom. */
export function Avatar({ name = '', src, size = 'sm', className }) {
  if (src) {
    return <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)} />
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
        SIZES[size] ?? SIZES.sm,
        PALETTE[hash(name) % PALETTE.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
