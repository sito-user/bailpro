# CLAUDE.md — BailPro

> Ce fichier gouverne tout le développement de BailPro.
> Chaque règle est une décision prise en amont pour éviter les erreurs en production.
> Ne jamais déroger sans mettre à jour ce fichier et documenter la raison.

---

## 1. Identité du projet

- **Nom** : BailPro
- **Pitch** : SaaS de gestion locative pour bailleurs privés et petites agences immobilières d'Abidjan.
- **Domaine** : `bailpro.votredomaine.com` (à configurer au moment du déploiement)
- **Repo GitHub** : public, README complet, captures d'écran, lien démo
- **Stack** : Node.js 20 + Express + Knex + PostgreSQL 16 + React 18 + Vite
- **Langue du code** : anglais (variables, fonctions, commentaires)
- **Langue de l'UI** : français (Côte d'Ivoire)

---

## 2. Architecture multi-tenant

- **Règle 1** — Chaque organisation (`org_id`) est un tenant isolé. Toute requête base de données sur une entité métier (`properties`, `leases`, `payments`, `receipts`, `maintenance_requests`) doit inclure un filtre `WHERE org_id = ?`.
- **Règle 2** — Le middleware `requireOrg` injecte `req.orgId` sur chaque route protégée. Ne jamais lire `org_id` depuis le body ou les query params — uniquement depuis `req.orgId`.
- **Règle 3** — Les tests d'isolation cross-tenant sont obligatoires : un utilisateur de l'org A ne doit jamais pouvoir lire, modifier ou supprimer les données de l'org B, même avec un ID valide.
- **Règle 4** — Le schéma de base de données utilise des UUIDs (pas des entiers auto-incrémentés) pour toutes les clés primaires, afin d'éviter l'énumération.

---

## 3. Authentification & sécurité

- **Règle 5** — JWT stocké exclusivement dans un cookie `httpOnly`, `Secure` (en production), `SameSite=none` (cross-domain) ou `SameSite=lax` (même domaine / développement).
- **Règle 6** — Les mots de passe sont hachés avec `bcrypt` au cost factor **12**. Jamais de MD5, SHA1, ou stockage en clair.
- **Règle 7** — Rate limiting sur toutes les routes d'authentification : **5 tentatives / 15 minutes par IP** via `express-rate-limit`.
- **Règle 8** — Toutes les entrées API sont validées avec **Joi** avant tout traitement. Une validation manquante est un bug.
- **Règle 9** — `helmet()` est appliqué globalement pour les headers HTTP sécurisés.
- **Règle 10** — CORS configuré avec une liste blanche explicite via la variable `CORS_ORIGIN`. Jamais `origin: '*'` en production.
- **Règle 11** — Jamais de secret dans le code source. Tout secret passe par les variables d'environnement. Un fichier `.env.example` documente les variables requises.

---

## 4. Structure du projet

```
bailpro/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env.js
│   │   ├── middleware/      # auth.js, requireOrg.js, errorHandler.js
│   │   ├── routes/          # properties.js, leases.js, payments.js, ...
│   │   ├── services/        # receiptService.js, paymentService.js, ...
│   │   ├── validators/      # schemas Joi par domaine
│   │   └── server.js
│   ├── migrations/
│   ├── seeds/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/     # Jest + Supertest
│   │   └── e2e/             # Playwright
│   └── knexfile.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/             # client Axios centralisé
│   │   └── main.jsx
│   └── vite.config.js
├── docs/
│   ├── PRD.md
│   └── PLAN.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docker-compose.yml       # dev local
├── Dockerfile               # backend multi-stage
├── nginx.conf
├── CLAUDE.md
└── README.md
```

- **Règle 12** — La logique métier vit dans `services/`, pas dans les routes. Les routes ne font que valider, appeler le service, et renvoyer la réponse.
- **Règle 13** — Le client API frontend est centralisé dans `frontend/src/api/`. Pas d'appels `fetch` ou `axios` directs dans les composants.

---

## 5. Base de données

- **Règle 14** — Toutes les modifications de schéma passent par une migration Knex. Jamais d'`ALTER TABLE` manuel en production.
- **Règle 15** — Les migrations sont irréversibles en production. Toujours écrire `exports.up` ET `exports.down`.
- **Règle 16** — Les seeds sont réservés au développement et aux tests. La commande `knex seed:run` ne tourne jamais en production.
- **Règle 17** — Toutes les tables métier ont les colonnes `created_at` et `updated_at` (timestamps automatiques via Knex).
- **Règle 18** — Les foreign keys sont déclarées avec `onDelete('CASCADE')` ou `onDelete('RESTRICT')` explicitement — jamais de comportement implicite.

