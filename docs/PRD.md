# docs/PRD.md — BailPro
## Product Requirements Document

> Version : 1.0 — Scope : MVP (v1)
> Statut : validé

---

## 1. Contexte & problème

L'immobilier locatif privé à Abidjan est dominé par des bailleurs individuels possédant 3 à 30 logements et des petites agences gérant 50 à 200 lots. La gestion se fait sur Excel ou cahier : les retards de loyer sont fréquents, les quittances sont émises à la main, le suivi des impayés est opaque.

**BailPro digitalise cette gestion** : suivi des locataires, des paiements, génération automatique des quittances PDF, et tableau de bord en temps réel pour les bailleurs.

---

## 2. Personas

### M. Salloum — Bailleur privé (Admin Tenant)
- Possède 8 appartements en Riviera, Abidjan
- Gère tout seul, sans comptable
- Besoin : voir d'un coup d'œil qui a payé, générer les quittances, suivre les impayés

### Mme Konan — Gérante d'agence (Admin Tenant Agence)
- Gère 80 lots pour 25 propriétaires via l'Agence Cocody Immo
- Besoin : gérer plusieurs propriétaires dans une même org, déléguer à des gestionnaires

### Karim — Locataire
- Locataire d'un appartement géré par BailPro
- Besoin : voir son loyer dû, payer, télécharger sa quittance, signaler un problème

---

## 3. Périmètre v1

### Inclus
- Gestion des organisations (multi-tenant)
- Gestion des utilisateurs avec rôles : `admin`, `gestionnaire`, `locataire`
- Gestion des logements (Properties)
- Gestion des baux (Leases)
- Suivi des paiements mensuels (RentPayments)
- Génération de quittances PDF (Receipts)
- Demandes de maintenance (MaintenanceRequests)
- Tableau de bord bailleur
- Portail locataire
- Paiement Mobile Money **mocké** (bouton simulé)
- Authentification JWT + cookies httpOnly

### Hors scope v1
- Génération automatique des contrats de bail PDF
- Signature électronique
- Intégration cadastre
- Comptabilité fiscale automatique
- Gestion eau/électricité incluse
- Locations meublées courte durée
- Intégration réelle Orange Money / Wave / MTN

---

## 4. Entités & schéma de données

### organizations
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | Identifiant unique |
| name | VARCHAR(255) | Nom de l'org |
| slug | VARCHAR(100) UNIQUE | Identifiant URL-friendly |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### users
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK → organizations | Tenant |
| email | VARCHAR(255) | Unique par org |
| password_hash | VARCHAR(255) | bcrypt cost 12 |
| role | ENUM(admin, gestionnaire, locataire) | |
| full_name | VARCHAR(255) | |
| phone | VARCHAR(30) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### properties
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK → organizations | Tenant |
| address | TEXT | Adresse complète |
| district | VARCHAR(100) | Quartier (Cocody, Marcory…) |
| surface_m2 | DECIMAL(8,2) | Surface en m² |
| rent_amount | DECIMAL(10,2) | Loyer mensuel (FCFA) |
| status | ENUM(available, occupied, maintenance) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### leases
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK → organizations | Tenant |
| property_id | UUID FK → properties | |
| tenant_id | UUID FK → users | Locataire |
| start_date | DATE | Début du bail |
| end_date | DATE | Fin (null = indéterminé) |
| monthly_rent | DECIMAL(10,2) | Loyer contractuel |
| deposit_amount | DECIMAL(10,2) | Caution |
| status | ENUM(active, terminated, pending) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### rent_payments
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK → organizations | Tenant |
| lease_id | UUID FK → leases | |
| amount | DECIMAL(10,2) | Montant payé |
| due_date | DATE | Date d'échéance |
| paid_at | TIMESTAMP | Date de paiement (null = impayé) |
| status | ENUM(pending, paid, late) | |
| payment_method | VARCHAR(50) | ex: mobile_money_mock |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### receipts
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK → organizations | Tenant |
| payment_id | UUID FK → rent_payments | |
| pdf_url | VARCHAR(500) | URL du PDF généré |
| issued_at | TIMESTAMP | Date d'émission |
| created_at | TIMESTAMP | |

### maintenance_requests
| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| org_id | UUID FK → organizations | Tenant |
| property_id | UUID FK → properties | |
| tenant_id | UUID FK → users | Déclarant |
| title | VARCHAR(255) | |
| description | TEXT | |
| priority | ENUM(low, medium, high, urgent) | |
| status | ENUM(open, in_progress, resolved, closed) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 5. Endpoints API

