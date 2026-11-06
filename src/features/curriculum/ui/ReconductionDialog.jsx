import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, CopyPlus } from 'lucide-react'

import { apiErrorMessage, fetchReconduction, postReconduction } from '@/features/curriculum/api/curriculaApi'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Dialog } from '@/shared/ui/Dialog'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]'

function Report({ report, sourceLabel, yearLabel }) {
  const rows = [
    ['Départements', report.departments],
    ['Programmes', report.programs],
    ['Niveaux', report.levels],
    ['UE', report.units],
    ['Cours', report.courses],
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-900 dark:bg-green-500/10 dark:text-green-100">
        <CheckCircle2 size={22} className="shrink-0" aria-hidden />
        <p className="text-[13px] leading-relaxed">
          La structure de {sourceLabel} a été recopiée dans {yearLabel}, en brouillon. Ajustez chaque maquette, puis faites-la valider.
        </p>
      </div>
      <dl className="grid grid-cols-5 gap-2 text-center">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-[var(--app-subtle)] px-2 py-2.5">
            <dd className="font-heading text-[19px] font-semibold tabular-nums">{value}</dd>
            <dt className="text-[11px] text-[var(--app-muted)]">{label}</dt>
          </div>
        ))}
      </dl>
      {report.courses_without_module ? (
        <p className="flex gap-2 text-[12.5px] text-secondary-800 dark:text-secondary-200">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
          {report.courses_without_module} cours non recopiés : créez les modules M1 et M2 de l’année, puis relancez la reconduction de ces programmes.
        </p>
      ) : null}
      {report.skipped_programs?.length ? (
        <ul className="space-y-1 text-[12px] text-[var(--app-fg-soft)]">
          {report.skipped_programs.map((s) => (
            <li key={s.code}>
              <span className="font-mono font-semibold">{s.code}</span> ignoré : {s.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Assistant : recopier tout ou partie de la structure d'une année vers l'année consultée (en brouillon). */
export function ReconductionDialog({ open, yearId, yearLabel, onClose, onDone }) {
  const [sourceId, setSourceId] = useState('')
  const [preview, setPreview] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [withCourses, setWithCourses] = useState(true)
  const [withTeachers, setWithTeachers] = useState(true)
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (!open) return
    setReport(null)
    setSourceId('')
  }, [open])

  useEffect(() => {
    if (!open || !yearId) return undefined
    let cancelled = false
    setPreview(null)
    fetchReconduction(yearId, sourceId || undefined)
      .then((data) => {
        if (cancelled) return
        setPreview(data)
        if (!sourceId && data.source) setSourceId(String(data.source.id))
        setSelected(new Set(data.departments.flatMap((d) => d.programs.filter((p) => !p.present).map((p) => p.id))))
      })
      .catch((err) => !cancelled && dispatchToast({ type: 'error', message: apiErrorMessage(err) }))
    return () => {
      cancelled = true
    }
  }, [open, yearId, sourceId])

  const available = useMemo(() => (preview?.departments ?? []).flatMap((d) => d.programs.filter((p) => !p.present)), [preview])
  const totals = useMemo(() => {
    const chosen = available.filter((p) => selected.has(p.id))
    return {
      programs: chosen.length,
      units: chosen.reduce((s, p) => s + p.units, 0),
      courses: chosen.reduce((s, p) => s + p.courses, 0),
    }
  }, [available, selected])
  const missingModules = preview ? [1, 2].filter((n) => !preview.target.modules.includes(n)) : []

  const toggle = (ids, on) =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) (on ? next.add(id) : next.delete(id))
      return next
    })

  const run = async () => {
    setBusy(true)
    try {
      const data = await postReconduction(yearId, {
        source_year: Number(sourceId),
        programs: [...selected],
        include_courses: withCourses,
        include_teachers: withCourses && withTeachers,
      })
      setReport(data)
      dispatchToast({ type: 'success', message: `${data.programs} programme${data.programs > 1 ? 's' : ''} reconduit${data.programs > 1 ? 's' : ''}.` })
      onDone?.()
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const sourceLabel = preview?.sources.find((s) => String(s.id) === sourceId)?.label ?? preview?.source?.label

  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      size="xl"
      icon={CopyPlus}
      title={`Préparer ${yearLabel ?? 'l’année'}`}
      description="Recopie la structure d’une autre année en brouillon : départements, programmes, niveaux, UE et cours. Les identités sont conservées, l’année source ne change pas."
      footer={
        report ? (
          <div className="flex justify-end"><Button onClick={onClose}>Terminer</Button></div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-[var(--app-muted)]">
              {totals.programs} programme{totals.programs > 1 ? 's' : ''} · {totals.units} UE{withCourses ? ` · ${totals.courses} cours` : ''}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
              <Button onClick={run} disabled={busy || !sourceId || totals.programs === 0}>
                {busy ? 'Reconduction…' : 'Reconduire'}
              </Button>
            </div>
          </div>
        )
      }
    >
      {report ? (
        <Report report={report} sourceLabel={sourceLabel} yearLabel={yearLabel} />
      ) : !preview ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : !preview.sources.length ? (
        <p className="text-[13px] text-[var(--app-fg-soft)]">Aucune autre année ne possède de structure à reconduire.</p>
      ) : (
        <div className="space-y-5">
          <label className="flex flex-wrap items-center gap-3 text-[13px] font-medium">
            Reconduire depuis
            <select className={SELECT} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              {preview.sources.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>

          <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
            {preview.departments.map((dept) => {
              const open = dept.programs.filter((p) => !p.present)
              const allOn = open.length > 0 && open.every((p) => selected.has(p.id))
              const someOn = open.some((p) => selected.has(p.id))
              return (
                <fieldset key={dept.id} className="rounded-xl border border-[var(--app-border)]">
                  <legend className="sr-only">{dept.name}</legend>
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-subtle)]/60 px-3 py-2">
                    <Checkbox
                      checked={allOn}
                      indeterminate={!allOn && someOn}
                      disabled={!open.length}
                      onChange={(on) => toggle(open.map((p) => p.id), on)}
                      label={<span className="text-[13px] font-semibold">{dept.code} — {dept.name}</span>}
                    />
                    {dept.present ? <StatusPill tone="neutral" dot={false}>déjà dans {yearLabel}</StatusPill> : null}
                  </div>
                  <ul className="divide-y divide-[var(--app-border)]">
                    {dept.programs.map((p) => (
                      <li key={p.id} className={cn('flex items-center justify-between gap-3 py-2 pl-9 pr-3', p.present && 'opacity-60')}>
                        <Checkbox
                          checked={p.present || selected.has(p.id)}
                          disabled={p.present}
                          onChange={(on) => toggle([p.id], on)}
                          label={<span className="text-[13px]"><span className="font-mono text-[12px] font-semibold">{p.code}</span> {p.name}</span>}
                        />
                        <span className="shrink-0 text-[11.5px] tabular-nums text-[var(--app-muted)]">
                          {p.present ? 'déjà reconduit' : `${p.levels} niv. · ${p.units} UE · ${p.courses} cours`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              )
            })}
          </div>

          <div className="space-y-2.5 rounded-xl border border-[var(--app-border)] p-3">
            <Checkbox
              checked={withCourses}
              onChange={setWithCourses}
              label={<span className="text-[13px] font-medium">Recopier les cours de chaque UE</span>}
              description="Sans cela, seules les UE sont reprises : les cours seront offerts à la main."
            />
            <Checkbox
              checked={withCourses && withTeachers}
              disabled={!withCourses}
              onChange={setWithTeachers}
              label={<span className="text-[13px] font-medium">Garder les enseignants affectés</span>}
              description="À titre de proposition : chaque affectation reste modifiable."
            />
            {withCourses && missingModules.length ? (
              <p className="flex gap-2 rounded-lg bg-secondary-50 p-2.5 text-[12px] text-secondary-900 dark:bg-secondary-500/10 dark:text-secondary-100">
                <AlertTriangle size={15} className="mt-px shrink-0" aria-hidden />
                Module{missingModules.length > 1 ? 's' : ''} {missingModules.map((n) => `M${n}`).join(' et ')} absent{missingModules.length > 1 ? 's' : ''} en {yearLabel} :
                créez-{missingModules.length > 1 ? 'les' : 'le'} dans{' '}
                <Link to="/settings/calendar" className="font-semibold underline">Paramètres → Calendrier</Link>, sinon les cours correspondants ne seront pas recopiés.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </Dialog>
  )
}
