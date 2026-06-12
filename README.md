# NUBI Bar Menu

Carte digitale pour NUBI Bar avec back-office admin.

## Stack

- **Frontend** : HTML, JavaScript, Tailwind CSS, Vite

- **Backend** : Express.js (serverless sur Vercel)

- **Base de données** : PostgreSQL + Prisma

- **Auth admin** : JWT

- **Hébergement** : Vercel

## Démarrage local

### 1. Prérequis

- Node.js 18+

- PostgreSQL installé et en cours d'exécution

### 2. Configuration

```bash

cp .env.example .env

```

Renseignez `DATABASE_URL` et `JWT_SECRET` dans `.env`.

### 3. Installation

```bash

npm install

npx prisma migrate deploy

npm run db:seed

```

### 4. Lancement

```bash

npm run dev

```

- Menu public : http://localhost:5173

- Admin : http://localhost:5173/admin

- API : http://localhost:3001/api

Identifiants admin par défaut (après seed) :

- Email : `admin@nubi.bar`

- Mot de passe : `admin123`

## Scripts utiles

| Commande | Description |

|----------|-------------|

| `npm run dev` | Frontend + API en développement |

| `npm run build` | Build du frontend |

| `npm run vercel-build` | Build complet pour Vercel (Prisma + migrations + Vite) |

| `npm start` | Serveur de production local |

| `npm run db:migrate` | Créer/appliquer une migration |

| `npm run db:seed` | Réinitialiser les données du menu |

| `npm run db:studio` | Interface Prisma Studio |

## Déploiement sur Vercel

### 1. Prérequis

- Compte [Vercel](https://vercel.com)

- Base PostgreSQL accessible (recommandé : [Neon](https://neon.tech), Vercel Postgres, ou Supabase)

> **Important** : utilisez une URL de connexion **avec pooler** pour les fonctions serverless Vercel.

### 2. Variables d'environnement (Vercel Dashboard)

| Variable | Description |

|----------|-------------|

| `DATABASE_URL` | URL PostgreSQL (avec pooler en production) |

| `JWT_SECRET` | Clé secrète JWT (longue chaîne aléatoire) |

| `ADMIN_EMAIL` | Email admin (pour le seed) |

| `ADMIN_PASSWORD` | Mot de passe admin (pour le seed) |

### 3. Déployer

```bash

npm i -g vercel

vercel

```

Ou connectez le dépôt GitHub à Vercel — le fichier `vercel.json` configure automatiquement :

- le build du frontend (`dist/`)

- l'API serverless (`api/index.js` → routes `/api/*`)

- la route `/admin` vers `admin.html`

### 4. Peupler la base (premier déploiement)

Après le premier déploiement, exécutez le seed une fois en local avec l'URL de prod :

```bash
vercel env pull .env.production
# Copiez DATABASE_URL de .env.production dans .env, puis :
npm run db:seed
```

### Architecture Vercel

```

vercel.app/

├── /              → index.html (menu public)

├── /admin         → admin.html (back-office)

└── /api/*         → api/index.js (Express serverless)

```

Bonjour Monsieur,

J’espère que vous allez bien.

Je voulais vous donner quelques nouvelles et m’excuser pour mon absence ces derniers temps.

Au départ, j’avais une petite infection qui s’est malheureusement aggravée et qui m’a beaucoup dérangé ces dernières semaines. J’ai finalement pu faire les soins nécessaires et aujourd’hui ça va un peu mieux, même si je récupère encore progressivement.

Au-delà de la santé, je préfère être honnête avec vous : la situation financière est toujours très compliquée de mon côté. Comme vous le savez déjà, je traverse une période assez difficile. Jusqu’à récemment, j’utilisais la connexion Internet de mon voisin pour travailler, mais celle-ci ne fonctionne plus. Aujourd’hui, lorsque j’arrive à trouver un peu d’argent, j’achète ponctuellement de la connexion pour pouvoir me connecter et avancer, mais ce n’est pas quelque chose que je peux faire régulièrement.

C’est principalement cette situation qui m’a empêché d’être présent et productif comme je l’aurais voulu.

Concernant les projets, les vidéos ne sont pas encore terminées. J’en ai réalisé une partie, mais il reste encore beaucoup de travail : les tutoriels sur les paramètres, les différentes fonctionnalités, ainsi que les sous-titres. Sans connexion stable, tout cela devient vraiment compliqué à produire correctement.

Par contre, j’ai pu corriger les problèmes qui affectaient Ledger, Badge et Quote. Suite à certaines mises à jour de Shopify, plusieurs webhooks et requêtes GraphQL avaient été révoqués ou modifiés, ce qui provoquait des erreurs. J’ai effectué les corrections nécessaires et remplacé les anciennes implémentations par les nouvelles. De ce côté-là, tout est revenu à la normale.

Sincèrement, je suis conscient que vous avez besoin d’aide sur les projets Shopify et j’aurais aimé pouvoir être plus présent. Malheureusement, entre les soucis de santé et surtout les difficultés financières actuelles, je ne sais pas si je vais être en mesure d’assurer correctement dans les conditions actuelles. J’ai même peur de finir par vous ralentir davantage qu’autre chose, notamment à cause du problème de connexion qui reste aujourd’hui mon principal blocage.

Je préférais être totalement transparent avec vous sur ma situation plutôt que de rester silencieux.
