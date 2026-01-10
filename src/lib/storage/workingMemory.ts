import { getDB } from './db'
import type { WorkingMemory } from '../../types'

const DEFAULT_WORKING_MEMORY: WorkingMemory = {
  id: 'default',
  content: '',
  updatedAt: new Date().toISOString(),
}

export async function getWorkingMemory(): Promise<WorkingMemory> {
  const db = await getDB()
  const memory = await db.get('workingMemory', 'default')

  if (!memory) {
    // Initialize with defaults if not found
    await db.put('workingMemory', DEFAULT_WORKING_MEMORY)
    return DEFAULT_WORKING_MEMORY
  }

  return memory
}

export async function updateWorkingMemory(
  content: string,
): Promise<WorkingMemory> {
  const db = await getDB()

  const updated: WorkingMemory = {
    id: 'default',
    content,
    updatedAt: new Date().toISOString(),
  }

  await db.put('workingMemory', updated)
  return updated
}
