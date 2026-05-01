import { cn } from '@/shared/lib/cn'

const GAPS = {
  sm: 'flex flex-col gap-2',
  md: 'flex flex-col gap-4',
  lg: 'flex flex-col gap-6',
}

export function Stack({ size = 'md', className, ...props }) {
  return <div className={cn(GAPS[size] ?? GAPS.md, className)} {...props} />
}
