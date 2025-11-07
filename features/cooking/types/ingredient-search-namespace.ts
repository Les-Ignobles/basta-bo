export type IngredientSearchNamespace = {
  id: number
  name: string
  bit_index: number
  created_at: string
}

export type CreateIngredientSearchNamespacePayload = {
  name: string
  bit_index: number
}

export type UpdateIngredientSearchNamespacePayload = {
  name?: string
  bit_index?: number
}
