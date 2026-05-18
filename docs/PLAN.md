# docs/PLAN.md — BailPro
## Plan de développement — MVP

> Approche : TDD, du backend vers le frontend, déploiement en continu.
> Chaque phase se termine par un checkpoint vérifiable.

---

## Phase 0 — Setup (Jour 1)

### Objectif
Repo GitHub opérationnel, environnement local fonctionnel, CI de base active.

### Tâches
- [ ] Créer le repo GitHub public `bailpro`
- [ ] Initialiser la structure de dossiers (voir CLAUDE.md §4)
- [ ] Copier `CLAUDE.md`, `docs/PRD.md`, `docs/PLAN.md`
- [ ] Initialiser `backend/` : `npm init`, installer les dépendances
  ```
  express knex pg bcryptjs jsonwebtoken
  helmet cors express-rate-limit joi pino pino-http uuid
  ```
- [ ] Installer les devDependencies :
  ```
  jest supertest nodemon dotenv
  @types/jest (optionnel)
  ```
- [ ] Initialiser `frontend/` : `npm create vite@latest` (React)
- [ ] Créer `docker-compose.yml` pour PostgreSQL + pgAdmin en local
- [ ] Créer `.env.example` avec toutes les variables requises
- [ ] Configurer `knexfile.js` (development / test / production)
- [ ] Créer le workflow GitHub Actions `ci.yml`
- [ ] Vérifier : `docker-compose up -d` → PostgreSQL accessible

### Checkpoint 0 ✓
```
git push → GitHub Actions CI → vert (0 test = ok pour l'instant)
docker-compose up -d → postgres:5432 accessible
```

---

## Phase 1 — Base de données & migrations (Jour 1-2)

### Objectif
Schéma complet en base, migrations vérifiées, seeds de dev disponibles.

### Tâches
- [ ] Migration `001_create_organizations`
- [ ] Migration `002_create_users`
- [ ] Migration `003_create_properties`
- [ ] Migration `004_create_leases`
- [ ] Migration `005_create_rent_payments`
- [ ] Migration `006_create_receipts`
- [ ] Migration `007_create_maintenance_requests`
- [ ] Seed `01_organizations` (2 orgs de test)
- [ ] Seed `02_users` (admin + locataire par org)
- [ ] Seed `03_properties` (3 logements par org)
- [ ] Vérifier `migrate:rollback` fonctionne sur chaque migration

### Checkpoint 1 ✓
```
npx knex migrate:latest  → 7 migrations appliquées
npx knex seed:run        → données de test en base
npx knex migrate:rollback --all → schéma vide
npx knex migrate:latest  → re-appliqué proprement
```

---

## Phase 2 — Auth API (TDD) (Jour 2-3)

### Objectif
Endpoints d'authentification testés et fonctionnels.

### Approche TDD
Pour chaque endpoint : écrire le test → voir le test échouer → implémenter → voir le test passer.

### Tâches
- [ ] `POST /api/v1/auth/register`
  - Crée une org + un user admin
  - Valide email, password (min 8 chars), org name
  - Renvoie cookie JWT httpOnly
  - Test : succès, email dupliqué, validation échouée
- [ ] `POST /api/v1/auth/login`
  - Vérifie email + password
  - Rate limit : 5 tentatives / 15 min
  - Test : succès, mauvais mot de passe, compte inexistant, rate limit
- [ ] `POST /api/v1/auth/logout`
  - Efface le cookie
  - Test : cookie effacé, statut 200
- [ ] `GET /api/v1/auth/me`
  - Middleware `requireAuth` : vérifier JWT
  - Test : token valide, token manquant, token expiré
- [ ] Middleware `requireOrg` : injecter `req.orgId`
- [ ] Middleware `requireRole(roles)` : vérifier le rôle

### Checkpoint 2 ✓
```
npm test → auth.test.js → vert
Couverture auth/ ≥ 70%
```

---

