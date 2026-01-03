import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPreferences, updatePreferences } from '../storage'
import type { UserPreferences } from '../../types'

// Query keys
export const preferencesKeys = {
  all: ['preferences'] as const,
  preferences: () => ['preferences', 'default'] as const,
}

export function usePreferences() {
  return useQuery({
    queryKey: preferencesKeys.preferences(),
    queryFn: getPreferences,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<Omit<UserPreferences, 'id'>>) =>
      updatePreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.all })
    },
  })
}
