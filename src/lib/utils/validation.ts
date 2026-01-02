import { differenceInMinutes, parseISO } from 'date-fns';
import type { Block, BlockInput } from '../../types';

const SLOT_MINUTES = 15;

export function snapToSlot(date: Date): Date {
  const minutes = date.getMinutes();
  const snapped = Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
  const result = new Date(date);
  result.setMinutes(snapped);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

export function validateBlockTimes(start: string, end: string): {
  valid: boolean;
  error?: string;
} {
  const startDate = parseISO(start);
  const endDate = parseISO(end);

  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Invalid start time' };
  }

  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid end time' };
  }

  if (startDate >= endDate) {
    return { valid: false, error: 'Start time must be before end time' };
  }

  return { valid: true };
}

export function calculateDuration(start: string, end: string): number {
  return differenceInMinutes(parseISO(end), parseISO(start));
}

export function checkOverlap(block1: Block, block2: Block): boolean {
  if (block1.dayId !== block2.dayId) return false;
  if (block1.id === block2.id) return false;

  const start1 = parseISO(block1.start);
  const end1 = parseISO(block1.end);
  const start2 = parseISO(block2.start);
  const end2 = parseISO(block2.end);

  return start1 < end2 && start2 < end1;
}

export function findOverlappingBlocks(
  block: Block | BlockInput,
  allBlocks: Array<Block>
): Array<Block> {
  return allBlocks.filter((b) => {
    if ('id' in block && b.id === block.id) return false;
    if (b.dayId !== block.dayId) return false;

    const start1 = parseISO(block.start);
    const end1 = parseISO(block.end);
    const start2 = parseISO(b.start);
    const end2 = parseISO(b.end);

    return start1 < end2 && start2 < end1;
  });
}
