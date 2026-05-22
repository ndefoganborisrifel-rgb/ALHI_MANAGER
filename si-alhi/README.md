# SI-ALHI — Système d'Information Africa Leadership Higher Institute

Application web de gestion scolaire complète pour l'**Africa Leadership Higher Institute (ALHI)** à Yaoundé, Cameroun.

## Fonctionnalités

### 8 Modules Métier

| Module | Description |
|--------|-------------|
| **SI-Admission** | Pipeline de candidatures (Prospect → Actif), génération automatique des matricules |
| **SI-Scolarité** | Paiements en FCFA, reçus PDF bilingues, taux de recouvrement |
| **SI-Pédagogie** | Emploi du temps avec détection de collisions et gestion des salles |
| **SI-Examens** | Notes CC1/CC2/Examen, bulletins PDF, PV de délibération |
| **SI-Discipline** | Émargement numérique, suivi des absences, alertes |
| **SI-Logistique** | Inventaire du patrimoine, alertes de maintenance |
| **SI-Stage** | Suivi des conventions et soutenances |
| **SI-RH** | Gestion des vacataires, calcul automatique des heures |

### 5 Rôles Utilisateur

- **ADMIN** — Accès complet (Directrice)
- **SCOLARITE** — Paiements, admissions, emploi du temps
- **ENSEIGNANT** — Saisie notes, émargement, ses cours
- **ETUDIANT** — Consultation : notes, bulletin, paiements, emploi du temps
- **PARENT** — Vue lecture seule des informations de l'enfant

## Stack Technique

- **Frontend** : Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend** : Next.js API Routes
- **ORM** : Prisma 7 + SQLite (dev) / PostgreSQL (prod)
- **Auth** : NextAuth.js v5 (JWT, 5 rôles)
- **PDF** : @react-pdf/renderer
- **Validation** : Zod

## Installation locale

### Prérequis
- Node.js 20+ (`node -v`)
- pnpm (`npm install -g pnpm`)
- Git

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/ndefoganborisrifel-rgb/alhi_manager
cd alhi_manager/si-alhi

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs

# 4. Créer la base de données
pnpm prisma migrate dev

# 5. Peupler avec les données de test
npx tsx prisma/seed.ts

# 6. Lancer le serveur
pnpm dev
```

Ouvrez http://localhost:3000

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | directrice@africaleadershipinstitute.com | Admin@2025 |
| Scolarité | scolarite@africaleadershipinstitute.com | Scolarite@2025 |
| Enseignant | obiang@africaleadershipinstitute.com | Enseignant@2025 |
| Étudiant (Boris) | boris.rifel.nde.fogan@etu.africaleadershipinstitute.com | Etudiant@2025 |
| Parent | parent.ndefogan@gmail.com | Parent@2025 |

## Déploiement en production (Vercel + Supabase)

### 1. Base de données (Supabase — gratuit)
1. Créer un compte sur [supabase.com](https://supabase.com)
2. Nouveau projet → copier l'URL de connexion
3. Mettre à jour `DATABASE_URL` dans `.env`

### 2. Déploiement (Vercel — gratuit)
```bash
npm install -g vercel
vercel login
vercel --prod
```

Variables d'environnement à configurer sur Vercel :
- `DATABASE_URL` — URL PostgreSQL de Supabase
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — URL de votre application Vercel

### 3. Migration en production
```bash
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

## Matricule format

`ALI/{CODE_FILIÈRE}{NUMÉRO}/{ANNÉE}` — Ex: `ALI/ING006/25`

Codes filières : ING, CS, BS, LP-IT, LP-GES

## Contacts ALHI

- Château Ngoa Ekélé, Yaoundé, Cameroun
- +237 657 75 54 87 / +237 676 25 85 13
- info@africaleadershipinstitute.com

---

*Projet d'examen VBA Excel — Semestre 1, Année Académique 2025/2026*
*Étudiant : Boris NDE FOGAN (Bobo) — Prépa Ingénierie Niveau 1*
