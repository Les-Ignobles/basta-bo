# Système de Rôles avec Scopes

## Vue d'ensemble

Le système de rôles utilise des **scopes** (permissions granulaires) pour contrôler l'accès aux différentes sections de l'application. Chaque utilisateur a un `role_scopes` qui contient un tableau de permissions.

## Scopes disponibles

### Cooking (Cuisine)
- `cooking:read` - Lecture des ingrédients, recettes et pending ingredients
- `cooking:write` - Modification/création d'ingrédients et recettes

### Advice (Conseils)
- `advice:read` - Lecture des articles, catégories et FAQ
- `advice:write` - Modification/création d'articles, catégories et FAQ

### Admin (Administration)
- `admin:read` - Lecture des données administratives (Recipe Batch)
- `admin:write` - Modification des données administratives

## Rôles prédéfinis

### Gestionnaire Cuisine
```json
{
  "role_scopes": ["cooking:read", "cooking:write"]
}
```

### Gestionnaire Conseils
```json
{
  "role_scopes": ["advice:read", "advice:write"]
}
```

### Administrateur
```json
{
  "role_scopes": ["cooking:read", "cooking:write", "advice:read", "advice:write", "admin:read", "admin:write"]
}
```

### Lecture seule
```json
{
  "role_scopes": ["cooking:read", "advice:read"]
}
```

## Migration depuis is_admin

Le système est rétrocompatible :
- Si `role_scopes` est défini, il est utilisé
- Sinon, si `is_admin` est `true`, l'utilisateur obtient tous les scopes
- Sinon, l'utilisateur n'a aucun accès

## Structure de la base de données

### Table user_profiles
```sql
ALTER TABLE user_profiles 
ADD COLUMN role_scopes TEXT[] DEFAULT NULL;
```

### Exemple de données
```sql
-- Administrateur complet
UPDATE user_profiles 
SET role_scopes = ARRAY['cooking:read', 'cooking:write', 'advice:read', 'advice:write', 'admin:read', 'admin:write']
WHERE email = 'admin@example.com';

-- Gestionnaire cuisine uniquement
UPDATE user_profiles 
SET role_scopes = ARRAY['cooking:read', 'cooking:write']
WHERE email = 'cooking@example.com';

-- Lecture seule
UPDATE user_profiles 
SET role_scopes = ARRAY['cooking:read', 'advice:read']
WHERE email = 'readonly@example.com';
```

## Utilisation dans le code

### Protection des routes (Middleware)
Le middleware vérifie automatiquement les permissions pour chaque route `/dashboard/*`.

### Protection des composants
```tsx
import { RouteGuard, usePermissions } from '@/components/route-guard'

// Protection d'un composant entier
<RouteGuard requiredScopes={['cooking:read']}>
  <IngredientsList />
</RouteGuard>

// Vérification conditionnelle
function MyComponent() {
  const { canAccessCooking, canAccessAdvice } = usePermissions()
  
  return (
    <div>
      {canAccessCooking() && <CookingSection />}
      {canAccessAdvice() && <AdviceSection />}
    </div>
  )
}
```

### Protection de la sidebar
La sidebar masque automatiquement les groupes auxquels l'utilisateur n'a pas accès.

## Mapping des routes

| Route | Scopes requis |
|-------|---------------|
| `/dashboard/ingredients` | `cooking:read` |
| `/dashboard/recipes` | `cooking:read` |
| `/dashboard/pending-ingredients` | `cooking:read` |
| `/dashboard/advice/articles` | `advice:read` |
| `/dashboard/advice/categories` | `advice:read` |
| `/dashboard/advice/faq` | `advice:read` |
| `/dashboard/admin` | `admin:read` |

## Ajout de nouveaux scopes

1. Ajouter le nouveau scope dans `lib/types/auth.ts`
2. Mettre à jour `ROUTE_SCOPE_MAP` pour les nouvelles routes
3. Mettre à jour `SIDEBAR_GROUP_SCOPE_MAP` si nécessaire
4. Ajouter les nouveaux scopes aux rôles appropriés dans `USER_ROLES`
