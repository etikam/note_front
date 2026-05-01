# Frontend Notes (CI)

Application **React + Vite** pour `https://notes.ci.edu.gn`. Elle consomme l’API sur **`https://api.notes.ci.edu.gn`** (URL configurable au build).

En production Docker, le dossier **`dist`** est servi par **nginx** (port **80** dans le conteneur) ; **Traefik** termine le TLS et fait proxy vers ce service. Le nom d’hôte public du front est défini par **`PUBLIC_WEB_HOST`** dans `.env` (interpolation Compose pour la règle `Host(...)`), défaut **`notes.ci.edu.gn`**.

## Dépôt

Ce dossier est prévu pour vivre dans un **dépôt Git séparé** du backend (`notes-api`).

## Développement local

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_BASE_URL` dans `.env` pointe vers ton API locale ou distante.

## Déploiement (Docker + Traefik)

Prérequis sur le VPS : réseau **`traefik-public`**, gateway Traefik, DNS **`notes.ci.edu.gn`** → IP du VPS.

```bash
cp .env.example .env
docker compose up -d --build
```

Les variables du fichier `.env` sont passées comme **build args** ; toute modification d’URL API nécessite **`docker compose up -d --build`**.

Voir aussi **`../gateway/BRANCHEMENT.md`**.
