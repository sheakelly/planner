import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getWorkingMemory, updateWorkingMemory } from '../storage'

// Query keys
export const workingMemoryKeys = {
  all: ['workingMemory'] as const,
  memory: () => ['workingMemory', 'default'] as const,
}

export function useWorkingMemory() {
  return useQuery({
    queryKey: workingMemoryKeys.memory(),
    queryFn: getWorkingMemory,
  })
}

export function useUpdateWorkingMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => updateWorkingMemory(content),
    onSuccess: (updated) => {
      queryClient.setQueryData(workingMemoryKeys.memory(), updated)
    },
  })
}