## Phase 3 — Properties & Leases API (TDD) (Jour 3-4)

### Objectif
CRUD Properties + CRUD Leases avec isolation multi-tenant.

### Tâches
- [ ] `GET /api/v1/properties` — liste filtrée par org_id
- [ ] `POST /api/v1/properties` — validation Joi
- [ ] `GET /api/v1/properties/:id` — 404 si autre org
- [ ] `PATCH /api/v1/properties/:id`
- [ ] `DELETE /api/v1/properties/:id`
- [ ] Test d'isolation : org A ne voit pas les properties de org B
- [ ] `GET /api/v1/leases`
- [ ] `POST /api/v1/leases` — lie un property + un user locataire
  - Vérifie que property et tenant appartiennent à la même org
  - Met à jour le statut du property → `occupied`
- [ ] `GET /api/v1/leases/:id`
- [ ] `PATCH /api/v1/leases/:id`
- [ ] `GET /api/v1/leases/:id/payments`
- [ ] Test d'isolation cross-tenant sur leases

### Checkpoint 3 ✓
```
npm test → properties.test.js + leases.test.js → vert
Test isolation : 403/404 sur cross-tenant confirmé
```

---

## Phase 4 — Payments & Receipts (Jour 4-5)

### Objectif
Flux de paiement mocké + génération de quittances PDF.

### Tâches
- [ ] `POST /api/v1/payments`
  - Enregistre le paiement (statut `paid`, `paid_at` = now)
  - Met à jour le rent_payment lié
  - Déclenche la génération de quittance
- [ ] Service `receiptService.generatePDF(paymentId)`
  - Utiliser `pdfkit` ou `puppeteer`
  - Contenu : nom locataire, adresse, période, montant, date, nom bailleur
  - Sauvegarder dans `backend/uploads/receipts/`
- [ ] `POST /api/v1/receipts/generate`
- [ ] `GET /api/v1/receipts/:id` — téléchargement du PDF
- [ ] Tests : paiement crée bien une quittance, PDF accessible

### Checkpoint 4 ✓
```
POST /api/v1/payments → statut 201 + quittance générée
GET /api/v1/receipts/:id → PDF téléchargeable
npm test → payments.test.js + receipts.test.js → vert
```

---

## Phase 5 — Maintenance & Dashboard (Jour 5)

### Objectif
Board de maintenance + KPIs tableau de bord.

### Tâches
- [ ] `GET /api/v1/maintenance-requests`
- [ ] `POST /api/v1/maintenance-requests`
- [ ] `PATCH /api/v1/maintenance-requests/:id` (changer le statut)
- [ ] `GET /api/v1/dashboard/overview`
  - `total_properties` : nombre total de logements
  - `occupied_properties` : logements avec bail actif
  - `pending_payments` : loyers impayés du mois courant
  - `monthly_revenue` : total perçu ce mois
  - `open_maintenance` : demandes ouvertes
- [ ] Tests dashboard : KPIs corrects selon les données seeds

### Checkpoint 5 ✓
```
npm test → maintenance.test.js + dashboard.test.js → vert
GET /api/v1/dashboard/overview → JSON avec 5 KPIs
```

---

## Phase 6 — Frontend React (Jour 6-8)

### Objectif
Interface complète, connectée à l'API, responsive.

### Tâches
- [ ] Setup : Axios client centralisé, React Router, contexte auth
- [ ] Pages auth : `/register`, `/login`
- [ ] `LandlordDashboard` — KPIs + alertes impayés
- [ ] `PropertyManager` — liste + formulaire CRUD
- [ ] `LeaseEditor` — création d'un bail (sélection logement + locataire)
- [ ] `RentCalendar` — vue mensuelle des paiements
- [ ] `ReceiptGenerator` — bouton générer + lien téléchargement
- [ ] `TenantPortal` — loyer dû + historique + bouton payer (mock)
- [ ] `MaintenanceBoard` — liste des demandes + formulaire signalement
- [ ] Gestion des états loading / error sur chaque appel API
- [ ] `vite.config.js` : proxy `/api` conditionnel (dev uniquement)
- [ ] `public/_redirects` : `/* /index.html 200`

