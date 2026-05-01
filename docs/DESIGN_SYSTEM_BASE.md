# Design System Base (Frontend)

## Objectif

Avoir une base UI propre, stable et reutilisable avant la phase de design detaillee.

## Tokens globaux

Fichier: `src/app/styles/theme.css`

- couleurs de fond/surface/texte
- couleur accent dynamique (`--color-accent`)
- mode clair/sombre via `data-theme`
- rayons et ombres standards

## Composants de base

Fichiers: `src/shared/ui/*`

- `Button`
  - variants: `primary`, `ghost`, `danger`
  - sizes: `sm`, `md`, `lg`
  - support `as={Link}` pour navigation
- `Card`
- `Field`, `Input`, `Select`
- `Badge`
- `Stack`

## Regles d'usage

1. Toujours utiliser `shared/ui` pour les nouveaux ecrans.
2. Eviter d'ajouter des classes ad-hoc dans les pages.
3. Toute nouvelle variante visuelle passe d'abord par le composant (pas directement en page).
4. Conserver les tokens comme source de verite pour les couleurs et espacements.

## Theming dashboard

- Le changement de couleur dashboard agit via `ThemeProvider`.
- Les composants utilisent la variable `--color-accent`.
- Les maquettes peuvent donc changer de couleur sans refactor CSS.

## Extension recommandee (prochaine etape)

- ajouter `Tabs`, `Modal`, `Toast`, `Table`, `KpiCard`
- ajouter des etats composants (loading, disabled, error, success)
- documenter les patterns pages auth/activation
