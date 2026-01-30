# Implementation Plan: Administration des Abonnements et Codes Promo

**Branch**: `001-subscription-admin` | **Date**: 2026-01-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-subscription-admin/spec.md`

## Summary

Création de deux pages d'administration dans le backoffice Basta pour :
1. **Gestion des abonnements** : recherche d'utilisateur par email/UUID et modification de la date de fin d'abonnement premium (dédommagements support client)
2. **Gestion des codes promo** : génération, liste et suivi des codes promotionnels

L'implémentation suit les patterns existants du projet (Repository + Zustand stores + API routes Next.js).

## Technical Context

**Language/Version**: TypeScript ^5, Node.js 22
**Primary Dependencies**: Next.js 15.5.9, React 19.1.0, Zustand 5.0.8, Supabase Client 2.58.0
**Storage**: Supabase PostgreSQL (tables existantes: `user_profiles`, `promo_codes`, auth.users + nouvelle table `subscription_audit_logs`)
**Testing**: N/A (pas de tests dans le projet actuel)
**Target Platform**: Web (Next.js App Router)
**Project Type**: Web application (backoffice admin)
**Performance Goals**: < 2s pour la liste des codes promo (jusqu'à 1000 codes)
**Constraints**: Accessible uniquement aux admins avec scope `admin:write`
**Scale/Scope**: ~100 utilisateurs admin max, ~10k codes promo max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Dependency Inversion | ✅ PASS | Ce projet est le backoffice (pas basta-backend). Pattern simplifié : repositories directement dans `/features/` ou `/lib/` |
| II. Use Cases Encapsulate Business Logic | ⚠️ N/A | Le backoffice ne suit pas ce pattern - logique dans stores Zustand + API routes |
| III. Repository Pattern with DTOs | ✅ PASS | Utilise BaseRepository existant, DTOs TypeScript |
| IV. Systematic Dependency Injection | ⚠️ N/A | Pas de DI container dans basta-bo - instanciation directe dans API routes |
| V. Feature-Based Organization | ✅ PASS | Organisation par feature dans `/features/` |

**Note**: La constitution est celle de basta-backend. Le backoffice (basta-bo) suit des patterns simplifiés adaptés à Next.js App Router.

## Project Structure

### Documentation (this feature)

```text
specs/001-subscription-admin/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── subscriptions/
│   │   ├── route.ts              # GET (search user), PUT (update subscription)
│   │   └── audit/route.ts        # GET (audit logs for user)
│   └── promo-codes/
│       └── route.ts              # GET (list), POST (create)
└── dashboard/
    ├── subscriptions/
    │   └── page.tsx              # Page gestion abonnements
    └── promo-codes/
        └── page.tsx              # Page codes promo

features/
└── subscriptions/
    ├── repositories/
    │   ├── user-profile-repository.ts
    │   ├── promo-code-repository.ts
    │   └── subscription-audit-repository.ts
    ├── stores/
    │   ├── subscription-store.ts
    │   └── promo-code-store.ts
    ├── types/
    │   └── index.ts
    └── components/
        ├── user-search-form.tsx
        ├── user-profile-card.tsx
        ├── subscription-actions.tsx
        ├── promo-code-form.tsx
        └── promo-codes-table.tsx

components/
└── app-sidebar.tsx               # À modifier pour ajouter les liens

lib/
└── supabase/
    └── (existant)
```

**Structure Decision**: Web application pattern avec API routes Next.js, stores Zustand pour l'état client, et repositories pour l'accès données. Deux nouvelles pages dans `/app/dashboard/`.

## Complexity Tracking

> Aucune violation de constitution nécessitant justification.

| Item | Decision | Rationale |
|------|----------|-----------|
| Nouvelle table `subscription_audit_logs` | Ajoutée | Requis par FR-012 pour traçabilité des modifications |
| Pas de use cases séparés | Accepté | Pattern du backoffice existant : logique dans API routes + stores |
