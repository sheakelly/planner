import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBlock,
  createDay,
  deleteBlock,
  deleteBlocksByDay,
  deleteDay,
  getAllBlocks,
  getAllDays,
  getBlocksByDay,
  getDay,
  getDayByDate,
  updateBlock,
  updateDay,
} from '../storage'
import type { Block, BlockInput, Day } from '../../types'

// Query keys
export const queryKeys = {
  days: ['days'] as const,
  day: (id: string) => ['days', id] as const,
  dayByDate: (date: string) => ['days', 'date', date] as const,
  blocks: ['blocks'] as const,
  block: (id: string) => ['blocks', id] as const,
  blocksByDay: (dayId: string) => ['blocks', 'day', dayId] as const,
}

// Days queries
export function useAllDays() {
  return useQuery({
    queryKey: queryKeys.days,
    queryFn: getAllDays,
  })
}

export function useDay(id: string) {
  return useQuery({
    queryKey: queryKeys.day(id),
    queryFn: () => getDay(id),
    enabled: !!id,
  })
}

export function useDayByDate(date: string) {
  return useQuery({
    queryKey: queryKeys.dayByDate(date),
    queryFn: () => getDayByDate(date),
    enabled: !!date,
  })
}

export function useCreateDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ date, timezone }: { date: string; timezone: string }) =>
      createDay(date, timezone),
    onSuccess: (newDay) => {
      queryClient.setQueryData(queryKeys.day(newDay.id), newDay)
      queryClient.setQueryData(queryKeys.dayByDate(newDay.date), newDay)
      queryClient.invalidateQueries({ queryKey: queryKeys.days })
    },
  })
}

export function useUpdateDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Day> }) =>
      updateDay(id, updates),
    onSuccess: (updatedDay) => {
      queryClient.setQueryData(queryKeys.day(updatedDay.id), updatedDay)
      queryClient.setQueryData(queryKeys.dayByDate(updatedDay.date), updatedDay)
      queryClient.invalidateQueries({ queryKey: queryKeys.days })
    },
  })
}

export function useDeleteDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDay(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.day(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.days })
    },
  })
}

// Blocks queries
export function useAllBlocks() {
  return useQuery({
    queryKey: queryKeys.blocks,
    queryFn: getAllBlocks,
  })
}

export function useBlocksByDay(dayId: string) {
  return useQuery({
    queryKey: queryKeys.blocksByDay(dayId),
    queryFn: () => getBlocksByDay(dayId),
    enabled: !!dayId,
  })
}

export function useCreateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BlockInput) => createBlock(input),
    onMutate: async (newBlock) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.blocksByDay(newBlock.dayId),
      })

      // Snapshot previous value
      const previousBlocks = queryClient.getQueryData<Array<Block>>(
        queryKeys.blocksByDay(newBlock.dayId),
      )

      // Optimistically update
      if (previousBlocks) {
        const optimisticBlock: Block = {
          id: 'temp-' + Date.now(),
          ...newBlock,
          duration: 0,
          status: newBlock.status || 'planned',
          tags: newBlock.tags || [],
          type: newBlock.type || 'other',
        }
        queryClient.setQueryData(queryKeys.blocksByDay(newBlock.dayId), [
          ...previousBlocks,
          optimisticBlock,
        ])
      }

      return { previousBlocks }
    },
    onError: (_err, newBlock, context) => {
      // Rollback on error
      if (context?.previousBlocks) {
        queryClient.setQueryData(
          queryKeys.blocksByDay(newBlock.dayId),
          context.previousBlocks,
        )
      }
    },
    onSuccess: (createdBlock) => {
      queryClient.setQueryData(queryKeys.block(createdBlock.id), createdBlock)
      queryClient.invalidateQueries({
        queryKey: queryKeys.blocksByDay(createdBlock.dayId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks })
    },
  })
}

export function useUpdateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<BlockInput>
    }) => updateBlock(id, updates),
    onMutate: async ({ id, updates }) => {
      const block = queryClient.getQueryData<Block>(queryKeys.block(id))
      if (!block) return

      await queryClient.cancelQueries({
        queryKey: queryKeys.blocksByDay(block.dayId),
      })

      const previousBlocks = queryClient.getQueryData<Array<Block>>(
        queryKeys.blocksByDay(block.dayId),
      )

      // Optimistically update
      if (previousBlocks) {
        const optimisticBlocks = previousBlocks.map((b) =>
          b.id === id ? { ...b, ...updates } : b,
        )
        queryClient.setQueryData(
          queryKeys.blocksByDay(block.dayId),
          optimisticBlocks,
        )
      }

      return { previousBlocks, dayId: block.dayId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBlocks && context.dayId) {
        queryClient.setQueryData(
          queryKeys.blocksByDay(context.dayId),
          context.previousBlocks,
        )
      }
    },
    onSuccess: (updatedBlock) => {
      queryClient.setQueryData(queryKeys.block(updatedBlock.id), updatedBlock)
      queryClient.invalidateQueries({
        queryKey: queryKeys.blocksByDay(updatedBlock.dayId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks })
    },
  })
}

export function useDeleteBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBlock(id),
    onMutate: async (id) => {
      const block = queryClient.getQueryData<Block>(queryKeys.block(id))
      if (!block) return

      await queryClient.cancelQueries({
        queryKey: queryKeys.blocksByDay(block.dayId),
      })

      const previousBlocks = queryClient.getQueryData<Array<Block>>(
        queryKeys.blocksByDay(block.dayId),
      )

      // Optimistically remove
      if (previousBlocks) {
        queryClient.setQueryData(
          queryKeys.blocksByDay(block.dayId),
          previousBlocks.filter((b) => b.id !== id),
        )
      }

      return { previousBlocks, dayId: block.dayId }
    },
    onError: (_err, _id, context) => {
      if (context?.previousBlocks && context.dayId) {
        queryClient.setQueryData(
          queryKeys.blocksByDay(context.dayId),
          context.previousBlocks,
        )
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.block(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks })
    },
  })
}

export function useDeleteBlocksByDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dayId: string) => deleteBlocksByDay(dayId),
    onSuccess: (_, dayId) => {
      queryClient.removeQueries({ queryKey: queryKeys.blocksByDay(dayId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks })
    },
  })
}
