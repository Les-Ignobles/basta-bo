<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles derived from CLAUDE.md and .claude/guides/)
  - Development Workflow
  - Quality Standards
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Already has Constitution Check section
  - .specify/templates/spec-template.md: ✅ Compatible (requirements align with principles)
  - .specify/templates/tasks-template.md: ✅ Compatible (follows phase structure)
Follow-up TODOs: None
-->

# Basta Backend Constitution

## Core Principles

### I. Dependency Inversion (NON-NEGOTIABLE)

The domain layer MUST never depend on infrastructure or vendor layers. This is the foundational
rule that enables testability, maintainability, and technology independence.

**Allowed Dependencies:**
- `core` → nothing (fully isolated)
- `domain` → `core` only
- `infra` → `domain`, `core`, `vendor`
- `vendor` → external libraries only

**Forbidden Dependencies:**
- `domain` → `infra` (CRITICAL VIOLATION)
- `domain` → `vendor` (CRITICAL VIOLATION)

**Enforcement**: Any import from `infra/` or `vendor/` in a `domain/` file constitutes a critical
architecture violation that MUST be rejected.

### II. Use Cases Encapsulate Business Logic

ALL business logic MUST reside in use cases (`domain/usecases/`). Use cases are the single
source of truth for business rules and operations.

**Use cases MUST:**
- Accept dependencies via constructor injection (interfaces only)
- Expose one public method: `handle(params)`
- Contain pure business logic with no framework dependencies
- Be independently testable without infrastructure

**Business logic MUST NOT exist in:**
- Controllers (HTTP layer)
- Repositories (data access layer)
- Components (UI layer)
- Coordinators (orchestration only, no business rules)

### III. Repository Pattern with DTOs

Every repository MUST follow the BaseRepository contract with explicit Data Transfer Objects.

**Interface Requirements (`domain/repositories/`):**
- Extend `BaseRepository<Entity, CreateDto, UpdateDto>`
- Define `CreateDto` with mandatory fields (no ID, no auto-timestamps)
- Define `UpdateDto` with optional fields (all properties marked `?`)
- DTOs MUST be in the same file as the interface

**Implementation Requirements (`infra/repositories/`):**
- Extend appropriate base class (e.g., `BaseSupabaseRepository`)
- Implement `fromJson()` for entity hydration
- Implement `all()` and other required methods

**Prohibition**: Repositories MUST NOT use `any` types for DTOs.

### IV. Systematic Dependency Injection

ALL dependencies MUST be resolved through the DI container (`core/di/di.ts`). Direct
instantiation of infrastructure implementations is forbidden.

**Required Pattern:**
```typescript
// CORRECT
const repo = Di.productRepository();

// FORBIDDEN
const repo = new SupabaseProductRepository();
```

**DI Container Rules:**
- Return interfaces, never implementations
- Serve as the single entry point for all dependencies
- Enable swapping implementations without code changes

### V. Feature-Based Organization

Code MUST be organized by business domain (feature), not by technical layer. Each feature
follows a consistent internal structure.

**Feature Structure:**
```
features/{domain}/
├── domain/           # Pure business logic
│   ├── entities/     # Objects with identity
│   ├── value-objects/# Immutable objects
│   ├── repositories/ # Interfaces + DTOs
│   ├── usecases/     # Business operations
│   ├── collections/  # Collection operations
│   └── enum/         # Business enumerations
└── infra/            # Technical implementations
    ├── repositories/ # Concrete implementations
    └── coordinators/ # Workflow orchestration
```

**Naming Conventions:**
- Files: `kebab-case`
- Classes: `PascalCase`
- Methods: `camelCase`

## Development Workflow

### Feature Creation Checklist

When creating a new feature, ALWAYS follow this order:

1. Create folder structure (`domain/`, `infra/`)
2. Define entities (`domain/entities/`)
3. Define repository interface + DTOs (`domain/repositories/`)
4. Implement repository (`infra/repositories/`)
5. Register in DI container (`core/di/di.ts`)
6. Create use cases (`domain/usecases/`)
7. Validate against this constitution

### Pre-Code Questions

Before writing code, answer:

1. Does this logic belong in domain (use case) or infra?
2. Am I importing an interface or a concrete implementation?
3. Have I defined DTOs for this repository?
4. Have I registered this dependency in DI?
5. Does this code respect dependency rules?

## Quality Standards

### Architecture Compliance

- [ ] Dependency rules respected (domain never imports infra/vendor)
- [ ] DTOs present for all repositories
- [ ] Business logic contained in use cases
- [ ] DI used everywhere (no direct instantiation)
- [ ] Naming conventions followed

### Anti-Patterns to Detect

**Domain Importing Infra:**
```typescript
// VIOLATION
import { SupabaseOrderRepository } from '../../../infra/...';
```

**Anemic Entities:**
```typescript
// VIOLATION - No business behavior
export class Order {
  constructor(public id: number, public status: string) {}
}
```

**Business Logic Outside Use Cases:**
```typescript
// VIOLATION - In controller
const total = items.reduce((sum, item) => sum + item.price, 0);
```

**Repository Without DTOs:**
```typescript
// VIOLATION
export interface ProductRepository extends BaseRepository<Product, any, any>
```

## Governance

### Amendment Process

1. Propose change with rationale
2. Document impact on existing code
3. Update this constitution with version increment
4. Propagate changes to dependent templates

### Version Policy

- **MAJOR**: Backward-incompatible governance changes or principle removal
- **MINOR**: New principle added or existing guidance materially expanded
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

### Compliance Review

All code reviews MUST verify compliance with this constitution. Complexity beyond these
patterns requires explicit justification in the PR description.

### Guidance Reference

For detailed implementation guidance, consult:
- `.claude/guides/01-ARCHITECTURE.md` - Comprehensive architecture guide
- `.claude/guides/02-REPOSITORIES.md` - Repository pattern details
- `.claude/guides/03-IA-SERVICES.md` - AI service integration

**Foundational Principle**: *The business domain depends on nothing. Everything depends on
the domain.*

**Version**: 1.0.0 | **Ratified**: 2026-01-08 | **Last Amended**: 2026-01-08
