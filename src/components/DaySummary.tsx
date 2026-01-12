import { useMemo } from 'react'
import { formatDuration } from '../lib/utils'
import type { Block, BlockType } from '../types'

interface DaySummaryProps {
  blocks: Array<Block>
}

const TYPE_COLORS: Record<BlockType, string> = {
  'deep-work': '#7c3aed', // violet-600
  admin: '#78716c', // stone-500
  meeting: '#6b7280', // gray-500
  break: '#10b981', // emerald-500
  other: '#64748b', // slate-500
}

const TYPE_LABELS: Record<BlockType, string> = {
  'deep-work': 'Deep Work',
  admin: 'Admin',
  meeting: 'Meeting',
  break: 'Break',
  other: 'Other',
}

// Order in which types should be displayed
const TYPE_ORDER: Array<BlockType> = [
  'deep-work',
  'admin',
  'meeting',
  'break',
  'other',
]

type TypeTotals = Partial<Record<BlockType, number>>

export function DaySummary({ blocks }: DaySummaryProps) {
  const { typeTotals, grandTotal } = useMemo(() => {
    const totals: TypeTotals = {}
    let total = 0

    for (const block of blocks) {
      totals[block.type] = (totals[block.type] || 0) + block.duration
      total += block.duration
    }

    return { typeTotals: totals, grandTotal: total }
  }, [blocks])

  const hasBlocks = blocks.length > 0

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Day Summary</h3>

      {hasBlocks ? (
        <>
          <div className="space-y-3">
            {TYPE_ORDER.filter((type) => typeTotals[type]).map((type) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-slate-700">
                    {TYPE_LABELS[type]}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {formatDuration(typeTotals[type]!)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Total</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatDuration(grandTotal)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">No blocks yet</p>
      )}
    </div>
  )
}
