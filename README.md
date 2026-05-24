# BailPro — Gestion Locative Simplifiée pour Abidjan

> SaaS de gestion locative pour bailleurs privés et petites agences immobilières d'Abidjan, Côte d'Ivoire.

🔗 **[Voir la démo en ligne](https://bailpro-frontend.onrender.com)**

---

## 📋 À propos

BailPro est une application web complète qui remplace le cahier et Excel des bailleurs d'Abidjan par une plateforme numérique moderne. Elle permet de gérer les logements, suivre les paiements en temps réel, envoyer des rappels automatiques et générer des quittances instantanément.

### Problèmes résolus

- **Chaos de la gestion sur cahier/Excel** → tout centralisé en un seul endroit
- **Impayés non suivis** → alertes automatiques et rappels par email
- **Quittances manuelles** → générées automatiquement après chaque paiement

---

## ✨ Fonctionnalités

### Espace Bailleur
- 📊 Tableau de bord avec KPIs (revenus, taux d'occupation, impayés)
- 🏠 Gestion des logements (appartement, villa, magasin, bureau, entrepôt)
- 📄 Gestion des baux et locataires
- 💳 Paiements simulés (Wave, Orange Money, MTN, Cash, Carte bancaire)
- 📅 Calendrier des paiements mensuel
- 🔔 Notifications en temps réel (loyers en retard, demandes de maintenance)
- 🤖 Agent IA Claude — posez des questions sur votre parc locatif
- 📧 Emails automatiques (bienvenue, rappels de loyer, rapport mensuel)
- 🔧 Suivi des demandes de maintenance
- 👤 Profil complet de chaque locataire

### Espace Locataire
- 🏠 Tableau de bord personnel (loyer du mois, statut)
- 💳 Paiement du loyer via Mobile Money
- 📄 Historique des paiements et quittances imprimables
- 🔧 Signalement de demandes de maintenance

### Technique
- 🔐 Authentification sécurisée (email ou numéro de téléphone)
- 👥 Rôles distincts (bailleur vs locataire)
- 📱 PWA — installable sur Android et iOS
- 🔒 Architecture multi-tenant (isolation des données par organisation)

---

## 🚀 Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18, Vite, React Router |
| **Backend** | Node.js 20, Express, Knex |
| **Base de données** | PostgreSQL 16 |
| **Auth** | JWT (cookies httpOnly + Bearer token) |
| **Email** | Nodemailer + Gmail |
| **IA** | Claude API (Anthropic) |
| **Tests** | Jest, Supertest |
| **Déploiement** | Render (backend + frontend + PostgreSQL) |
| **CI/CD** | GitHub Actions |

---

## 🎯 Comptes de démo

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Bailleur | `bailpro.app.ci@gmail.com` | `Bailleur2026!` |
| Locataire 1 | `aidibiaya2006@gmail.com` | `Locataire2026!` |
| Locataire 2 | `aidibiaya05@gmail.com` | `Locataire2026!` |

---

## 🛠️ Installation locale

### Prérequis
- Node.js 20+
- Docker Desktop

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/sito-user/bailpro.git
cd bailpro

# 2. Lancer PostgreSQL
docker-compose up -d

# 3. Backend
cd backend
cp .env.example .env   # Remplir les variables
npm install
npx knex migrate:latest
npm run dev

# 4. Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

### Variables d'environnement requises

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
CORS_ORIGIN=http://localhost:5173
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📁 Structure du projet

```
bailpro/
├── backend/
│   ├── src/
│   │   ├── routes/        # auth, properties, leases, payments, ai...
│   │   ├── services/      # emailService, reminderService, reportService
│   │   ├── middleware/    # auth, errorHandler
│   │   └── server.js
│   ├── migrations/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard, Properties, TenantPortal...
│   │   ├── components/    # Layout, PaymentModal, NotificationBell
│   │   └── api/           # client Axios centralisé
│   └── public/            # manifest.json, sw.js (PWA)
├── docker-compose.yml
└── CLAUDE.md
```

---

## 🧪 Tests

```bash
cd backend
npm test                  # Jest + Supertest
npm run test:coverage     # Rapport de couverture (>70%)
```

---

## 📱 Installation PWA

1. Ouvrir `https://bailpro-frontend.onrender.com` dans Safari (iOS) ou Chrome (Android)
2. **iOS** : Bouton Partager → "Sur l'écran d'accueil"
3. **Android** : Menu → "Ajouter à l'écran d'accueil"

---

## 👨‍💻 Développé par

Projet de fin de semestre — Académie Ivoirienne des Sciences (USJCI)

---

*BailPro — La gestion locative moderne à Abidjan* 🇨🇮
