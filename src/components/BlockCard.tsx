import { useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Clock, GripVertical } from 'lucide-react'
import type { Block } from '../types'

interface BlockCardProps {
  block: Block
  style?: React.CSSProperties
  isSelected: boolean
  hasOverlap: boolean
  isOutsideHours?: boolean
  isPast?: boolean
  onSelect: () => void
  onDragStart: (block: Block, e: React.MouseEvent) => void
  onResizeStart: (
    block: Block,
    handle: 'top' | 'bottom',
    e: React.MouseEvent,
  ) => void
}

const STATUS_COLORS = {
  planned: 'bg-slate-100 border-slate-300 text-slate-700',
  'in-progress': 'bg-yellow-50 border-yellow-300 text-yellow-900',
  completed: 'bg-green-50 border-green-300 text-green-900',
  cancelled: 'bg-red-50 border-red-300 text-red-900',
}

const TYPE_COLORS = {
  'deep-work': '#7c3aed', // violet-600 (valuable)
  admin: '#78716c', // stone-500 (chore)
  meeting: '#6b7280', // gray-500 (dull)
  break: '#10b981', // emerald-500 (relief)
  other: '#64748b', // slate-500
}

const TYPE_INDICATORS = {
  'deep-work': 'bg-violet-500',
  admin: 'bg-stone-500',
  meeting: 'bg-gray-500',
  break: 'bg-emerald-500',
  other: 'bg-slate-500',
}

export function BlockCard({
  block,
  style,
  isSelected,
  hasOverlap,
  isOutsideHours = false,
  isPast = false,
  onSelect,
  onDragStart,
  onResizeStart,
}: BlockCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isCondensed = block.duration <= 30

  const backgroundColor = TYPE_COLORS[block.type]
  const textColor = getContrastColor(backgroundColor)

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPast) {
      onSelect()
    }
  }

  const formatCompactTime = (start: string, end: string) => {
    return `${format(parseISO(start), 'h:mm')}-${format(parseISO(end), 'h:mm')}`
  }

  return (
    <div
      ref={cardRef}
      data-block
      className={`absolute rounded-lg border-2 transition-all ${
        STATUS_COLORS[block.status]
      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${
        hasOverlap ? 'ring-2 ring-orange-500' : ''
      } ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        ...style,
        backgroundColor,
        borderColor: hasOverlap ? '#f97316' : undefined,
        filter: isPast ? 'grayscale(100%)' : 'none',
        opacity: isPast ? 0.6 : 1,
      }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Time block: ${block.title}${isPast ? ' (read-only)' : ''}`}
      aria-selected={isSelected}
      aria-disabled={isPast}
    >
      {/* Resize handle - top */}
      <div
        className={`absolute top-0 right-0 left-0 ${isPast ? 'cursor-not-allowed' : 'cursor-ns-resize hover:bg-white/20'} flex items-center justify-center ${
          isCondensed ? 'h-1' : 'h-2'
        }`}
        onMouseDown={(e) => {
          e.stopPropagation()
          if (!isPast) {
            onResizeStart(block, 'top', e)
          }
        }}
        role="separator"
        aria-label={isPast ? 'Past block (read-only)' : 'Resize block from top'}
        aria-orientation="horizontal"
      >
        {!isCondensed && !isPast && (
          <div className="h-0.5 w-8 rounded bg-white/40" />
        )}
      </div>

      {/* Content */}
      {isCondensed ? (
        /* Condensed horizontal layout for blocks ≤30min */
        <div
          className="flex h-full items-center gap-2 px-2 py-1"
          style={{ color: textColor }}
        >
          {/* Drag handle */}
          <button
            className={`flex-shrink-0 ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-move hover:bg-white/20'} rounded p-0.5`}
            onMouseDown={(e) => {
              e.stopPropagation()
              if (!isPast) {
                onDragStart(block, e)
              }
            }}
            aria-label={
              isPast ? 'Past block (read-only)' : 'Drag to move block'
            }
            disabled={isPast}
          >
            <GripVertical size={10} />
          </button>

          {/* Title */}
          <div className="min-w-0 flex-1 truncate text-xs font-medium">
            {block.title}
          </div>

          {/* Compact time */}
          <div className="text-xs whitespace-nowrap opacity-75">
            {formatCompactTime(block.start, block.end)}
          </div>
        </div>
      ) : (
        /* Full vertical layout for blocks >30min */
        <div
          className="flex h-full flex-col px-3 py-2"
          style={{ color: textColor }}
        >
          {/* Header with title and time on same line */}
          <div className="mb-1 flex items-start gap-2">
            {/* Drag handle */}
            <button
              className={`flex-shrink-0 ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-move hover:bg-white/20'} -ml-1 rounded p-0.5`}
              onMouseDown={(e) => {
                e.stopPropagation()
                if (!isPast) {
                  onDragStart(block, e)
                }
              }}
              aria-label={
                isPast ? 'Past block (read-only)' : 'Drag to move block'
              }
              disabled={isPast}
            >
              <GripVertical size={14} />
            </button>

            {/* Type indicator */}
            <div
              className={`h-full w-1 flex-shrink-0 rounded-full ${TYPE_INDICATORS[block.type]}`}
              aria-label={`Type: ${block.type}`}
            />

            {/* Title and content */}
            <div className="min-w-0 flex-1">
              {/* Title and time on same line */}
              <div className="mb-0.5 flex items-center gap-2">
                <div className="flex-1 truncate text-sm font-medium">
                  {block.title}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1 text-xs whitespace-nowrap opacity-75">
                  <Clock size={12} />
                  <span>{formatCompactTime(block.start, block.end)}</span>
                </div>
                {hasOverlap && (
                  <AlertTriangle
                    size={12}
                    className="flex-shrink-0 text-orange-500"
                    aria-label="Overlapping with another block"
                  />
                )}
                {isOutsideHours && (
                  <AlertTriangle
                    size={12}
                    className="flex-shrink-0 text-yellow-400"
                    aria-label="Outside configured hours"
                  />
                )}
              </div>
              {block.notes && (
                <div className="mt-0.5 line-clamp-2 text-xs opacity-90">
                  {block.notes}
                </div>
              )}
              {block.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {block.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded bg-white/30 px-1.5 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {block.tags.length > 3 && (
                    <span className="inline-block rounded bg-white/30 px-1.5 py-0.5 text-xs">
                      +{block.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resize handle - bottom */}
      <div
        className={`absolute right-0 bottom-0 left-0 ${isPast ? 'cursor-not-allowed' : 'cursor-ns-resize hover:bg-white/20'} flex items-center justify-center ${
          isCondensed ? 'h-1' : 'h-2'
        }`}
        onMouseDown={(e) => {
          e.stopPropagation()
          if (!isPast) {
            onResizeStart(block, 'bottom', e)
          }
        }}
        role="separator"
        aria-label={
          isPast ? 'Past block (read-only)' : 'Resize block from bottom'
        }
        aria-orientation="horizontal"
      >
        {!isCondensed && !isPast && (
          <div className="h-0.5 w-8 rounded bg-white/40" />
        )}
      </div>
    </div>
  )
}

// Helper function to determine text color based on background
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#1e293b' : '#ffffff'
}
