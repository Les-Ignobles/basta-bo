# Feature Specification: Administration des Abonnements et Codes Promo

**Feature Branch**: `001-subscription-admin`
**Created**: 2026-01-30
**Status**: Draft
**Input**: User description: "Page admin pour gérer les abonnements utilisateurs (dédommagement/gestion support) et génération de codes promo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recherche et gestion d'abonnement utilisateur (Priority: P1)

En tant qu'administratrice Basta, je veux pouvoir rechercher un utilisateur par email ou ID puis modifier sa date de fin d'abonnement premium, afin de pouvoir offrir des dédommagements aux utilisateurs ayant rencontré des problèmes.

**Why this priority**: C'est le cas d'usage principal et le plus fréquent - le support client doit pouvoir rapidement offrir un dédommagement (1 mois ou 1 an d'abonnement) à un utilisateur mécontent.

**Independent Test**: Peut être testé en recherchant un utilisateur existant, en visualisant ses informations et en modifiant sa date d'abonnement. La valeur est immédiatement vérifiable en base de données.

**Acceptance Scenarios**:

1. **Given** je suis sur la page de gestion des abonnements, **When** je saisis l'email d'un utilisateur existant et lance la recherche, **Then** les informations du profil utilisateur s'affichent (nom, email, date de fin d'abonnement actuelle)
2. **Given** j'ai trouvé un utilisateur, **When** je clique sur "Ajouter 1 mois" ou "Ajouter 1 an", **Then** la date de fin d'abonnement est mise à jour (prolongée si déjà premium, ou définie à partir d'aujourd'hui si expiré)
3. **Given** j'ai trouvé un utilisateur, **When** je saisis une date personnalisée de fin d'abonnement, **Then** la date est mise à jour avec la valeur saisie
4. **Given** je saisis un email ou ID qui n'existe pas, **When** je lance la recherche, **Then** un message d'erreur clair s'affiche indiquant que l'utilisateur n'a pas été trouvé

---

### User Story 2 - Génération de codes promo (Priority: P2)

En tant qu'administratrice Basta, je veux pouvoir générer des codes promo uniques avec une durée d'abonnement associée, afin de les distribuer lors de jeux-concours ou promotions.

**Why this priority**: Cas d'usage secondaire mais régulier - génération de codes pour les jeux-concours et opérations marketing.

**Independent Test**: Peut être testé en générant un code promo et en vérifiant sa présence en base de données avec les bonnes valeurs.

**Acceptance Scenarios**:

1. **Given** je suis sur la page de gestion des codes promo, **When** je sélectionne "1 mois" et clique sur "Générer un code", **Then** un code unique est créé avec une date `premium_end_at` correspondant à 1 mois à partir d'aujourd'hui
2. **Given** je suis sur la page de gestion des codes promo, **When** je sélectionne "1 an" et clique sur "Générer un code", **Then** un code unique est créé avec une date `premium_end_at` correspondant à 1 an à partir d'aujourd'hui
3. **Given** un code a été généré, **When** je le visualise, **Then** je peux voir le code, la date de création, la durée d'abonnement associée et s'il a été utilisé ou non
4. **Given** un code a été généré, **When** je clique sur "Copier", **Then** le code est copié dans le presse-papier

---

### User Story 3 - Liste et suivi des codes promo (Priority: P3)

En tant qu'administratrice Basta, je veux voir la liste de tous les codes promo générés avec leur statut, afin de suivre leur utilisation.

**Why this priority**: Fonctionnalité de suivi utile mais non bloquante pour le cas d'usage principal.

**Independent Test**: Peut être testé en affichant la liste des codes et en vérifiant que les informations sont correctes et à jour.

**Acceptance Scenarios**:

1. **Given** des codes promo existent en base, **When** j'accède à la page des codes promo, **Then** je vois la liste paginée de tous les codes avec : code, date de création, durée associée, statut (utilisé/non utilisé)
2. **Given** je visualise la liste des codes, **When** je filtre par statut "non utilisé", **Then** seuls les codes non encore utilisés sont affichés
3. **Given** je visualise la liste des codes, **When** un code a été utilisé, **Then** je peux voir la date d'utilisation

---

### Edge Cases

