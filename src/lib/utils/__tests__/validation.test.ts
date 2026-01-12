import { describe, expect, it } from 'vitest'
import {
  calculateDuration,
  checkOverlap,
  findOverlappingBlocks,
  formatDuration,
  snapToQuarterHour,
  snapToSlot,
  validateBlockTimes,
} from '../validation'
import type { Block } from '../../../types'

describe('snapToSlot', () => {
  it('should round to nearest 15-minute slot', () => {
    const date1 = new Date('2024-01-01T10:07:00')
    const snapped1 = snapToSlot(date1)
    expect(snapped1.getMinutes()).toBe(0)

    const date2 = new Date('2024-01-01T10:08:00')
    const snapped2 = snapToSlot(date2)
    expect(snapped2.getMinutes()).toBe(15)

    const date3 = new Date('2024-01-01T10:22:00')
    const snapped3 = snapToSlot(date3)
    expect(snapped3.getMinutes()).toBe(15)

    const date4 = new Date('2024-01-01T10:23:00')
    const snapped4 = snapToSlot(date4)
    expect(snapped4.getMinutes()).toBe(30)
  })

  it('should set seconds and milliseconds to zero', () => {
    const date = new Date('2024-01-01T10:15:30.500')
    const snapped = snapToSlot(date)
    expect(snapped.getSeconds()).toBe(0)
    expect(snapped.getMilliseconds()).toBe(0)
  })

  it('should handle exact slot times', () => {
    const date = new Date('2024-01-01T10:15:00')
    const snapped = snapToSlot(date)
    expect(snapped.getMinutes()).toBe(15)
  })
})

describe('snapToQuarterHour', () => {
  it('should round to nearest 15-minute slot for minute values', () => {
    expect(snapToQuarterHour(0)).toBe(0)
    expect(snapToQuarterHour(7)).toBe(0)
    expect(snapToQuarterHour(8)).toBe(15)
    expect(snapToQuarterHour(15)).toBe(15)
    expect(snapToQuarterHour(22)).toBe(15)
    expect(snapToQuarterHour(23)).toBe(30)
    expect(snapToQuarterHour(30)).toBe(30)
    expect(snapToQuarterHour(45)).toBe(45)
    expect(snapToQuarterHour(52)).toBe(45)
    expect(snapToQuarterHour(53)).toBe(60)
  })

  it('should handle negative values', () => {
    // Note: Math.round can return -0 for small negative values
    expect(snapToQuarterHour(-7)).toBe(-0)
    expect(snapToQuarterHour(-8)).toBe(-15)
    expect(snapToQuarterHour(-15)).toBe(-15)
  })

  it('should handle large values (hours)', () => {
    expect(snapToQuarterHour(60)).toBe(60) // 1 hour
    expect(snapToQuarterHour(67)).toBe(60)
    expect(snapToQuarterHour(68)).toBe(75)
    expect(snapToQuarterHour(120)).toBe(120) // 2 hours
  })
})

