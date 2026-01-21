import { useState, useCallback } from 'react'

interface UseOptimisticUpdateOptions<T> {
    onError?: (error: Error, previousState: T) => void
}

/**
 * Hook for optimistic updates with automatic rollback on error
 */
export function useOptimisticUpdate<T>(
    initialState: T,
    options: UseOptimisticUpdateOptions<T> = {}
) {
    const [state, setState] = useState<T>(initialState)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const updateOptimistically = useCallback(
        async (
            optimisticState: T,
            saveOperation: () => Promise<void>
        ): Promise<boolean> => {
            const previousState = state
            setError(null)
            setSaving(true)

            // Apply optimistic update immediately
            setState(optimisticState)

            try {
                await saveOperation()
                return true
            } catch (err) {
                // Rollback on error
                setState(previousState)
                const error = err instanceof Error ? err : new Error(String(err))
                setError(error)
                options.onError?.(error, previousState)
                return false
            } finally {
                setSaving(false)
            }
        },
        [state, options]
    )

    const setStateWithoutSave = useCallback((newState: T | ((prev: T) => T)) => {
        setState(newState)
    }, [])

    return {
        state,
        setState: setStateWithoutSave,
        saving,
        error,
        updateOptimistically,
    }
}
