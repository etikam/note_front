# Année académique — client React (Vite)

Ce document explique **comment le front envoie l’année choisie à l’API**, comment **réutiliser** ce mécanisme dans les prochaines tâches, et comment le **tester**.

## Comportement

1. **Stockage** : l’ID d’année (`AcademicYear.pk` côté Django) est persisté dans **`localStorage`** sous la clé `gestion_ci.academic_year_id`.
2. **Intercepteur Axios** ([`src/api/client.js`](../src/api/client.js)) : avant chaque requête, si l’URL **n’est pas** une route d’auth, ajoute :
   - `X-Academic-Year-Id: <valeur du storage>`
3. Si **aucun ID** n’est stocké, **aucun header** n’est envoyé → le backend utilise l’année dont **`is_current=True`** (middleware Django, même règle que les données).
4. Après chargement de `GET /api/v1/academics/academic-years/`, si le storage est vide et que l’utilisateur n’a pas choisi « défaut API », le client **aligne** le storage sur l’année **`is_current`** renvoyée par l’API (libellé + en-tête cohérents).
5. Les routes **`/api/v1/auth/`** ne reçoivent **jamais** cet en-tête (login, activation, etc.).

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| [`src/core/academicYearStorage.js`](../src/core/academicYearStorage.js) | Lecture / écriture localStorage (API utilitaire, utilisable hors React) |
| [`src/core/apiPaths.js`](../src/core/apiPaths.js) | `AUTH_API_PREFIX`, `isAuthApiPath()` pour savoir quoi exclure |
| [`src/api/client.js`](../src/api/client.js) | Intercepteur requête + réponse (401) |
| [`src/context/AcademicYearContext.jsx`](../src/context/AcademicYearContext.jsx) | Provider + hook `useAcademicYear()` |
| [`src/components/AcademicYearBanner.jsx`](../src/components/AcademicYearBanner.jsx) | UI minimale (saisie ID) — à remplacer par une liste API plus tard |
| [`src/core/config.js`](../src/core/config.js) | Pas de défaut d’année : la source de vérité est **`is_current`** côté API |

## Utilisation dans une nouvelle page / feature

### Appels API

**Toujours** passer par `apiClient` importé depuis `@/api` ou `@/api/client` :

```javascript
import { apiClient } from '@/api'

// L’en-tête X-Academic-Year-Id est ajouté automatiquement (sauf si vous appelez une URL /api/v1/auth/)
const { data } = await apiClient.get('/api/v1/enrollment/')
```

Ne pas recréer un `axios.create()` sans les intercepteurs, sinon le scope année sera perdu.

### Lire ou changer l’année dans l’UI

```javascript
import { useAcademicYear } from '@/context/AcademicYearContext'

function MaPage() {
  const { academicYearId, academicYearIdNumber, setAcademicYearId, clearAcademicYear } =
    useAcademicYear()

  // ...
}
```

- **`academicYearId`** : `string | null` (contenu du storage).
- **`academicYearIdNumber`** : `number | null` (pratique pour affichage ou comparaisons).
- **`setAcademicYearId(id)`** : `id` peut être `string`, `number`, ou `null` pour effacer.
- **`clearAcademicYear()`** : efface le storage et met à jour le contexte.

### Hors React (tests, script)

```javascript
import { setStoredAcademicYearId, getStoredAcademicYearId } from '@/core/academicYearStorage'

setStoredAcademicYearId(2)
```

### Première visite

Pas de variable d’environnement pour forcer un ID : après réception de la liste d’années, le client sélectionne l’entrée avec **`is_current === true`** (alignée sur `seed_academic_years` / admin Django).

## CORS

Le backend doit autoriser les en-têtes `x-academic-year-id` et `x-academic-year` (déjà configuré côté Django dans `CORS_ALLOW_HEADERS`).

## Vérification rapide

1. Ouvrir les DevTools → Network.
2. Choisir un ID dans la bannière et **Appliquer**.
3. Lancer une requête vers `/api/v1/...` (pas `/auth/`) : la requête doit contenir **`X-Academic-Year-Id`**.
4. Appeler une route d’auth : le header ne doit **pas** apparaître.

## Référence backend

Voir le document racine du dépôt : [`docs/ACADEMIC_YEAR_SCOPING.md`](../../docs/ACADEMIC_YEAR_SCOPING.md).
