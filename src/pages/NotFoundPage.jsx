import { Link } from 'react-router-dom'
import { Button, Card } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <Card className="auth-card">
      <h1>Page introuvable</h1>
      <p>La page demandée n’existe pas.</p>
      <Button as={Link} to="/">
        Retour à l’accueil
      </Button>
    </Card>
  )
}