### Auth
| Méthode | Route | Description |
|---|---|---|
| POST | /api/v1/auth/register | Créer un compte (org + admin) |
| POST | /api/v1/auth/login | Connexion → cookie JWT |
| POST | /api/v1/auth/logout | Effacer le cookie |
| GET | /api/v1/auth/me | Profil de l'utilisateur connecté |

### Properties
| Méthode | Route | Description |
|---|---|---|
| GET | /api/v1/properties | Lister les logements de l'org |
| POST | /api/v1/properties | Ajouter un logement |
| GET | /api/v1/properties/:id | Détail d'un logement |
| PATCH | /api/v1/properties/:id | Modifier un logement |
| DELETE | /api/v1/properties/:id | Supprimer un logement |

### Leases
| Méthode | Route | Description |
|---|---|---|
| GET | /api/v1/leases | Lister les baux de l'org |
| POST | /api/v1/leases | Créer un bail |
| GET | /api/v1/leases/:id | Détail d'un bail |
| PATCH | /api/v1/leases/:id | Modifier un bail |
| GET | /api/v1/leases/:id/payments | Historique des paiements du bail |

### Payments
| Méthode | Route | Description |
|---|---|---|
| POST | /api/v1/payments | Enregistrer un paiement (mock) |
| GET | /api/v1/payments/:id | Détail d'un paiement |

### Receipts
| Méthode | Route | Description |
|---|---|---|
| POST | /api/v1/receipts/generate | Générer une quittance PDF |
| GET | /api/v1/receipts/:id | Télécharger une quittance |

### Maintenance
| Méthode | Route | Description |
|---|---|---|
| GET | /api/v1/maintenance-requests | Lister les demandes de l'org |
| POST | /api/v1/maintenance-requests | Créer une demande |
| PATCH | /api/v1/maintenance-requests/:id | Mettre à jour le statut |

### Dashboard
| Méthode | Route | Description |
|---|---|---|
| GET | /api/v1/dashboard/overview | KPIs : occupation, impayés, prévisionnel |

### Système
| Méthode | Route | Description |
|---|---|---|
| GET | /healthz | Health check (sans auth) |
| POST | /api/test/reset-db | Reset DB (test_e2e uniquement) |

---

## 6. Composants UI principaux

| Composant | Rôle |
|---|---|
| `LandlordDashboard` | Vue principale bailleur : KPIs, alertes impayés |
| `PropertyManager` | CRUD des logements |
| `LeaseEditor` | Création / modification des baux |
| `RentCalendar` | Vue mensuelle des paiements dus / reçus |
| `ReceiptGenerator` | Déclenchement manuel ou auto de la quittance PDF |
| `TenantPortal` | Interface locataire : loyer dû, historique, signalement |
| `MaintenanceBoard` | Kanban des demandes de maintenance |

---

## 7. Rôles & permissions

| Action | admin | gestionnaire | locataire |
|---|---|---|---|
| Gérer les logements | ✓ | ✓ | ✗ |
| Créer / modifier un bail | ✓ | ✓ | ✗ |
| Voir tous les paiements de l'org | ✓ | ✓ | ✗ |
| Payer son loyer | ✗ | ✗ | ✓ |
| Voir ses propres paiements | ✗ | ✗ | ✓ |
| Générer une quittance | ✓ | ✓ | ✗ |
| Télécharger sa quittance | ✗ | ✗ | ✓ |
| Créer une demande maintenance | ✓ | ✓ | ✓ |
| Gérer les demandes maintenance | ✓ | ✓ | ✗ |
| Voir le dashboard | ✓ | ✓ | ✗ |

---

## 8. Critères d'acceptation (MVP)

- [ ] Un bailleur peut s'inscrire, créer une org, et se connecter
- [ ] Un bailleur peut ajouter un logement et y associer un bail avec un locataire
- [ ] Le locataire peut se connecter à son portail et voir son loyer dû
- [ ] Le locataire peut effectuer un paiement mocké et recevoir une quittance PDF
- [ ] Le bailleur voit son tableau de bord avec les KPIs en temps réel
- [ ] Un locataire de l'org A ne peut pas accéder aux données de l'org B (test d'isolation)
- [ ] Toutes les routes d'auth sont rate-limitées
- [ ] L'app est accessible via HTTPS sur le domaine de démo

---

*BailPro — PRD v1.0*
