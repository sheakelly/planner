import { differenceInMinutes, parseISO } from 'date-fns'
import type { Block, BlockInput } from '../../types'

const SLOT_MINUTES = 15

export function snapToSlot(date: Date): Date {
  const minutes = date.getMinutes()
  const snapped = Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES
  const result = new Date(date)
  result.setMinutes(snapped)
  result.setSeconds(0)
  result.setMilliseconds(0)
  return result
}

export function snapToQuarterHour(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES
}

export function validateBlockTimes(
  start: string,
  end: string,
): {
  valid: boolean
  error?: string
} {
  const startDate = parseISO(start)
  const endDate = parseISO(end)

  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Invalid start time' }
  }

  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid end time' }
  }

  if (startDate >= endDate) {
    return { valid: false, error: 'Start time must be before end time' }
  }

  return { valid: true }
}

export function calculateDuration(start: string, end: string): number {
  return differenceInMinutes(parseISO(end), parseISO(start))
}

export function checkOverlap(block1: Block, block2: Block): boolean {
  if (block1.dayId !== block2.dayId) return false
  if (block1.id === block2.id) return false

  const start1 = parseISO(block1.start)
  const end1 = parseISO(block1.end)
  const start2 = parseISO(block2.start)
  const end2 = parseISO(block2.end)

  return start1 < end2 && start2 < end1
}

export function findOverlappingBlocks(
  block: Block | BlockInput,
  allBlocks: Array<Block>,
): Array<Block> {
  return allBlocks.filter((b) => {
    if ('id' in block && b.id === block.id) return false
    if (b.dayId !== block.dayId) return false

    const start1 = parseISO(block.start)
    const end1 = parseISO(block.end)
    const start2 = parseISO(b.start)
    const end2 = parseISO(b.end)

    return start1 < end2 && start2 < end1
  })
}

export interface BlockLayout {
  block: Block
  column: number
  totalColumns: number
}

/**
 * Calculate column positions for overlapping blocks
 * Uses a greedy algorithm to minimize the number of columns needed
 */
export function calculateBlockLayout(
  blocks: Block[],
): Map<string, BlockLayout> {
  const layout = new Map<string, BlockLayout>()

  // Sort blocks by start time, then by duration (longer first)
  const sortedBlocks = [...blocks].sort((a, b) => {
    const startA = parseISO(a.start).getTime()
    const startB = parseISO(b.start).getTime()
    if (startA !== startB) return startA - startB

    // If start times are equal, longer blocks first
    return b.duration - a.duration
  })

  // Track which columns are occupied at each time point
  const columns: Array<{ block: Block; end: Date }> = []

  for (const block of sortedBlocks) {
    const start = parseISO(block.start)
    const end = parseISO(block.end)

    // Remove columns that have ended before this block starts
    const activeColumns = columns.filter((col) => col.end > start)

    // Find the first available column
    let column = 0
    const usedColumns = new Set(
      activeColumns.map((col) => {
        const colLayout = layout.get(col.block.id)
        return colLayout?.column ?? 0
      }),
    )

    while (usedColumns.has(column)) {
      column++
    }

    // Place block in this column
    columns.push({ block, end })

    // Calculate total columns for all overlapping blocks
    const overlappingBlocks = sortedBlocks.filter(
      (b) => checkOverlap(block, b) || b.id === block.id,
    )
    const totalColumns = Math.max(
      column + 1,
      ...overlappingBlocks.map((b) => {
        const existingLayout = layout.get(b.id)
        return existingLayout ? existingLayout.column + 1 : 1
      }),
    )

    // Set layout for this block
    layout.set(block.id, { block, column, totalColumns })

    // Update totalColumns for all overlapping blocks
    overlappingBlocks.forEach((b) => {
      const existingLayout = layout.get(b.id)
      if (existingLayout && existingLayout.totalColumns < totalColumns) {
        layout.set(b.id, {
          ...existingLayout,
          totalColumns,
        })
      }
    })
  }

  return layout
}
