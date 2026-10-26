import { MAKEUP_MODES, MAKEUP_SCOPES, RULE_FIELDS, describeRule } from '@/features/regulations/model/regulationRules'
import { cn } from '@/shared/lib/cn'
import { Checkbox } from '@/shared/ui/Checkbox'
import { SectionCard } from '@/shared/ui/SectionCard'

const INPUT =
  'h-9 w-24 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] tabular-nums text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-60'

const num = (v) => (v === '' ? '' : Number(v))

function Choice({ options, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-1.5" role="radiogroup">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition-colors',
            value === o.value ? 'border-brand-500 bg-brand-50/60 dark:border-brand-400 dark:bg-white/[0.04]' : 'border-[var(--app-border)] hover:bg-[var(--app-hover)]',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <input type="radio" className="mt-1 accent-brand-600" checked={value === o.value} onChange={() => onChange(o.value)} disabled={disabled} />
          <span>
            <span className="block font-medium text-[var(--app-fg)]">{o.label}</span>
            <span className="block text-[12px] text-[var(--app-muted)]">{o.help}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

/** Valeur optionnelle (``null`` = désactivée) : case « activer » + nombre. */
function Optional({ value, onChange, disabled, enableLabel, defaultValue, ...input }) {
  const on = value != null
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Checkbox checked={on} disabled={disabled} onChange={(v) => onChange(v ? defaultValue : null)} label={enableLabel} />
      {on ? <input type="number" className={INPUT} value={value} disabled={disabled} onChange={(e) => onChange(num(e.target.value))} {...input} /> : null}
    </div>
  )
}

function Control({ section, field, value, onChange, disabled, rules, scaleLocked }) {
  const scale = rules.notation.scale_max
  switch (`${section}.${field.key}`) {
    case 'notation.scale_max':
      return (
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={100} className={INPUT} value={value} disabled={disabled || scaleLocked} onChange={(e) => onChange(num(e.target.value))} />
          {scaleLocked ? <span className="text-[12px] text-[var(--app-muted)]">Figé : des notes sont saisies.</span> : null}
        </div>
      )
    case 'notation.pass_mark':
      return (
        <span className="flex items-center gap-2 text-[13px] text-[var(--app-muted)]">
          <input type="number" min={0} max={scale} step={0.25} className={INPUT} value={value} disabled={disabled} onChange={(e) => onChange(num(e.target.value))} /> / {scale}
        </span>
      )
    case 'notation.weights': {
      const total = value.reduce((n, w) => n + (Number(w) || 0), 0)
      return (
        <div className="flex flex-wrap items-center gap-2">
          {value.map((w, i) => (
            <label key={i} className="flex items-center gap-1.5 text-[12.5px] text-[var(--app-muted)]">
              N{i + 1}
              <input
                type="number"
                min={0}
                max={100}
                className={cn(INPUT, 'w-20')}
                value={w}
                disabled={disabled}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? num(e.target.value) : x)))}
              />
              %
            </label>
          ))}
          <span className={cn('text-[12.5px] font-medium tabular-nums', total === 100 ? 'text-[var(--app-muted)]' : 'text-red-700 dark:text-red-300')}>
            Total {total} %
          </span>
        </div>
      )
    }
    case 'notation.makeup_mode':
      return <Choice options={MAKEUP_MODES} value={value} onChange={onChange} disabled={disabled} />
    case 'notation.makeup_cap':
      return <Optional value={value} onChange={onChange} disabled={disabled} enableLabel="Plafonner" defaultValue={rules.notation.pass_mark} min={0} max={scale} step={0.25} />
    case 'deliberation.ue_compensation':
    case 'deliberation.semester_compensation':
      return <Checkbox checked={Boolean(value)} disabled={disabled} onChange={onChange} label={value ? 'Activée' : 'Désactivée'} />
    case 'deliberation.eliminatory_mark':
      return <Optional value={value} onChange={onChange} disabled={disabled} enableLabel="Appliquer une note éliminatoire" defaultValue={Math.max(0, Number(rules.notation.pass_mark) - 2)} min={0} max={scale} step={0.25} />
    case 'deliberation.makeup_scope':
      return <Choice options={MAKEUP_SCOPES} value={value} onChange={onChange} disabled={disabled} />
    case 'deliberation.max_debts':
      return <Optional value={value} onChange={onChange} disabled={disabled} enableLabel="Limiter les dettes" defaultValue={2} min={0} max={20} step={1} />
    default:
      return null
  }
}

const SECTIONS = [
  { id: 'notation', title: 'Notation d’un cours', description: 'Comment la moyenne et le résultat d’un cours sont calculés à partir de ses notes.' },
  { id: 'deliberation', title: 'Délibération', description: 'Comment le jury valide les UE et décide pour chaque étudiant (PV, relevés).' },
]

/**
 * Formulaire de règlement. ``mode="override"`` : exceptions d'un programme — ``value`` ne contient que
 * les règles surchargées, ``base`` les règles héritées de l'établissement.
 */
export function RulesForm({ value, onChange, base, mode = 'base', readOnly = false, scaleLocked = false }) {
  const override = mode === 'override'
  const resolved = override
    ? { notation: { ...base.notation, ...(value.notation ?? {}) }, deliberation: { ...base.deliberation, ...(value.deliberation ?? {}) } }
    : value

  function setRule(section, key, v) {
    onChange({ ...value, [section]: { ...(value[section] ?? {}), [key]: v } })
  }

  function toggleOverride(section, key, on) {
    const next = { ...value, [section]: { ...(value[section] ?? {}) } }
    if (on) next[section][key] = base[section][key]
    else delete next[section][key]
    if (!Object.keys(next[section]).length) delete next[section]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map((s) => (
        <SectionCard key={s.id} title={s.title} description={s.description}>
          <div className="-my-3 divide-y divide-[var(--app-border)]">
            {RULE_FIELDS[s.id].map((f) => {
              const overridden = override && value[s.id] && f.key in value[s.id]
              return (
                <div key={f.key} className="grid gap-3 py-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--app-fg)]">{f.label}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--app-muted)]">{f.help}</p>
                    {override ? (
                      <div className="mt-2">
                        <Checkbox
                          checked={Boolean(overridden)}
                          disabled={readOnly}
                          onChange={(on) => toggleOverride(s.id, f.key, on)}
                          label={<span className="text-[12px]">Exception pour ce programme</span>}
                          description={overridden ? null : `Hérité : ${describeRule(s.id, f.key, base[s.id][f.key])}`}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className={cn(override && !overridden && 'opacity-50')}>
                    <Control
                      section={s.id}
                      field={f}
                      value={resolved[s.id][f.key]}
                      onChange={(v) => setRule(s.id, f.key, v)}
                      disabled={readOnly || (override && !overridden)}
                      rules={resolved}
                      scaleLocked={scaleLocked}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
