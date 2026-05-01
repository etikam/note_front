import { Card } from '@/shared/ui/Card'
import { Stack } from '@/shared/ui/Stack'
import { cn } from '@/shared/lib/cn'

const ACCENTS = {
  brand: 'border-l-[3px] border-l-brand-500',
  orange: 'border-l-[3px] border-l-orange-500',
  none: '',
}

/**
 * @param {{
 *   step: 1 | 2 | 3
 *   title: string
 *   accent?: 'brand' | 'orange' | 'none'
 *   className?: string
 *   children: import('react').ReactNode
 * }} props
 */
export function ImportStepCard({ step, title, accent = 'brand', className, children }) {
  return (
    <Card className={cn('p-5 sm:p-6 shadow-sm', ACCENTS[accent] ?? ACCENTS.brand, className)}>
      <Stack size="md">
        <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="text-brand-600 dark:text-brand-400 tabular-nums">{step}.</span> {title}
        </h2>
        {children}
      </Stack>
    </Card>
  )
}
