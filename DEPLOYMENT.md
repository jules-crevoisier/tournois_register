# Guide de Déploiement Vercel

Ce guide vous accompagne pour déployer votre plateforme de tournois sur Vercel.

## Prérequis

- Un compte [Vercel](https://vercel.com)
- Un compte [GitHub](https://github.com) (recommandé pour déploiement automatique)
- [Vercel CLI](https://vercel.com/docs/cli) installé (optionnel mais recommandé)

```bash
npm install -g vercel
```

## Étape 1: Préparer le Repository

### 1.1 Vérifier les fichiers de configuration

Assurez-vous que ces fichiers sont présents et correctement configurés:

- ✅ `vercel.json` - Configuration Vercel
- ✅ `.env.example` - Template des variables d'environnement
- ✅ `.gitignore` - Doit inclure `.env` et `.env.local`

### 1.2 Commit et Push sur GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Étape 2: Créer le Projet Vercel

### Option A: Via le Dashboard Vercel (Recommandé)

1. Connectez-vous à [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Sélectionnez votre repository GitHub
4. Configurez le projet:
   - **Framework Preset**: Next.js (détecté automatiquement)
   - **Build Command**: `npm run build` (détecté automatiquement)
   - **Output Directory**: `.next` (détecté automatiquement)
   - **Install Command**: `npm install` (détecté automatiquement)

### Option B: Via Vercel CLI

```bash
cd tournois_register
vercel
# Suivez les instructions interactives
```

## Étape 3: Configurer la Base de Données

### 3.1 Créer Vercel Postgres

1. Dans votre projet Vercel, allez dans **Storage**
2. Cliquez sur **"Create Database"**
3. Sélectionnez **"Postgres"**
4. Nommez votre base de données (ex: `tournament-db`)
5. Sélectionnez votre région (recommandé: proche de vos utilisateurs)
6. Cliquez sur **"Create"**

### 3.2 Connecter la Database au Projet

1. La variable `DATABASE_URL` sera automatiquement ajoutée à votre projet
2. Vérifiez dans **Settings → Environment Variables**

Si vous devez l'ajouter manuellement:
```
DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
```

## Étape 4: Configurer les Variables d'Environnement

Allez dans **Settings → Environment Variables** et ajoutez:

### Variables Requises

| Variable | Type | Environnement | Description |
|----------|------|---------------|-------------|
| `DATABASE_URL` | Plain Text | Production, Preview, Development | Connection string PostgreSQL (auto-populé si Vercel Postgres) |
| `PAYLOAD_SECRET` | Secret | Production, Preview, Development | Clé secrète pour Payload CMS (min 32 caractères) |
| `NEXT_PUBLIC_SERVER_URL` | Plain Text | Production | URL de production (ex: `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_SERVER_URL` | Plain Text | Preview | `https://${VERCEL_URL}` |
| `BLOB_READ_WRITE_TOKEN` | Secret | Production, Preview | Token Vercel Blob (optionnel) |

### Générer PAYLOAD_SECRET

```bash
# Sur macOS/Linux
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Configuration NEXT_PUBLIC_SERVER_URL

**Pour Production:**
```
NEXT_PUBLIC_SERVER_URL=https://your-app.vercel.app
```

**Pour Preview (utilise l'URL dynamique):**
```
NEXT_PUBLIC_SERVER_URL=https://${VERCEL_URL}
```

## Étape 5: Configurer Vercel Blob (Optionnel)

Si vous voulez uploader des images de tournois:

1. Dans votre projet, allez dans **Storage**
2. Cliquez sur **"Create Database"** → **"Blob"**
3. Nommez votre blob store (ex: `tournament-images`)
4. Le token `BLOB_READ_WRITE_TOKEN` sera automatiquement ajouté

## Étape 6: Déployer

### 6.1 Premier Déploiement

Si vous avez connecté GitHub:
```bash
git push origin main
# Vercel déploie automatiquement
```

Ou via CLI:
```bash
vercel --prod
```

### 6.2 Vérifier le Déploiement

1. Attendez que le build se termine (généralement 2-3 minutes)
2. Cliquez sur **"Visit"** pour voir votre site
3. Vous devriez voir la page d'accueil (vide au début)

## Étape 7: Initialiser la Base de Données

### 7.1 Appliquer le Schéma Prisma

**Option A: Via Vercel CLI (Recommandé)**

```bash
# 1. Télécharger les variables d'environnement de production
vercel env pull .env.production.local

# 2. Appliquer le schéma à la base de données
npx prisma db push

# 3. (Optionnel) Ouvrir Prisma Studio pour inspecter
npx prisma studio
```

**Option B: Connexion Directe**

1. Copiez la `DATABASE_URL` depuis Vercel Dashboard
2. Utilisez-la directement:

```bash
DATABASE_URL="votre-url-postgres-vercel" npx prisma db push
```

### 7.2 Vérifier les Tables

```bash
# Se connecter à la base via Vercel CLI
vercel env pull
npx prisma studio

# Ou directement via psql
psql "votre-DATABASE_URL"
\dt  # Liste les tables
```

Vous devriez voir:
- `users`
- `tournaments`
- `teams`

## Étape 8: Créer le Premier Utilisateur Admin

1. Visitez `https://your-app.vercel.app/admin`
2. Créez votre premier compte administrateur:
   - Email: votre email
   - Mot de passe: choisissez un mot de passe fort
   - Role: Admin (par défaut)

## Étape 9: Créer votre Premier Tournoi

1. Connectez-vous à l'admin: `/admin`
2. Allez dans **Tournaments**
3. Cliquez sur **"Create New"**
4. Remplissez les informations:
   - Title: "Mon Premier Tournoi"
   - Game: "League of Legends"
   - Players per Team: 5
   - Max Teams: 16
   - Status: **OPEN** (important!)
   - Dates: choisissez des dates futures
5. Cliquez sur **"Save"**

## Étape 10: Tester l'Application

### Frontend (Utilisateurs)
1. Visitez la page d'accueil: `https://your-app.vercel.app`
2. Vous devriez voir votre tournoi
3. Cliquez sur **"Voir les détails"**
4. Cliquez sur **"S'inscrire au tournoi"**
5. Remplissez le formulaire d'équipe
6. Soumettez → vous devriez être redirigé avec votre équipe affichée

### Admin (Administrateurs)
1. Visitez `/admin`
2. Allez dans **Teams** pour voir les inscriptions
3. Changez le statut de **Pending** à **Confirmed**
4. L'équipe apparaîtra confirmée sur le frontend

## Déploiements Futurs

### Déploiement Automatique (GitHub)

```bash
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main
# Vercel déploie automatiquement
```

### Déploiement Manuel

```bash
vercel --prod
```

### Preview Deployments

Chaque Pull Request GitHub crée automatiquement un déploiement de preview:
- URL unique pour tester les changements
- Variables d'environnement "Preview"
- Base de données partagée (attention!)

## Dépannage

### Erreur: "Failed to connect to database"

**Solution:**
- Vérifiez que `DATABASE_URL` est bien défini dans Vercel
- Assurez-vous que la connexion inclut `?sslmode=require`
- Testez la connexion localement: `npx prisma db pull`

### Erreur: "Payload secret not defined"

**Solution:**
- Générez un nouveau secret: `openssl rand -base64 32`
- Ajoutez-le dans Environment Variables
- Redéployez: `vercel --prod`

### Erreur: "Build failed - Prisma client not generated"

**Solution:**
- Le build command dans `vercel.json` devrait être: `npm run build`
- Dans `package.json`, le script build devrait inclure: `prisma generate && next build --turbopack`

### Les images ne s'affichent pas

**Solution:**
- Vérifiez que `BLOB_READ_WRITE_TOKEN` est configuré
- Ou utilisez une URL externe pour les images
- Ou configurez Next.js Image domains dans `next.config.ts`

### Erreur 500 sur les routes API

**Solution:**
- Consultez les logs: Vercel Dashboard → Deployment → Functions
- Vérifiez que les tables existent: `npx prisma db push`
- Testez en local avec les variables de production

### Prisma "No engine found"

**Solution:**
En production, ajoutez à votre build:
```json
// package.json
"scripts": {
  "build": "prisma generate --no-engine && next build"
}
```

## Monitoring et Logs

### Voir les Logs en Temps Réel

```bash
vercel logs --follow
```

### Logs dans le Dashboard

1. Ouvrez votre projet Vercel
2. Allez dans **Deployments**
3. Cliquez sur un déploiement
4. Onglet **"Functions"** pour les logs API
5. Onglet **"Build Logs"** pour les logs de build

## Optimisations Production

### 1. Edge Functions (Optionnel)

Ajoutez à vos routes API:
```typescript
export const runtime = 'edge'
```

### 2. Caching

Configurez le caching Next.js:
```typescript
export const revalidate = 60 // Revalider toutes les 60 secondes
```

### 3. Analytics

Activez Vercel Analytics:
```bash
npm install @vercel/analytics
```

### 4. Monitoring d'Erreurs

Intégrez Sentry ou similaire:
```bash
npm install @sentry/nextjs
```

## Sécurité

### Checklist Avant Production

- [ ] Variables d'environnement définies pour tous les environnements
- [ ] `PAYLOAD_SECRET` fort (min 32 caractères)
- [ ] Base de données PostgreSQL avec SSL activé
- [ ] CORS configuré si nécessaire
- [ ] Rate limiting configuré pour les API routes
- [ ] Backups automatiques de la base de données activés (Vercel Postgres)
- [ ] Domaine personnalisé configuré avec HTTPS (Vercel le fait automatiquement)

## Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

## Support

En cas de problème:
1. Consultez les logs Vercel
2. Vérifiez les variables d'environnement
3. Testez en local avec les mêmes variables
4. Consultez le README.md du projet
5. Ouvrez une issue sur GitHub
