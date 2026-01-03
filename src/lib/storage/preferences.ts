import { getDB } from './db'
import type { UserPreferences } from '../../types'

const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'default',
  startHour: 8, // 8 AM
  endHour: 18, // 6 PM
}

export async function getPreferences(): Promise<UserPreferences> {
  const db = await getDB()
  const prefs = await db.get('preferences', 'default')

  if (!prefs) {
    // Initialize with defaults if not found
    await db.put('preferences', DEFAULT_PREFERENCES)
    return DEFAULT_PREFERENCES
  }

  return prefs
}

export async function updatePreferences(
  updates: Partial<Omit<UserPreferences, 'id'>>,
): Promise<UserPreferences> {
  const db = await getDB()
  const current = await getPreferences()

  const updated: UserPreferences = {
    ...current,
    ...updates,
  }

  // Validation
  if (updated.startHour < 0 || updated.startHour > 23) {
    throw new Error('Start hour must be between 0 and 23')
  }
  if (updated.endHour < 0 || updated.endHour > 23) {
    throw new Error('End hour must be between 0 and 23')
  }
  if (updated.startHour >= updated.endHour) {
    throw new Error('Start hour must be before end hour')
  }

  await db.put('preferences', updated)
  return updated
}
