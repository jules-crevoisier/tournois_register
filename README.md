# Tournament Registration Platform

Une plateforme complète pour l'inscription aux tournois de jeux vidéo, construite avec Next.js 14, Payload CMS 3, Prisma, et shadcn/ui.

## Fonctionnalités

### Pour les utilisateurs
- ✅ Parcourir les tournois disponibles
- ✅ Voir les détails des tournois (jeu, nombre de joueurs, dates, etc.)
- ✅ S'inscrire et se connecter
- ✅ Inscrire une équipe à un tournoi
- ✅ Remplir les informations des joueurs (nom, pseudo en jeu, pseudo Discord)

### Pour les administrateurs
- ✅ Interface d'administration Payload CMS
- ✅ Créer et gérer les tournois
- ✅ Définir le jeu, le nombre de joueurs par équipe, la capacité
- ✅ Upload d'images pour les tournois
- ✅ Gérer les inscriptions et les équipes

## Technologies utilisées

- **Frontend**: Next.js 14 (App Router), React, TypeScript, shadcn/ui, TailwindCSS
- **Backend**: Payload CMS 3, Prisma ORM
- **Base de données**: PostgreSQL
- **Stockage de fichiers**: Vercel Blob
- **Déploiement**: Vercel

## Installation locale

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd tournois_register
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp env.example .env.local
   ```
   
   Remplir les variables dans `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/tournament_db"
   
   # Payload CMS
   PAYLOAD_SECRET="your-secret-key-here"
   NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
   
   # Vercel Blob Storage
   BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
   ```

4. **Configurer la base de données**
   ```bash
   # Générer le client Prisma
   npm run db:generate
   
   # Appliquer le schéma à la base de données
   npm run db:push
   ```

5. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

6. **Accéder à l'application**
   - Frontend: http://localhost:3000
   - Admin Payload CMS: http://localhost:3000/admin

## Déploiement sur Vercel

📚 **[Guide de Déploiement Complet](./DEPLOYMENT.md)**

Pour un guide détaillé étape par étape, consultez le fichier **DEPLOYMENT.md**.

### Résumé Rapide

1. **Créer un projet Vercel** et connecter votre repository GitHub
2. **Configurer Vercel Postgres** dans Storage → Create Database → Postgres
3. **Définir les variables d'environnement** (voir `.env.example`)
4. **Push sur GitHub** - Déploiement automatique
5. **Appliquer le schéma Prisma**: `vercel env pull && npx prisma db push`
6. **Créer un admin**: Visiter `https://your-app.vercel.app/admin`

### Variables d'Environnement Requises

Consultez `.env.example` pour la liste complète. Les essentielles:

```env
DATABASE_URL="postgresql://..."                    # Vercel Postgres
PAYLOAD_SECRET="..."                               # Min 32 caractères
NEXT_PUBLIC_SERVER_URL="https://your-app.vercel.app"
BLOB_READ_WRITE_TOKEN="..."                        # Optionnel
```

Générer `PAYLOAD_SECRET`:
```bash
openssl rand -base64 32
```

## Structure du projet

```
src/
├── app/
│   ├── (frontend)/          # Pages publiques
│   │   ├── page.tsx         # Accueil - liste des tournois
│   │   ├── tournaments/[id]/ # Détails du tournoi
│   │   ├── login/           # Connexion
│   │   └── register/        # Inscription
│   ├── (payload)/           # Admin Payload CMS
│   │   └── admin/
│   └── api/                 # Routes API
│       ├── tournaments/     # CRUD tournois
│       └── teams/           # Inscription équipes
├── collections/             # Collections Payload CMS
│   ├── Users.ts
│   ├── Tournaments.ts
│   ├── Teams.ts
│   └── Media.ts
├── components/              # Composants React
│   ├── ui/                  # Composants shadcn/ui
│   └── RegistrationForm.tsx
├── lib/
│   ├── prisma.ts           # Client Prisma
│   └── utils.ts            # Utilitaires
└── payload.config.ts       # Configuration Payload CMS
```

## Modèles de données

### User
- `id`, `email`, `password`, `role` (admin/user)
- Relations: tournois créés, équipes

### Tournament
- `id`, `title`, `description`, `game`
- `playersPerTeam`, `maxTeams`
- `startDate`, `endDate`, `registrationDeadline`
- `status` (draft/open/closed/ongoing/finished)
- `image` (URL Vercel Blob)
- Relations: créateur, équipes

### Team
- `id`, `teamName`, `players` (JSON array)
- `registeredAt`, `status` (pending/confirmed/cancelled)
- Relations: tournoi, capitaine

### Player (nested in Team)
- `playerName` (nom réel)
- `gameUsername` (pseudo en jeu)
- `discordUsername` (pseudo Discord)

## Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Appliquer le schéma à la DB
- `npm run db:migrate` - Créer une migration
- `npm run db:studio` - Interface Prisma Studio

## Prochaines étapes

- [ ] Intégration complète avec Payload CMS auth
- [ ] Gestion des sessions utilisateur
- [ ] Notifications par email
- [ ] Système de paiement pour les tournois payants
- [ ] Chat en temps réel pour les équipes
- [ ] Statistiques et analytics
- [ ] API GraphQL avec Payload CMS
- [ ] Tests unitaires et d'intégration

## Support

Pour toute question ou problème, créer une issue sur GitHub.