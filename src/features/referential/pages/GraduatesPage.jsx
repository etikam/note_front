import { useReferential } from '@/features/referential/model/ReferentialContext'
import { GraduatesBoard } from '@/features/referential/ui/GraduatesBoard'

/** Sortants de l'année, tous programmes du périmètre. */
export default function GraduatesPage() {
  const ref = useReferential()
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">Sortants · {ref.yearLabel}</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight">Les finissants de l’année</h1>
        <p className="mt-1.5 max-w-3xl text-[13px] text-[var(--app-fg-soft)]">
          Étudiants inscrits au dernier niveau de leur programme : qui est diplômable, qui doit encore solder des dettes, et si le dernier semestre est bouclé.
        </p>
      </section>
      <GraduatesBoard yearLabel={ref.yearLabel} />
    </div>
  )
}
