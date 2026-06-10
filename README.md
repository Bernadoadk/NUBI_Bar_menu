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


