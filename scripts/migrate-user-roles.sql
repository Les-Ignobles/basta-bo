-- Migration script pour ajouter le système de rôles avec scopes
-- Ce script doit être exécuté sur la base de données Supabase

-- 1. Ajouter la colonne role_scopes à la table user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role_scopes TEXT[] DEFAULT NULL;

-- 2. Migrer les utilisateurs admin existants
-- Les utilisateurs avec is_admin = true obtiennent tous les scopes
UPDATE user_profiles 
SET role_scopes = ARRAY[
    'cooking:read', 
    'cooking:write', 
    'advice:read', 
    'advice:write',
    'admin:read',
    'admin:write'
]
WHERE is_admin = true AND (role_scopes IS NULL OR array_length(role_scopes, 1) IS NULL);

-- 3. Optionnel : Créer des utilisateurs de test avec différents rôles
-- (Décommentez et modifiez les emails selon vos besoins)

/*
-- Gestionnaire Cuisine
UPDATE user_profiles 
SET role_scopes = ARRAY['cooking:read', 'cooking:write']
WHERE email = 'cooking-manager@example.com';

-- Gestionnaire Conseils
UPDATE user_profiles 
SET role_scopes = ARRAY['advice:read', 'advice:write']
WHERE email = 'advice-manager@example.com';

-- Lecture seule
UPDATE user_profiles 
SET role_scopes = ARRAY['cooking:read', 'advice:read']
WHERE email = 'readonly@example.com';

-- Utilisateur sans permissions (pour test)
UPDATE user_profiles 
SET role_scopes = ARRAY[]::TEXT[]
WHERE email = 'no-access@example.com';
*/

-- 4. Vérification des données migrées
SELECT 
    email,
    firstname,
    is_admin,
    role_scopes,
    array_length(role_scopes, 1) as scope_count
FROM user_profiles 
ORDER BY email;

-- 5. Index pour améliorer les performances des requêtes sur role_scopes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_scopes 
ON user_profiles USING GIN (role_scopes);

-- 6. Commentaires pour la documentation
COMMENT ON COLUMN user_profiles.role_scopes IS 'Array of permission scopes for the user (e.g., ["cooking:read", "advice:write"])';
COMMENT ON INDEX idx_user_profiles_role_scopes IS 'GIN index for efficient querying of role_scopes arrays';