### Checkpoint 6 ✓
```
npm run dev (frontend) → app accessible sur localhost:5173
Flux complet : register → login → ajouter logement → créer bail → payer → quittance PDF
```

---

## Phase 7 — Tests E2E Playwright (Jour 8-9)

### Objectif
Suite E2E couvrant les parcours critiques.

### Tâches
- [ ] `npx playwright install chromium`
- [ ] Implémenter `POST /api/test/reset-db` (guard `NODE_ENV=test_e2e`)
- [ ] Test : inscription + connexion + déconnexion
- [ ] Test : ajouter un logement
- [ ] Test : créer un bail
- [ ] Test : paiement mocké → quittance générée
- [ ] Test : signalement maintenance
- [ ] Test : isolation (user org A ne voit pas les données org B)

### Checkpoint 7 ✓
```
NODE_ENV=test_e2e npx playwright test → vert
```

---

## Phase 8 — Docker & déploiement VPS (Jour 9-10)

### Objectif
App déployée sur VPS, HTTPS, domaine configuré.

### Tâches
- [ ] `Dockerfile` multi-stage backend (builder + runtime alpine)
- [ ] `nginx.conf` : servir frontend statique + proxy `/api`
- [ ] `docker-compose.prod.yml` : backend + postgres + nginx
- [ ] Créer le VPS sur Hetzner / DigitalOcean (Ubuntu 22.04)
- [ ] Installer Docker + Docker Compose sur le VPS
- [ ] Configurer le nom de domaine → IP du VPS
- [ ] HTTPS avec Let's Encrypt + Certbot
- [ ] Copier les variables d'environnement (`.env` production)
- [ ] Lancer les migrations en production
- [ ] `docker-compose up -d` → app en ligne
- [ ] Ajouter workflow `deploy.yml` : déploiement auto sur push `main`

### Checkpoint 8 ✓
```
https://bailpro.votredomaine.com → app accessible
https://bailpro.votredomaine.com/healthz → { "status": "ok" }
HTTPS valide (certificat Let's Encrypt)
```

---

## Phase 9 — Polish & README (Jour 10)

### Tâches
- [ ] README.md complet : titre, pitch, captures d'écran, instructions install locale, lien démo
- [ ] Audit Lighthouse : Performance ≥ 90, Accessibility ≥ 90, SEO ≥ 90
- [ ] Vérifier couverture de tests ≥ 70% sur services/ et routes/
- [ ] Préparer la démo 10 minutes : script, flux à montrer, slides techniques

### Checkpoint Final ✓
```
Repo GitHub public → README + CLAUDE.md + docs/ → complet
npm test → vert, couverture ≥ 70%
https://bailpro.votredomaine.com → démo live
GitHub Actions CI → vert sur main
```

---

## Récap des dépendances

### Backend
```json
{
  "dependencies": {
    "express": "^4.18",
    "knex": "^3.1",
    "pg": "^8.11",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9.0",
    "helmet": "^7.0",
    "cors": "^2.8",
    "express-rate-limit": "^7.0",
    "joi": "^17.11",
    "pino": "^8.16",
    "pino-http": "^9.0",
    "uuid": "^9.0",
    "pdfkit": "^0.14"
  },
  "devDependencies": {
    "jest": "^29.0",
    "supertest": "^6.3",
    "nodemon": "^3.0",
    "dotenv": "^16.0"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2",
    "react-dom": "^18.2",
    "react-router-dom": "^6.20",
    "axios": "^1.6"
  },
  "devDependencies": {
    "vite": "^5.0",
    "@vitejs/plugin-react": "^4.2"
  }
}
```

---

*BailPro — PLAN v1.0*
