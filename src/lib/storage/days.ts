import { nanoid } from 'nanoid'
import { getDB } from './db'
import type { Day } from '../../types'

export async function getDayByDate(date: string): Promise<Day | undefined> {
  const db = await getDB()
  const tx = db.transaction('days', 'readonly')
  const index = tx.store.index('date')
  return await index.get(date)
}

export async function getDay(id: string): Promise<Day | undefined> {
  const db = await getDB()
  return await db.get('days', id)
}

export async function createDay(date: string, timezone: string): Promise<Day> {
  const db = await getDB()

  // Check if day already exists
  const existing = await getDayByDate(date)
  if (existing) return existing

  const day: Day = {
    id: nanoid(),
    date,
    timezone,
  }

  await db.put('days', day)
  return day
}

export async function updateDay(
  id: string,
  updates: Partial<Day>,
): Promise<Day> {
  const db = await getDB()
  const existing = await getDay(id)

  if (!existing) {
    throw new Error(`Day with id ${id} not found`)
  }

  const updated = { ...existing, ...updates, id }
  await db.put('days', updated)
  return updated
}

export async function deleteDay(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('days', id)
}

export async function getAllDays(): Promise<Array<Day>> {
  const db = await getDB()
  return await db.getAll('days')
}
