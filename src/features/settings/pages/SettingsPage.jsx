import { ThemeModeToggle } from '@/features/theme/ui/ThemeControls'
import { Card } from '@/shared/ui'

export function SettingsPage() {
  return (
    <section className="stack-lg">
      <header>
        <h1>Configuration</h1>
        <p className="text-muted">Personnalisez l’affichage du dashboard.</p>
      </header>

      <Card className="stack-md">
        <h2 style={{ margin: 0 }}>Thème</h2>
        <p className="text-muted" style={{ margin: 0 }}>
          Interface en bleu marine, avec mode clair ou sombre.
        </p>
        <div>
          <ThemeModeToggle />
        </div>
      </Card>
    </section>
  )
}
