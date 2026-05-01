import { Card } from '@/shared/ui'

export function ComingSoonPage({ title, subtitle, items = [] }) {
  return (
    <section className="stack-lg">
      <header>
        <h1>{title}</h1>
        {subtitle ? <p className="text-muted">{subtitle}</p> : null}
      </header>

      <Card>
        <h2 style={{ marginTop: 0 }}>Fonctionnalité en cours de dev</h2>
        {items?.length ? (
          <ul className="list">
            {items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted" style={{ margin: 0 }}>
            Cette section est prête côté interface et sera branchée sur l’API progressivement.
          </p>
        )}
      </Card>
    </section>
  )
}

