# basta-bo

Back-office d'administration de l'application Basta (cuisine/recettes) : gestion des recettes, conseils, abonnements, utilisateurs, retours de désabonnement et statistiques.

Construit avec Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui et Zustand, avec Supabase comme backend de données.

## Lancement en local

### Prérequis

- Node.js 22
- Accès à un projet Supabase (URL + clés) configuré pour basta

### Installation

```bash
npm install
```

### Variables d'environnement

Créer un fichier `.env.local` à la racine avec les variables suivantes (noms uniquement, demander les valeurs à l'équipe) :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `FIREBASE_API_URL`
- `FIREBASE_BACKEND_URL`
- `OPENAI_API_KEY`

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application est servie sur [http://localhost:3000](http://localhost:3000).

## Autres commandes

```bash
npm run build   # build de production
npm run start   # démarrer le build de production
npm run lint     # lint du code
```

## Architecture et conventions

Voir [CLAUDE.md](./CLAUDE.md) pour la stack détaillée, la structure du projet et les conventions de code.