describe('validateBlockTimes', () => {
  it('should return valid for correct time ranges', () => {
    const result = validateBlockTimes(
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject when start is after end', () => {
    const result = validateBlockTimes(
      '2024-01-01T11:00:00',
      '2024-01-01T10:00:00',
    )
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Start time must be before end time')
  })

  it('should reject when start equals end', () => {
    const result = validateBlockTimes(
      '2024-01-01T10:00:00',
      '2024-01-01T10:00:00',
    )
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Start time must be before end time')
  })

  it('should reject invalid start time', () => {
    const result = validateBlockTimes('invalid-date', '2024-01-01T10:00:00')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid start time')
  })

  it('should reject invalid end time', () => {
    const result = validateBlockTimes('2024-01-01T10:00:00', 'invalid-date')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid end time')
  })
})

describe('calculateDuration', () => {
  it('should calculate duration in minutes', () => {
    const duration = calculateDuration(
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    expect(duration).toBe(60)
  })

  it('should handle 15-minute intervals', () => {
    const duration = calculateDuration(
      '2024-01-01T10:00:00',
      '2024-01-01T10:15:00',
    )
    expect(duration).toBe(15)
  })

  it('should handle multi-hour durations', () => {
    const duration = calculateDuration(
      '2024-01-01T09:00:00',
      '2024-01-01T17:00:00',
    )
    expect(duration).toBe(480)
  })

  it('should handle durations across days', () => {
    const duration = calculateDuration(
      '2024-01-01T23:00:00',
      '2024-01-02T01:00:00',
    )
    expect(duration).toBe(120)
  })
})

describe('checkOverlap', () => {
  const createBlock = (
    id: string,
    dayId: string,
    start: string,
    end: string,
  ): Block => ({
    id,
    dayId,
    title: 'Test Block',
    start,
    end,
    duration: 60,
    status: 'planned',
    tags: [],
    type: 'other',
  })

  it('should detect overlapping blocks', () => {
    const block1 = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    const block2 = createBlock(
      '2',
      'day1',
      '2024-01-01T10:30:00',
      '2024-01-01T11:30:00',
    )
    expect(checkOverlap(block1, block2)).toBe(true)
  })

  it('should detect when first block contains second', () => {
    const block1 = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T12:00:00',
    )
    const block2 = createBlock(
      '2',
      'day1',
      '2024-01-01T10:30:00',
      '2024-01-01T11:00:00',
    )
    expect(checkOverlap(block1, block2)).toBe(true)
  })

  it('should not detect overlap for adjacent blocks', () => {
    const block1 = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    const block2 = createBlock(
      '2',
      'day1',
      '2024-01-01T11:00:00',
      '2024-01-01T12:00:00',
    )
    expect(checkOverlap(block1, block2)).toBe(false)
  })

  it('should not detect overlap for separate blocks', () => {
    const block1 = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    const block2 = createBlock(
      '2',
      'day1',
      '2024-01-01T14:00:00',
      '2024-01-01T15:00:00',
    )
    expect(checkOverlap(block1, block2)).toBe(false)
  })

  it('should not detect overlap for different days', () => {
    const block1 = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    const block2 = createBlock(
      '2',
      'day2',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    expect(checkOverlap(block1, block2)).toBe(false)
  })

  it('should not detect overlap for same block', () => {
    const block1 = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    expect(checkOverlap(block1, block1)).toBe(false)
  })
})

describe('findOverlappingBlocks', () => {
  const createBlock = (
    id: string,
    dayId: string,
    start: string,
    end: string,
  ): Block => ({
    id,
    dayId,
    title: 'Test Block',
    start,
    end,
    duration: 60,
    status: 'planned',
    tags: [],
    type: 'other',
  })

  it('should find all overlapping blocks', () => {
    const newBlock = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T12:00:00',
    )
    const existingBlocks: Array<Block> = [
      createBlock('2', 'day1', '2024-01-01T09:00:00', '2024-01-01T10:30:00'),
      createBlock('3', 'day1', '2024-01-01T11:00:00', '2024-01-01T13:00:00'),
      createBlock('4', 'day1', '2024-01-01T14:00:00', '2024-01-01T15:00:00'),
    ]

    const overlapping = findOverlappingBlocks(newBlock, existingBlocks)
    expect(overlapping).toHaveLength(2)
    expect(overlapping.map((b) => b.id)).toEqual(['2', '3'])
  })

  it('should exclude the same block when checking existing block', () => {
    const block1 = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    const existingBlocks: Array<Block> = [
      block1,
      createBlock('2', 'day1', '2024-01-01T10:30:00', '2024-01-01T11:30:00'),
    ]

    const overlapping = findOverlappingBlocks(block1, existingBlocks)
    expect(overlapping).toHaveLength(1)
    expect(overlapping[0].id).toBe('2')
  })

  it('should only find blocks on the same day', () => {
    const newBlock = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    const existingBlocks: Array<Block> = [
      createBlock('2', 'day2', '2024-01-01T10:00:00', '2024-01-01T11:00:00'),
      createBlock('3', 'day1', '2024-01-01T10:30:00', '2024-01-01T11:30:00'),
    ]

    const overlapping = findOverlappingBlocks(newBlock, existingBlocks)
    expect(overlapping).toHaveLength(1)
    expect(overlapping[0].id).toBe('3')
  })

  it('should return empty array when no overlaps exist', () => {
    const newBlock = createBlock(
      '1',
      'day1',
      '2024-01-01T10:00:00',
      '2024-01-01T11:00:00',
    )
    const existingBlocks: Array<Block> = [
      createBlock('2', 'day1', '2024-01-01T09:00:00', '2024-01-01T10:00:00'),
      createBlock('3', 'day1', '2024-01-01T11:00:00', '2024-01-01T12:00:00'),
    ]

    const overlapping = findOverlappingBlocks(newBlock, existingBlocks)
    expect(overlapping).toHaveLength(0)
  })

  it('should work with BlockInput (new blocks without id)', () => {
    const newBlockInput = {
      dayId: 'day1',
      title: 'New Block',
      start: '2024-01-01T10:00:00',
      end: '2024-01-01T11:00:00',
    }
    const existingBlocks: Array<Block> = [
      createBlock('2', 'day1', '2024-01-01T10:30:00', '2024-01-01T11:30:00'),
    ]

    const overlapping = findOverlappingBlocks(newBlockInput, existingBlocks)
    expect(overlapping).toHaveLength(1)
    expect(overlapping[0].id).toBe('2')
  })
})

describe('formatDuration', () => {
  it('should return "0m" for zero minutes', () => {
    expect(formatDuration(0)).toBe('0m')
  })

  it('should return "0m" for negative minutes', () => {
    expect(formatDuration(-15)).toBe('0m')
  })

  it('should format minutes only when less than 1 hour', () => {
    expect(formatDuration(15)).toBe('15m')
    expect(formatDuration(30)).toBe('30m')
    expect(formatDuration(45)).toBe('45m')
  })

  it('should format hours only when minutes are exactly divisible by 60', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(180)).toBe('3h')
  })

  it('should format hours and minutes when there is a remainder', () => {
    expect(formatDuration(75)).toBe('1h 15m')
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(150)).toBe('2h 30m')
    expect(formatDuration(195)).toBe('3h 15m')
  })

  it('should handle large durations', () => {
    expect(formatDuration(480)).toBe('8h')
    expect(formatDuration(510)).toBe('8h 30m')
  })
})
