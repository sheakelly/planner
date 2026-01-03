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
  'deep-work': '#9333ea', // purple-600
  admin: '#3b82f6', // blue-500
  meeting: '#22c55e', // green-500
  break: '#f97316', // orange-500
  other: '#64748b', // slate-500
}

const TYPE_INDICATORS = {
  'deep-work': 'bg-purple-500',
  admin: 'bg-blue-500',
  meeting: 'bg-green-500',
  break: 'bg-orange-500',
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
      className={`relative mx-2 rounded-lg border-2 transition-all ${
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
        className={`absolute top-0 left-0 right-0 ${isPast ? 'cursor-not-allowed' : 'cursor-ns-resize hover:bg-white/20'} flex items-center justify-center ${
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
          <div className="w-8 h-0.5 bg-white/40 rounded" />
        )}
      </div>

      {/* Content */}
      {isCondensed ? (
        /* Condensed horizontal layout for blocks ≤30min */
        <div
          className="px-2 py-1 h-full flex items-center gap-2"
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
          <div className="flex-1 min-w-0 text-xs font-medium truncate">
            {block.title}
          </div>

          {/* Compact time */}
          <div className="text-xs opacity-75 whitespace-nowrap">
            {formatCompactTime(block.start, block.end)}
          </div>
        </div>
      ) : (
        /* Full vertical layout for blocks >30min */
        <div
          className="px-3 py-2 h-full flex flex-col"
          style={{ color: textColor }}
        >
          {/* Header with title and time on same line */}
          <div className="flex items-start gap-2 mb-1">
            {/* Drag handle */}
            <button
              className={`flex-shrink-0 ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-move hover:bg-white/20'} rounded p-0.5 -ml-1`}
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
              className={`flex-shrink-0 w-1 h-full rounded-full ${TYPE_INDICATORS[block.type]}`}
              aria-label={`Type: ${block.type}`}
            />

            {/* Title and content */}
            <div className="flex-1 min-w-0">
              {/* Title and time on same line */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="font-medium text-sm truncate flex-1">
                  {block.title}
                </div>
                <div className="flex items-center gap-1 text-xs opacity-75 whitespace-nowrap flex-shrink-0">
                  <Clock size={12} />
                  <span>{formatCompactTime(block.start, block.end)}</span>
                </div>
                {hasOverlap && (
                  <AlertTriangle
                    size={12}
                    className="text-orange-500 flex-shrink-0"
                    aria-label="Overlapping with another block"
                  />
                )}
                {isOutsideHours && (
                  <AlertTriangle
                    size={12}
                    className="text-yellow-400 flex-shrink-0"
                    aria-label="Outside configured hours"
                  />
                )}
              </div>
              {block.notes && (
                <div className="text-xs opacity-90 line-clamp-2 mt-0.5">
                  {block.notes}
                </div>
              )}
              {block.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {block.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-1.5 py-0.5 bg-white/30 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {block.tags.length > 3 && (
                    <span className="inline-block px-1.5 py-0.5 bg-white/30 rounded text-xs">
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
        className={`absolute bottom-0 left-0 right-0 ${isPast ? 'cursor-not-allowed' : 'cursor-ns-resize hover:bg-white/20'} flex items-center justify-center ${
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
          <div className="w-8 h-0.5 bg-white/40 rounded" />
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
