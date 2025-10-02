// Utilitaires pour décoder les masques binaires

export interface MaskItem {
    id: number
    name: string
    emoji?: string
}

/**
 * Décode un masque binaire en liste d'éléments
 * @param mask Le masque binaire (number)
 * @param items La liste des éléments avec leur bit_index
 * @returns Liste des éléments correspondants
 */
export function decodeMask(mask: number | null, items: MaskItem[]): MaskItem[] {
    if (!mask || mask === 0) return []
    
    return items.filter(item => {
        // Utiliser bit_index directement si disponible, sinon calculer avec id
        const bitIndex = (item as any).bit_index || (item.id - 1)
        const bitPosition = Math.pow(2, bitIndex)
        return (mask & bitPosition) > 0
    })
}

/**
 * Crée un masque binaire à partir d'une liste d'IDs
 * @param ids Liste des IDs sélectionnés
 * @returns Masque binaire
 */
export function createMask(ids: number[], items: MaskItem[]): number {
    return ids.reduce((mask, id) => {
        const item = items.find(i => i.id === id)
        const bitIndex = (item as any)?.bit_index || (id - 1)
        const bitPosition = Math.pow(2, bitIndex)
        return mask | bitPosition
    }, 0)
}

/**
 * Vérifie si un masque contient un élément spécifique
 * @param mask Le masque binaire
 * @param itemId L'ID de l'élément à vérifier
 * @returns true si l'élément est présent
 */
export function hasMaskItem(mask: number | null, itemId: number, items: MaskItem[]): boolean {
    if (!mask || mask === 0) return false
    const item = items.find(i => i.id === itemId)
    const bitIndex = (item as any)?.bit_index || (itemId - 1)
    const bitPosition = Math.pow(2, bitIndex)
    return (mask & bitPosition) > 0
}

/**
 * Compte le nombre d'éléments dans un masque
 * @param mask Le masque binaire
 * @returns Nombre d'éléments activés
 */
export function countMaskItems(mask: number | null): number {
    if (!mask || mask === 0) return 0
    return mask.toString(2).split('1').length - 1
}
