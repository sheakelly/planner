export type BlockStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled'

export type BlockType = 'deep-work' | 'admin' | 'meeting' | 'break' | 'other'

export interface Day {
  id: string
  date: string // ISO 8601 date string (YYYY-MM-DD)
  timezone: string // IANA timezone
}

export interface Block {
  id: string
  dayId: string
  title: string
  notes?: string
  start: string // ISO 8601 datetime string
  end: string // ISO 8601 datetime string
  duration: number // minutes
  status: BlockStatus
  tags: Array<string>
  color?: string // hex color
  type: BlockType
}

export interface BlockInput {
  dayId: string
  title: string
  notes?: string
  start: string
  end: string
  status?: BlockStatus
  tags?: Array<string>
  color?: string
  type?: BlockType
}
