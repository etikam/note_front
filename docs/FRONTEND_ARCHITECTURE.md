# Architecture Frontend — Gestion CI

## Objectif

Fournir un socle frontend modulaire, propre et evolutif, aligne sur la structure du backend Django/DRF.

## Structure mise en place

```text
src/
  app/
    App.jsx
    layouts/
    providers/
    router/
    styles/
  shared/
    api/
    ui/
    lib/
  features/
    auth/
      api/
      model/
      pages/
      ui/
    academicYear/
      model/
      ui/
    theme/
      model/
      ui/
    teacher/
      pages/
    student/
      pages/
    landing/
      pages/
  pages/
    NotFoundPage.jsx
```

## Providers globaux

- `ThemeProvider`: mode clair/sombre + accent dynamique (multi-theme).
- `AuthProvider`: bootstrap session (`/auth/me`), gestion logout, gestion 401 globale.
- `AcademicYearProvider`: contexte transverse annee academique et header API `X-Academic-Year-Id`.

## Communication API

Le client HTTP central est dans `src/shared/api/client.js`:

- timeout configure,
- `withCredentials` pour session,
- normalisation des erreurs dans `HttpError`,
- callback global sur `401`,
- injection automatique de `X-Academic-Year-Id` (hors routes auth).

Le design system de base est dans `src/shared/ui`.

Routes backend centralisees dans `src/shared/api/endpoints.js`.

## Theming multi-couleurs

Le theme repose sur des CSS variables:

- `--color-accent` change dynamiquement selon la couleur choisie,
- support `data-theme="light|dark"`,
- base de composants prete pour dashboards multi-theme.

Accents disponibles:
- emerald
- ocean
- violet
- amber
- rose

## Routage

- Public: landing + auth.
- Protege: dashboards et espaces metier.
- Guards:
  - `GuestRoute` pour pages non connectees,
  - `ProtectedRoute` pour pages authentifiees.

## Alignement backend actuel

Endpoints auth actives:
- `POST /api/v1/auth/activation/student/lookup/`
- `POST /api/v1/auth/activation/student/request-otp/`
- `POST /api/v1/auth/activation/student/activate/`
- `POST /api/v1/auth/activation/teacher/lookup/`
- `POST /api/v1/auth/activation/teacher/request-otp/`
- `POST /api/v1/auth/activation/teacher/activate/`

Endpoints `login/logout/me` sont deja prevus cote frontend pour la suite.

## Mode design local optionnel

Pour designer avant que les endpoints auth complets soient disponibles:

- variable `VITE_ENABLE_DESIGN_MODE=true`,
- depuis `Login`, entree locale en profil enseignant ou etudiant,
- session stockee localement uniquement pour la maquette.

## Extensibilite recommandee

Pour chaque nouveau domaine backend:

1. Ajouter `features/<domaine>/api`.
2. Ajouter types UI/pages dans `features/<domaine>/pages`.
3. Mettre les endpoints dans `shared/api/endpoints.js`.
4. Garder les composants purement visuels reutilisables dans `shared` si besoin.
