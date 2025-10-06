"use client"
import { useAuth } from '@/components/auth-provider'
import { hasScope, getRequiredScopesForRoute, RoleScope } from '@/lib/types/auth'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface RouteGuardProps {
    children: ReactNode
    fallback?: ReactNode
    requiredScopes?: RoleScope[]
}

export function RouteGuard({ children, fallback, requiredScopes }: RouteGuardProps) {
    const { userProfile } = useAuth()
    const pathname = usePathname()

    // Si pas de profil utilisateur, afficher le fallback
    if (!userProfile) {
        return <>{fallback || <div>Accès non autorisé</div>}</>
    }

    // Déterminer les scopes requis
    const scopes = requiredScopes || getRequiredScopesForRoute(pathname)

    // Si aucun scope requis, autoriser l'accès
    if (scopes.length === 0) {
        return <>{children}</>
    }

    // Vérifier les permissions
    let userScopes: string[] = []

    if (userProfile.role_scopes && Array.isArray(userProfile.role_scopes)) {
        userScopes = userProfile.role_scopes
    } else if (userProfile.is_admin) {
        // Fallback: admin users get all scopes
        userScopes = ['cooking:read', 'cooking:write', 'advice:read', 'advice:write', 'admin:read', 'admin:write']
    }

    // Vérifier si l'utilisateur a les scopes requis
    const hasPermission = hasScope(userScopes as RoleScope[], scopes)

    if (!hasPermission) {
        return <>{fallback || <div>Accès non autorisé</div>}</>
    }

    return <>{children}</>
}

// Hook pour vérifier les permissions dans les composants
export function usePermissions() {
    const { userProfile } = useAuth()

    const hasScopeAccess = (requiredScopes: RoleScope[]): boolean => {
        if (!userProfile) return false

        let userScopes: string[] = []

        if (userProfile.role_scopes && Array.isArray(userProfile.role_scopes)) {
            userScopes = userProfile.role_scopes
        } else if (userProfile.is_admin) {
            userScopes = ['cooking:read', 'cooking:write', 'advice:read', 'advice:write', 'admin:read', 'admin:write']
        }

        return hasScope(userScopes as RoleScope[], requiredScopes)
    }

    const canAccessCooking = () => hasScopeAccess(['cooking:read'])
    const canAccessAdvice = () => hasScopeAccess(['advice:read'])
    const canAccessAdmin = () => hasScopeAccess(['admin:read'])

    return {
        hasScopeAccess,
        canAccessCooking,
        canAccessAdvice,
        canAccessAdmin,
        userProfile
    }
}
