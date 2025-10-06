// Types pour le système de rôles avec scopes
export type RoleScope =
    | 'cooking:read'
    | 'cooking:write'
    | 'advice:read'
    | 'advice:write'
    | 'admin:read'
    | 'admin:write'

export type UserRole = {
    id: string
    name: string
    role_scopes: RoleScope[]
}

// Rôles prédéfinis
export const USER_ROLES: Record<string, UserRole> = {
    'cooking_manager': {
        id: 'cooking_manager',
        name: 'Gestionnaire Cuisine',
        role_scopes: ['cooking:read', 'cooking:write']
    },
    'advice_manager': {
        id: 'advice_manager',
        name: 'Gestionnaire Conseils',
        role_scopes: ['advice:read', 'advice:write']
    },
    'admin': {
        id: 'admin',
        name: 'Administrateur',
        role_scopes: ['cooking:read', 'cooking:write', 'advice:read', 'advice:write', 'admin:read', 'admin:write']
    },
    'readonly': {
        id: 'readonly',
        name: 'Lecture seule',
        role_scopes: ['cooking:read', 'advice:read']
    }
}

// Mapping des routes vers les scopes requis
export const ROUTE_SCOPE_MAP: Record<string, RoleScope[]> = {
    '/dashboard/ingredients': ['cooking:read'],
    '/dashboard/recipes': ['cooking:read'],
    '/dashboard/pending-ingredients': ['cooking:read'],
    '/dashboard/advice/articles': ['advice:read'],
    '/dashboard/advice/categories': ['advice:read'],
    '/dashboard/advice/faq': ['advice:read'],
    '/dashboard/admin': ['admin:read']
}

// Mapping des groupes de sidebar vers les scopes requis
export const SIDEBAR_GROUP_SCOPE_MAP: Record<string, RoleScope[]> = {
    'cooking': ['cooking:read'],
    'advice': ['advice:read'],
    'admin': ['admin:read']
}

// Fonctions utilitaires
export function hasScope(userScopes: RoleScope[], requiredScopes: RoleScope[]): boolean {
    return requiredScopes.every(scope => userScopes.includes(scope))
}

export function getUserScopesFromRole(roleId: string): RoleScope[] {
    return USER_ROLES[roleId]?.role_scopes || []
}

export function getRequiredScopesForRoute(pathname: string): RoleScope[] {
    // Vérifier les routes exactes d'abord
    if (ROUTE_SCOPE_MAP[pathname]) {
        return ROUTE_SCOPE_MAP[pathname]
    }

    // Vérifier les routes qui commencent par le pattern
    for (const [route, scopes] of Object.entries(ROUTE_SCOPE_MAP)) {
        if (pathname.startsWith(route)) {
            return scopes
        }
    }

    return []
}

export function getRequiredScopesForSidebarGroup(groupId: string): RoleScope[] {
    return SIDEBAR_GROUP_SCOPE_MAP[groupId] || []
}
