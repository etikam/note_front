import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export function Stepper({ steps, currentStep, completedSteps = new Set() }) {
  return (
    <div className="flex items-center" role="navigation" aria-label="Progression">
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isCompleted = completedSteps.has(stepNumber)
        const isActive = stepNumber === currentStep

        return (
          <div key={stepNumber} className="flex items-center flex-1 last:flex-none">
            {/* Connecteur */}
            {index > 0 && (
              <div className="flex-1 h-px mx-2 bg-zinc-200 dark:bg-[var(--app-border)] relative overflow-hidden">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 bg-brand-600 transition-[width] duration-300',
                    isCompleted || isActive ? 'w-full' : 'w-0'
                  )}
                />
              </div>
            )}

            <div className="flex flex-col items-center gap-1.5 shrink-0">
              {/* Cercle */}
              <div
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                  isCompleted && 'bg-brand-600 text-white dark:bg-brand-500 dark:text-white',
                  isActive && !isCompleted && 'bg-brand-600 text-white dark:bg-brand-500 dark:text-white ring-4 ring-brand-100 dark:ring-[color-mix(in_srgb,var(--app-elevated)_65%,white)]',
                  !isActive && !isCompleted && 'bg-zinc-100 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)] text-zinc-400 dark:text-zinc-400'
                )}
              >
                {isCompleted ? <Check size={15} strokeWidth={2.5} /> : stepNumber}
              </div>
              {/* Label */}
              <span className={cn(
                'text-[11px] font-medium text-center leading-tight whitespace-nowrap',
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : isCompleted
                    ? 'text-zinc-600 dark:text-zinc-300'
                    : 'text-zinc-400 dark:text-zinc-500'
              )}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
