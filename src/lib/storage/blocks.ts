import { nanoid } from 'nanoid';
import { calculateDuration, validateBlockTimes } from '../utils/validation';
import { getDB } from './db';
import type { Block, BlockInput } from '../../types';

export async function getBlock(id: string): Promise<Block | undefined> {
  const db = await getDB();
  return await db.get('blocks', id);
}

export async function getBlocksByDay(dayId: string): Promise<Array<Block>> {
  const db = await getDB();
  const tx = db.transaction('blocks', 'readonly');
  const index = tx.store.index('dayId');
  return await index.getAll(dayId);
}

export async function getAllBlocks(): Promise<Array<Block>> {
  const db = await getDB();
  return await db.getAll('blocks');
}

export async function createBlock(input: BlockInput): Promise<Block> {
  const validation = validateBlockTimes(input.start, input.end);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const duration = calculateDuration(input.start, input.end);

  const block: Block = {
    id: nanoid(),
    dayId: input.dayId,
    title: input.title,
    notes: input.notes,
    start: input.start,
    end: input.end,
    duration,
    status: input.status || 'planned',
    tags: input.tags || [],
    color: input.color,
    priority: input.priority || 'medium',
  };

  const db = await getDB();
  await db.put('blocks', block);
  return block;
}

export async function updateBlock(
  id: string,
  updates: Partial<BlockInput>
): Promise<Block> {
  const db = await getDB();
  const existing = await getBlock(id);

  if (!existing) {
    throw new Error(`Block with id ${id} not found`);
  }

  const updated = { ...existing, ...updates, id };

  // Validate times if they changed
  if (updates.start || updates.end) {
    const validation = validateBlockTimes(updated.start, updated.end);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    updated.duration = calculateDuration(updated.start, updated.end);
  }

  await db.put('blocks', updated);
  return updated;
}

export async function deleteBlock(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('blocks', id);
}

export async function deleteBlocksByDay(dayId: string): Promise<void> {
  const blocks = await getBlocksByDay(dayId);
  const db = await getDB();
  const tx = db.transaction('blocks', 'readwrite');
  
  await Promise.all(blocks.map((block) => tx.store.delete(block.id)));
  await tx.done;
}
