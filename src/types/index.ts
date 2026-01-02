export type BlockStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

export type BlockPriority = 'low' | 'medium' | 'high';

export interface Day {
  id: string;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  timezone: string; // IANA timezone
}

export interface Block {
  id: string;
  dayId: string;
  title: string;
  notes?: string;
  start: string; // ISO 8601 datetime string
  end: string; // ISO 8601 datetime string
  duration: number; // minutes
  status: BlockStatus;
  tags: Array<string>;
  color?: string; // hex color
  priority: BlockPriority;
}

export interface BlockInput {
  dayId: string;
  title: string;
  notes?: string;
  start: string;
  end: string;
  status?: BlockStatus;
  tags?: Array<string>;
  color?: string;
  priority?: BlockPriority;
}
