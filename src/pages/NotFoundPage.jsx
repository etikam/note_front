import { Link } from 'react-router-dom'
import { Button, Card } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <Card className="auth-card">
      <h1>Page introuvable</h1>
      <p>La route demandee n'existe pas.</p>
      <Button as={Link} to="/">
        Retour a l'accueil
      </Button>
    </Card>
  )
}
