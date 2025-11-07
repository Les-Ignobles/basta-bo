export enum IngredientRelationType {
  FAMILY = 'family',
  SUBSTITUTE = 'substitute',
}

export type IngredientRelation = {
  id: number
  ingredient_id: number
  related_ingredient_id: number
  relation_type: IngredientRelationType
  created_at: string
}

export type CreateIngredientRelationPayload = {
  ingredient_id: number
  related_ingredient_id: number
  relation_type: IngredientRelationType
}

export type IngredientRelationWithNames = IngredientRelation & {
  ingredient_name?: string
  related_ingredient_name?: string
}
