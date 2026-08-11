-- Migration: 002_add_units_per_serving_to_recipes.sql
-- Feature: rendement recette (nombre d'unités produites par portion)
-- Date: 2026-08-06
-- Description: Ajoute une colonne pour mémoriser le nombre d'unités produites par
--   portion (ex: 4 cookies pour 1 personne). Sert de référentiel pour recalculer
--   proportionnellement les quantités d'ingrédients depuis le back-office.

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS units_per_serving INTEGER;

COMMENT ON COLUMN recipes.units_per_serving IS
  'Nombre d''unités produites par portion (ex: 4 cookies). Optionnel. Utilisé par le BO pour recalculer les quantités.';
