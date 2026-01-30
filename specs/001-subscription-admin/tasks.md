# Tasks: Administration des Abonnements et Codes Promo

**Input**: Design documents from `/specs/001-subscription-admin/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Non demandés - pas de tâches de tests incluses.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Projet**: Next.js App Router avec structure `/app/`, `/features/`, `/components/`
- Base path: `/Users/theochampion/Sites/les-ignobles/clients/basta/basta-bo/`

---

## Phase 1: Setup (Infrastructure partagée)

**Purpose**: Structure de base et types TypeScript

- [x] T001 Créer la structure de dossiers `features/subscriptions/` avec sous-dossiers `repositories/`, `stores/`, `types/`, `components/`
- [x] T002 [P] Définir les types TypeScript dans `features/subscriptions/types/index.ts` (UserProfile, PromoCode, SubscriptionAuditLog, ActionType, DTOs)
- [x] T003 [P] Exécuter la migration SQL pour créer la table `subscription_audit_logs` dans Supabase (voir data-model.md)

---

## Phase 2: Foundational (Repositories - Prérequis bloquants)

**Purpose**: Couche d'accès aux données - DOIT être complète avant les user stories

**⚠️ CRITICAL**: Aucune user story ne peut commencer avant la fin de cette phase

- [x] T004 [P] Créer `UserProfileRepository` dans `features/subscriptions/repositories/user-profile-repository.ts` avec méthodes: findByUuid, findByEmail (via Supabase Admin API), updateSubscription, createMinimalProfile
- [x] T005 [P] Créer `PromoCodeRepository` dans `features/subscriptions/repositories/promo-code-repository.ts` avec méthodes: findAll (paginé + filtres), create, generateUniqueCode
- [x] T006 [P] Créer `SubscriptionAuditRepository` dans `features/subscriptions/repositories/subscription-audit-repository.ts` avec méthodes: create, findByUserId

**Checkpoint**: Repositories prêts - l'implémentation des user stories peut commencer

---

## Phase 3: User Story 1 - Recherche et gestion d'abonnement utilisateur (Priority: P1) 🎯 MVP

**Goal**: Permettre à l'admin de rechercher un utilisateur par email/UUID et modifier sa date de fin d'abonnement premium

**Independent Test**: Rechercher un utilisateur existant par email, visualiser son profil, cliquer "Ajouter 1 mois", vérifier la mise à jour en base

### API Routes pour User Story 1

- [x] T007 [P] [US1] Créer API route GET `/api/subscriptions` dans `app/api/subscriptions/route.ts` - recherche utilisateur par query (email ou UUID)
- [x] T008 [P] [US1] Créer API route PUT `/api/subscriptions` dans `app/api/subscriptions/route.ts` - mise à jour de la date d'abonnement avec audit log
- [x] T009 [P] [US1] Créer API route POST `/api/subscriptions/profile` dans `app/api/subscriptions/profile/route.ts` - création profil minimal
- [x] T010 [P] [US1] Créer API route GET `/api/subscriptions/audit` dans `app/api/subscriptions/audit/route.ts` - historique des modifications

### Store Zustand pour User Story 1

- [x] T011 [US1] Créer `subscription-store.ts` dans `features/subscriptions/stores/subscription-store.ts` avec état: searchQuery, userProfile, authUser, loading, error, auditLogs et actions: searchUser, updateSubscription, createProfile, fetchAuditLogs

### Composants UI pour User Story 1

- [x] T012 [P] [US1] Créer composant `UserSearchForm` dans `features/subscriptions/components/user-search-form.tsx` - champ de recherche avec bouton
- [x] T013 [P] [US1] Créer composant `UserProfileCard` dans `features/subscriptions/components/user-profile-card.tsx` - affichage infos utilisateur (UUID, email, nom, date fin abonnement, statut premium)
- [x] T014 [US1] Créer composant `SubscriptionActions` dans `features/subscriptions/components/subscription-actions.tsx` - boutons "Ajouter 1 mois", "Ajouter 1 an", date picker personnalisée, historique
- [x] T015 [US1] Créer page `app/dashboard/subscriptions/page.tsx` assemblant UserSearchForm, UserProfileCard, SubscriptionActions

**Checkpoint**: User Story 1 complète - admin peut rechercher un user et modifier son abonnement

---

## Phase 4: User Story 2 - Génération de codes promo (Priority: P2)

**Goal**: Permettre à l'admin de générer des codes promo uniques avec durée associée

**Independent Test**: Sélectionner "1 mois", cliquer "Générer", vérifier que le code apparaît et peut être copié

### API Routes pour User Story 2

- [x] T016 [P] [US2] Créer API route POST `/api/promo-codes` dans `app/api/promo-codes/route.ts` - génération de code avec duration (1_month ou 1_year)

### Store Zustand pour User Story 2

- [x] T017 [US2] Créer `promo-code-store.ts` dans `features/subscriptions/stores/promo-code-store.ts` avec état: promoCodes, loading, generating, newCode et actions: generateCode, copyToClipboard

### Composants UI pour User Story 2

- [x] T018 [P] [US2] Créer composant `PromoCodeForm` dans `features/subscriptions/components/promo-code-form.tsx` - sélecteur durée (1 mois/1 an) + bouton générer + affichage code généré + bouton copier

**Checkpoint**: User Story 2 complète - admin peut générer des codes promo

---

## Phase 5: User Story 3 - Liste et suivi des codes promo (Priority: P3)

**Goal**: Afficher la liste des codes promo avec pagination et filtres

**Independent Test**: Accéder à la page, voir la liste paginée, filtrer par "non utilisés"

### API Routes pour User Story 3

- [x] T019 [US3] Compléter API route GET `/api/promo-codes` dans `app/api/promo-codes/route.ts` - liste paginée avec filtre status (all, used, unused)

### Extension Store pour User Story 3

- [x] T020 [US3] Étendre `promo-code-store.ts` avec: pagination (page, pageSize, total), filter (status), et actions: fetchPromoCodes, setPage, setFilter

### Composants UI pour User Story 3

- [x] T021 [P] [US3] Créer composant `PromoCodesTable` dans `features/subscriptions/components/promo-codes-table.tsx` - tableau avec colonnes: code, date création, durée, statut, date utilisation, bouton copier
- [x] T022 [US3] Créer page `app/dashboard/promo-codes/page.tsx` assemblant PromoCodeForm et PromoCodesTable avec filtres et pagination

**Checkpoint**: User Story 3 complète - admin peut voir et filtrer tous les codes promo

---

## Phase 6: Polish & Intégration finale

**Purpose**: Navigation, permissions, et finitions

- [x] T023 Ajouter les liens "Abonnements" et "Codes Promo" dans `components/app-sidebar.tsx` sous une section "Administration" avec vérification `canAccessAdmin()`
- [x] T024 [P] Ajouter les routes `/dashboard/subscriptions` et `/dashboard/promo-codes` dans le mapping des permissions `lib/types/auth.ts` avec scope `admin:write`
- [x] T025 [P] Ajouter gestion des erreurs et états de chargement dans les deux pages
- [x] T026 Valider le parcours complet selon `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Aucune dépendance - peut démarrer immédiatement
- **Foundational (Phase 2)**: Dépend de Phase 1 (types) - BLOQUE toutes les user stories
- **User Stories (Phase 3-5)**: Toutes dépendent de Phase 2 (repositories)
  - US1, US2, US3 peuvent être parallélisées si plusieurs développeurs
  - Recommandé: séquentiellement P1 → P2 → P3 pour un développeur