- Que se passe-t-il si l'administrateur essaie de définir une date d'abonnement dans le passé ? -> Un avertissement est affiché mais l'action est autorisée (cas de correction d'erreur)
- Que se passe-t-il si l'utilisateur recherché n'a pas de profil `user_profiles` ? -> Un message indique que l'utilisateur existe dans auth.users mais n'a pas encore de profil, avec possibilité de créer un profil minimal
- Comment gérer un utilisateur dont l'abonnement est déjà actif ? -> Les boutons "Ajouter 1 mois/1 an" prolongent à partir de la date de fin actuelle, pas à partir d'aujourd'hui
- Que se passe-t-il en cas de tentative de génération d'un code qui existe déjà ? -> Le système génère des codes uniques aléatoires, la collision est gérée par retry automatique

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre la recherche d'un utilisateur par email (depuis auth.users) ou par UUID (depuis user_profiles)
- **FR-002**: Le système DOIT afficher les informations de profil de l'utilisateur trouvé : UUID, email, nom (si disponible), date de fin d'abonnement actuelle
- **FR-003**: Le système DOIT permettre d'ajouter rapidement 1 mois ou 1 an d'abonnement via des boutons dédiés
- **FR-004**: Le système DOIT permettre de définir une date de fin d'abonnement personnalisée via un sélecteur de date
- **FR-005**: Le système DOIT prolonger l'abonnement à partir de la date de fin actuelle si l'utilisateur est premium, ou à partir d'aujourd'hui sinon
- **FR-006**: Le système DOIT permettre de générer des codes promo uniques avec une durée associée (1 mois ou 1 an)
- **FR-007**: Le système DOIT stocker les codes promo avec : code unique, date de création, date premium_end_at calculée, date d'utilisation (null si non utilisé)
- **FR-008**: Le système DOIT afficher la liste des codes promo avec pagination
- **FR-009**: Le système DOIT permettre de filtrer les codes promo par statut (tous, utilisés, non utilisés)
- **FR-010**: Le système DOIT permettre de copier un code promo dans le presse-papier
- **FR-011**: Le système DOIT être accessible uniquement aux administrateurs authentifiés
- **FR-012**: Le système DOIT conserver un historique des modifications d'abonnement : date de l'action, identifiant admin, utilisateur modifié, ancienne date de fin, nouvelle date de fin
- **FR-013**: Le système DOIT présenter deux pages distinctes dans la sidebar : une page "Gestion Abonnements" et une page "Codes Promo"

### Key Entities

- **UserProfile**: Profil utilisateur avec UUID (lié à auth.users), informations personnelles et date de fin d'abonnement premium (`premium_sub_end_at`)
- **AuthUser**: Utilisateur Supabase (table auth.users) contenant l'email et l'UUID
- **PromoCode**: Code promotionnel avec code unique, date de création, date premium associée (`premium_end_at`), et date d'utilisation optionnelle (`used_at`)
- **SubscriptionAuditLog**: Historique des modifications d'abonnement avec date, identifiant admin, utilisateur cible, ancienne et nouvelle date de fin d'abonnement

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: L'administratrice peut trouver un utilisateur et modifier son abonnement en moins de 30 secondes
- **SC-002**: La génération d'un code promo et sa copie prennent moins de 10 secondes
- **SC-003**: 100% des recherches d'utilisateurs par email ou UUID existants retournent un résultat
- **SC-004**: Les codes promo générés sont uniques et utilisables une seule fois
- **SC-005**: La liste des codes promo se charge en moins de 2 secondes pour jusqu'à 1000 codes

## Clarifications

### Session 2026-01-30

- Q: Faut-il conserver un historique des modifications d'abonnement effectuées par l'administratrice ? → A: Oui, avec log basique (date, admin, user modifié, ancienne/nouvelle date)
- Q: Organisation des pages (une page avec onglets ou deux pages distinctes) ? → A: Deux pages distinctes dans le menu sidebar

## Assumptions

- L'administratrice dispose d'un accès au backoffice avec les permissions appropriées
- La structure des tables `user_profiles` et `promo_codes` est fixe et ne sera pas modifiée
- La jointure entre `user_profiles` et `auth.users` se fait via le champ UUID
- Les codes promo sont générés avec un format alphanumérique aléatoire suffisamment long pour éviter les collisions (8-12 caractères)
- La durée "1 mois" correspond à 30 jours et "1 an" à 365 jours pour le calcul des dates