---

## 6. Tests

- **Règle 19** — Couverture minimale **70%** sur les fichiers du dossier `services/` et `routes/`. La CI refuse un merge en dessous de ce seuil.
- **Règle 20** — Chaque endpoint critique a un test d'isolation : créer une ressource avec le token de l'org A, tenter d'y accéder avec le token de l'org B → attendre 403 ou 404.
- **Règle 21** — Les tests d'intégration utilisent une base de données dédiée `bailpro_test`. Elle est réinitialisée avant chaque suite via `beforeAll` / `afterAll`.
- **Règle 22** — Les tests E2E Playwright couvrent les parcours critiques : inscription, connexion, ajout d'un logement, création d'un bail, paiement mocké, téléchargement de quittance.
- **Règle 23** — L'endpoint `POST /api/test/reset-db` n'existe que si `NODE_ENV === 'test_e2e'`. Il est absent du bundle de production.

---

## 7. API

- **Règle 24** — Toutes les routes API sont préfixées par `/api/v1/`.
- **Règle 25** — Les réponses d'erreur suivent un format uniforme :
  ```json
  { "error": "MESSAGE_CODE", "message": "Description lisible" }
  ```
- **Règle 26** — Les listes paginées renvoient toujours :
  ```json
  { "data": [...], "total": 42, "page": 1, "limit": 20 }
  ```
- **Règle 27** — L'endpoint `GET /healthz` répond `{ "status": "ok", "timestamp": "..." }` sans authentification. Il est utilisé par Docker et nginx pour les health checks.

---

## 8. Frontend

- **Règle 28** — Le proxy `/api` dans `vite.config.js` est conditionnel au mode `development`. Il n'est pas inclus dans le build de production.
- **Règle 29** — `VITE_API_URL` doit être défini comme variable d'environnement **au moment du build**. Un build sans cette variable échoue explicitement.
- **Règle 30** — Chaque appel API a trois états gérés dans l'UI : `loading`, `success`, `error`. Pas d'état indéfini visible par l'utilisateur.
- **Règle 31** — Le fichier `public/_redirects` contient `/* /index.html 200` pour le routing SPA (si hébergement statique séparé).

---

## 9. Déploiement

- **Règle 32** — Dockerfile multi-stage : stage `builder` (compilation) + stage `runtime` (image alpine allégée). L'image finale ne contient pas les devDependencies.
- **Règle 33** — Le conteneur backend tourne sous l'utilisateur non-root `node` (`USER node` dans le Dockerfile).
- **Règle 34** — nginx est le point d'entrée unique : il sert le frontend statique et proxifie `/api` vers le backend Express.
- **Règle 35** — HTTPS est obligatoire en production via Let's Encrypt + Certbot. Toute requête HTTP est redirigée vers HTTPS.
- **Règle 36** — Les variables d'environnement de production ne sont jamais dans le repo. Elles sont injectées au runtime via le VPS ou les secrets GitHub Actions.

---

## 10. Observabilité

- **Règle 37** — Logger structuré JSON avec **Pino** (`pino-http` pour Express). Pas de `console.log` en production.
- **Règle 38** — Chaque requête reçoit un `correlation-id` (UUID) injecté par middleware et loggé avec chaque entrée.
- **Règle 39** — Les erreurs non gérées sont capturées par l'error handler global et loggées avec le stack trace complet.

---

## 11. Workflow Git

- **Règle 40** — Branches : `main` (production), `develop` (intégration), `feature/nom-feature`, `fix/nom-bug`.
- **Règle 41** — Chaque push sur `main` et `develop` déclenche la CI (tests automatiques).
- **Règle 42** — Le fichier `.env` est dans `.gitignore`. Committer un `.env` est une erreur critique.
- **Règle 43** — Les messages de commit suivent le format Conventional Commits : `feat:`, `fix:`, `chore:`, `test:`, `docs:`.

---

## 12. Commandes clés

```bash
# Développement local
docker-compose up -d          # PostgreSQL + pgAdmin en local
cd backend && npm run dev     # Express avec nodemon
cd frontend && npm run dev    # Vite dev server

# Base de données
npx knex migrate:latest       # Appliquer les migrations
npx knex migrate:rollback     # Annuler la dernière migration
npx knex seed:run             # Injecter les seeds

# Tests
npm test                      # Jest + Supertest
npm run test:coverage         # Rapport de couverture
npm run test:e2e              # Playwright

# Production
docker build -t bailpro-api . # Build de l'image Docker
docker-compose -f docker-compose.prod.yml up -d
```

---

*Dernière mise à jour : initialisation du projet BailPro*