- **Polish (Phase 6)**: Dépend de toutes les user stories complètes

### User Story Dependencies

- **User Story 1 (P1)**: Dépend de Phase 2 - Indépendante des autres stories
- **User Story 2 (P2)**: Dépend de Phase 2 - Indépendante (même page que US3 mais fonctionnalité séparée)
- **User Story 3 (P3)**: Dépend de Phase 2 - Partage la page avec US2, mais testable séparément

### Within Each User Story

1. API routes en parallèle
2. Store après les routes (consomme les APIs)
3. Composants après le store (consomme le store)
4. Page assemble les composants

### Parallel Opportunities

```
Phase 2 (Foundational):
  T004 + T005 + T006 en parallèle (repositories différents)

Phase 3 (US1):
  T007 + T008 + T009 + T010 en parallèle (routes différentes)
  T012 + T013 en parallèle (composants différents)

Phase 4 (US2):
  T016 + T018 peuvent démarrer en parallèle

Phase 5 (US3):
  T021 peut démarrer pendant T019 + T020

Phase 6 (Polish):
  T024 + T025 en parallèle
```

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Lancer tous les repositories en parallèle:
Task: "Créer UserProfileRepository dans features/subscriptions/repositories/user-profile-repository.ts"
Task: "Créer PromoCodeRepository dans features/subscriptions/repositories/promo-code-repository.ts"
Task: "Créer SubscriptionAuditRepository dans features/subscriptions/repositories/subscription-audit-repository.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006) - CRITICAL
3. Complete Phase 3: User Story 1 (T007-T015)
4. **STOP and VALIDATE**: Tester la recherche et modification d'abonnement
5. Déployer le MVP - la cliente peut déjà gérer les dédommagements

### Incremental Delivery

1. Setup + Foundational → Infrastructure prête
2. User Story 1 → Test → **Deploy MVP** (gestion abonnements)
3. User Story 2 → Test → Deploy (génération codes)
4. User Story 3 → Test → Deploy (liste codes)
5. Polish → Deploy final

### Estimation tâches

| Phase | Tâches | Parallélisables |
|-------|--------|-----------------|
| Setup | 3 | 2 |
| Foundational | 3 | 3 |
| US1 | 9 | 6 |
| US2 | 3 | 2 |
| US3 | 4 | 1 |
| Polish | 4 | 2 |
| **Total** | **26** | **16** |

---

## Notes

- [P] tasks = fichiers différents, pas de dépendances
- [Story] label associe chaque tâche à sa user story pour traçabilité
- Chaque user story est indépendamment complète et testable
- Commit après chaque tâche ou groupe logique
- S'arrêter à chaque checkpoint pour valider la story
- La migration SQL (T003) doit être exécutée manuellement dans Supabase avant de tester
