import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO, setHours, setMinutes } from 'date-fns'
import { Check, Edit2, Settings, Trash2, X } from 'lucide-react'
import {
  calculateBlockLayout,
  checkOverlap,
  snapToQuarterHour,
} from '../lib/utils'
import {
  useCreateBlock,
  useDeleteBlock,
  useUpdateBlock,
  useUpdatePreferences,
} from '../lib/hooks'
import { BlockCard } from './BlockCard'
import { Button } from './Button'
import { DaySummary } from './DaySummary'
import { TimelineSettings } from './TimelineSettings'
import type { Block, BlockStatus, BlockType } from '../types'

interface TimelineProps {
  dayId: string
  date: string
  blocks: Array<Block>
  startHour: number
  endHour: number
}

const SLOT_HEIGHT = 60 // 60px per hour, 15px per 15-min slot
const QUARTER_SLOTS = 4 // 4 quarter-hour slots per hour

const TYPE_LABELS = {
  'deep-work': 'Deep Work',
  admin: 'Admin',
  meeting: 'Meeting',
  break: 'Break',
  other: 'Other',
}

export function Timeline({
  dayId,
  date,
  blocks,
  startHour,
  endHour,
}: TimelineProps) {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null)
  const [dragOriginalStart, setDragOriginalStart] = useState<string>('')
  const [dragOriginalEnd, setDragOriginalEnd] = useState<string>('')
  const [resizeHandle, setResizeHandle] = useState<'top' | 'bottom' | null>(
    null,
  )
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Calculate visible hours based on configured range
  const HOURS = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  )

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    notes: '',
    tags: '',
    status: 'planned' as BlockStatus,
    type: 'other' as BlockType,
  })

  const createBlock = useCreateBlock()
  const updateBlock = useUpdateBlock()
  const deleteBlock = useDeleteBlock()
  const updatePreferences = useUpdatePreferences()

  // Calculate block layout (columns for overlapping blocks)
  const blockLayout = useMemo(() => calculateBlockLayout(blocks), [blocks])

  // Calculate block position and height based on time
  const getBlockStyle = (block: Block) => {
    const start = parseISO(block.start)
    const end = parseISO(block.end)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const durationMinutes = endMinutes - startMinutes

    // Offset from startHour instead of midnight
    const offsetMinutes = startHour * 60
    const top = ((startMinutes - offsetMinutes) / 60) * SLOT_HEIGHT
    const height = (durationMinutes / 60) * SLOT_HEIGHT

    // Get layout info for this block
    const layout = blockLayout.get(block.id)

    if (layout && layout.totalColumns > 1) {
      // Calculate width and left position for overlapping blocks
      const widthPercent = 100 / layout.totalColumns
      const leftPercent = widthPercent * layout.column

      return {
        top,
        height,
        width: `${widthPercent}%`,
        left: `${leftPercent}%`,
      }
    }

    return { top, height, width: '100%', left: '0%' }
  }

  // Check for overlapping blocks
  const getOverlappingBlocks = (block: Block) => {
    return blocks.filter((b) => b.id !== block.id && checkOverlap(block, b))
  }

  // Check if block is outside configured hours
  const isBlockOutsideHours = (block: Block): boolean => {
    const start = parseISO(block.start)
    const end = parseISO(block.end)
    const startHourNum = start.getHours()
    const endHourNum = end.getHours()
    const endMinutes = end.getMinutes()

    // Block starts before configured start hour
    if (startHourNum < startHour) return true

    // Block ends after configured end hour
    if (endHourNum > endHour || (endHourNum === endHour && endMinutes > 0)) {
      return true
    }

    return false
  }

  // Check if block is in the past (read-only)
  const isBlockInPast = (block: Block): boolean => {
    const now = currentTime
    const dayDate = parseISO(date)

    // Compare dates
    const isToday =
      now.getFullYear() === dayDate.getFullYear() &&
      now.getMonth() === dayDate.getMonth() &&
      now.getDate() === dayDate.getDate()

    const isPastDay =
      dayDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // All blocks on past days are dimmed
    if (isPastDay) {
      return true
    }

    // For today, check if block end time has passed
    if (isToday) {
      const blockEnd = parseISO(block.end)
      return now > blockEnd
    }

    // Future days - not past
    return false
  }

  // Handle timeline click to create new block
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging || isResizing || selectedBlock) return
      if ((e.target as HTMLElement).closest('[data-block]')) return

      const rect = timelineRef.current?.getBoundingClientRect()
      if (!rect) return

      const y = e.clientY - rect.top
      const clickedMinutes = (y / SLOT_HEIGHT) * 60
      // Floor to the start of the 15-minute slot (clicking 9:00-9:14 creates block at 9:00)
      const snappedMinutes = Math.floor(clickedMinutes / 15) * 15

      // Add startHour offset to get absolute minutes from midnight
      const absoluteMinutes = snappedMinutes + startHour * 60

      const startTime = setMinutes(
        setHours(parseISO(date), Math.floor(absoluteMinutes / 60)),
        absoluteMinutes % 60,
      )
      const endTime = setMinutes(
        setHours(parseISO(date), Math.floor((absoluteMinutes + 60) / 60)),
        (absoluteMinutes + 60) % 60,
      )

      createBlock.mutate({
        dayId,
        title: 'New Block',
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        status: 'planned',
        tags: [],
        type: 'other',
      })
    },
    [
      dayId,
      date,
      createBlock,
      isDragging,
      isResizing,
      selectedBlock,
      startHour,
    ],
  )

  // Handle drag start
  const handleDragStart = useCallback((block: Block, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    setDraggedBlock(block)
    setDragStartY(e.clientY)
    setDragOriginalStart(block.start)
    setDragOriginalEnd(block.end)
  }, [])

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedBlock || !timelineRef.current) return

      // Calculate total delta from original drag start position
      const deltaY = e.clientY - dragStartY
      const deltaMinutes = Math.round((deltaY / SLOT_HEIGHT) * 60)
      const snappedDeltaMinutes = snapToQuarterHour(deltaMinutes)

      // Calculate new times based on ORIGINAL block position + snapped delta
      const originalStart = parseISO(dragOriginalStart)
      const originalEnd = parseISO(dragOriginalEnd)
      const newStart = new Date(
        originalStart.getTime() + snappedDeltaMinutes * 60000,
      )
      const newEnd = new Date(
        originalEnd.getTime() + snappedDeltaMinutes * 60000,
      )

      // Ensure within day bounds
      if (
        newStart.getHours() < 0 ||
        newEnd.getHours() >= 24 ||
        (newEnd.getHours() === 23 && newEnd.getMinutes() > 45)
      ) {
        return
      }

      // Check if position actually changed from current state
      if (
        newStart.toISOString() === draggedBlock.start &&
        newEnd.toISOString() === draggedBlock.end
      ) {
        return // No change, avoid unnecessary update
      }

      updateBlock.mutate({
        id: draggedBlock.id,
        updates: {
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        },
      })

      // Update local state (but keep dragStartY and originals fixed)
      setDraggedBlock({
        ...draggedBlock,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      })
    },
    [
      isDragging,
      draggedBlock,
      dragStartY,
      dragOriginalStart,
      dragOriginalEnd,
      updateBlock,
    ],
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setDraggedBlock(null)
    setDragStartY(0)
    setDragOriginalStart('')
    setDragOriginalEnd('')
  }, [])

  // Handle resize start
  const handleResizeStart = useCallback(
    (block: Block, handle: 'top' | 'bottom', e: React.MouseEvent) => {
      e.stopPropagation()
      setIsResizing(true)
      setDraggedBlock(block)
      setResizeHandle(handle)
      setDragStartY(e.clientY)
      setDragOriginalStart(block.start)
      setDragOriginalEnd(block.end)
    },
    [],
  )

  // Handle resize move
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !draggedBlock || !resizeHandle) return

      // Calculate total delta from original drag start position
      const deltaY = e.clientY - dragStartY
      const deltaMinutes = Math.round((deltaY / SLOT_HEIGHT) * 60)
      const snappedDeltaMinutes = snapToQuarterHour(deltaMinutes)

      // Calculate new times based on ORIGINAL block position + snapped delta
      const originalStart = parseISO(dragOriginalStart)
      const originalEnd = parseISO(dragOriginalEnd)

      let newStart = originalStart
      let newEnd = originalEnd

      if (resizeHandle === 'top') {
        newStart = new Date(
          originalStart.getTime() + snappedDeltaMinutes * 60000,
        )
        // Ensure minimum 15 minutes
        if (newStart >= originalEnd) return
      } else {
        newEnd = new Date(originalEnd.getTime() + snappedDeltaMinutes * 60000)
        // Ensure minimum 15 minutes
        if (newEnd <= originalStart) return
      }

      // Ensure within day bounds
      if (
        newStart.getHours() < 0 ||
        newEnd.getHours() >= 24 ||
        (newEnd.getHours() === 23 && newEnd.getMinutes() > 45)
      ) {
        return
      }

      // Check if position actually changed from current state
      if (
        newStart.toISOString() === draggedBlock.start &&
        newEnd.toISOString() === draggedBlock.end
      ) {
        return // No change, avoid unnecessary update
      }

      updateBlock.mutate({
        id: draggedBlock.id,
        updates: {
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        },
      })

      // Update local state (but keep dragStartY and originals fixed)
      setDraggedBlock({
        ...draggedBlock,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
      })
    },
    [
      isResizing,
      draggedBlock,
      resizeHandle,
      dragStartY,
      dragOriginalStart,
      dragOriginalEnd,
      updateBlock,
    ],
  )

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setDraggedBlock(null)
    setResizeHandle(null)
    setDragStartY(0)
    setDragOriginalStart('')
    setDragOriginalEnd('')
  }, [])

  // Set up mouse event listeners for drag and resize
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  // Handle keyboard navigation for selected block
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedBlock || editingBlock) return

      const moveMinutes = e.shiftKey ? 60 : 15 // 1 hour with shift, 15 min without
      const start = parseISO(selectedBlock.start)
      const end = parseISO(selectedBlock.end)

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault()
          const newStart = new Date(start.getTime() - moveMinutes * 60000)
          const newEnd = new Date(end.getTime() - moveMinutes * 60000)
          if (newStart.getHours() >= 0) {
            updateBlock.mutate({
              id: selectedBlock.id,
              updates: {
                start: newStart.toISOString(),
                end: newEnd.toISOString(),
              },
            })
          }
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          const newStart = new Date(start.getTime() + moveMinutes * 60000)
          const newEnd = new Date(end.getTime() + moveMinutes * 60000)
          if (
            newEnd.getHours() < 24 ||
            (newEnd.getHours() === 23 && newEnd.getMinutes() <= 45)
          ) {
            updateBlock.mutate({
              id: selectedBlock.id,
              updates: {
                start: newStart.toISOString(),
                end: newEnd.toISOString(),
              },
            })
          }
          break
        }
        case 'ArrowLeft': {
          // Shrink duration
          e.preventDefault()
          const newEnd = new Date(end.getTime() - moveMinutes * 60000)
          if (newEnd > start) {
            updateBlock.mutate({
              id: selectedBlock.id,
              updates: {
                end: newEnd.toISOString(),
              },
            })
          }
          break
        }
        case 'ArrowRight': {
          // Extend duration
          e.preventDefault()
          const newEnd = new Date(end.getTime() + moveMinutes * 60000)
          if (
            newEnd.getHours() < 24 ||
            (newEnd.getHours() === 23 && newEnd.getMinutes() <= 45)
          ) {
            updateBlock.mutate({
              id: selectedBlock.id,
              updates: {
                end: newEnd.toISOString(),
              },
            })
          }
          break
        }
        case 'Delete':
        case 'Backspace': {
          e.preventDefault()
          if (confirm('Delete this block?')) {
            deleteBlock.mutate(selectedBlock.id)
            setSelectedBlock(null)
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          setSelectedBlock(null)
          break
        }
        case 'e':
        case 'Enter': {
          e.preventDefault()
          handleStartEdit(selectedBlock)
          break
        }
      }
    },
    [selectedBlock, editingBlock, updateBlock, deleteBlock],
  )

  // Set up keyboard event listener
  useEffect(() => {
    if (selectedBlock && !editingBlock) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedBlock, editingBlock, handleKeyDown])

  // Update current time every minute
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date())
    updateCurrentTime() // Initial update

    // Update every minute
    const intervalId = setInterval(updateCurrentTime, 60000)

    return () => clearInterval(intervalId)
  }, [])

  // Edit handlers
  const handleStartEdit = (block: Block) => {
    setEditingBlock(block)
    setSelectedBlock(null) // Close details when editing
    setEditFormData({
      title: block.title,
      notes: block.notes || '',
      tags: block.tags.join(', '),
      status: block.status,
      type: block.type,
    })
  }

  const handleSaveEdit = () => {
    if (!editingBlock) return

    const tags = editFormData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    updateBlock.mutate({
      id: editingBlock.id,
      updates: {
        title: editFormData.title,
        notes: editFormData.notes || undefined,
        tags,
        status: editFormData.status,
        type: editFormData.type,
      },
    })

    setEditingBlock(null)
  }

  const handleCancelEdit = () => {
    setEditingBlock(null)
  }

  const handleDeleteBlock = (blockId: string) => {
    if (confirm('Delete this block?')) {
      deleteBlock.mutate(blockId)
      setSelectedBlock(null)
    }
  }

  const handleCloseSidebar = () => {
    setSelectedBlock(null)
    setEditingBlock(null)
  }

  const handleSaveSettings = (newStartHour: number, newEndHour: number) => {
    updatePreferences.mutate({
      startHour: newStartHour,
      endHour: newEndHour,
    })
  }

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    const now = currentTime
    const dayDate = parseISO(date)

    // Check if current time is on the same day as the timeline
    if (
      now.getFullYear() !== dayDate.getFullYear() ||
      now.getMonth() !== dayDate.getMonth() ||
      now.getDate() !== dayDate.getDate()
    ) {
      return null // Don't show indicator if not today
    }

    const minutes = now.getHours() * 60 + now.getMinutes()
    const offsetMinutes = startHour * 60
    const endMinutes = endHour * 60

    // Only show indicator if current time is within visible range
    if (minutes < offsetMinutes || minutes > endMinutes) {
      return null
    }

    const top = ((minutes - offsetMinutes) / 60) * SLOT_HEIGHT
    return top
  }

  const currentTimePosition = getCurrentTimePosition()

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Timeline */}
      <div className="flex-1">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm text-slate-600">
              Showing {format(setHours(new Date(), startHour), 'h a')} -{' '}
              {format(setHours(new Date(), endHour), 'h a')}
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-200"
              aria-label="Timeline settings"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>

          <div className="flex">
            {/* Time labels */}
            <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex h-[60px] items-start justify-end border-b border-slate-200 pt-1 pr-2 text-xs text-slate-500"
                >
                  {format(setHours(new Date(), hour), 'h a')}
                </div>
              ))}
            </div>

            {/* Timeline grid */}
            <div
              ref={timelineRef}
              className="relative flex-1 cursor-pointer bg-white"
              onClick={handleTimelineClick}
              role="grid"
              aria-label="Daily timeline"
            >
              {/* Grid lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative h-[60px] border-b border-slate-200"
                >
                  {Array.from({ length: QUARTER_SLOTS }, (_, i) => (
                    <div
                      key={i}
                      className="absolute h-[15px] w-full border-b border-slate-100"
                      style={{ top: `${i * 15}px` }}
                    />
                  ))}
                </div>
              ))}

              {/* Blocks */}
              {blocks.map((block) => {
                const style = getBlockStyle(block)
                const overlaps = getOverlappingBlocks(block)
                const hasOverlap = overlaps.length > 0
                const isOutsideHours = isBlockOutsideHours(block)
                const isPast = isBlockInPast(block)

                return (
                  <BlockCard
                    key={block.id}
                    block={block}
                    style={{
                      position: 'absolute',
                      top: `${style.top}px`,
                      height: `${style.height}px`,
                      left: style.left,
                      width: style.width,
                    }}
                    isSelected={selectedBlock?.id === block.id}
                    hasOverlap={hasOverlap}
                    isOutsideHours={isOutsideHours}
                    isPast={isPast}
                    onSelect={() => setSelectedBlock(block)}
                    onDragStart={handleDragStart}
                    onResizeStart={handleResizeStart}
                  />
                )
              })}

              {/* Current time indicator */}
              {currentTimePosition !== null && (
                <div
                  className="pointer-events-none absolute right-0 left-0 z-20"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  {/* Circle indicator */}
                  <div className="absolute left-0 -mt-1.5 -ml-1.5 h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-md" />
                  {/* Line */}
                  <div className="h-0.5 bg-red-500 shadow-sm" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-600">
          <p>Click on the timeline to create a new block</p>
          <p className="mt-1">
            Drag blocks to move them, or drag the top/bottom edges to resize
          </p>
        </div>
      </div>

      {/* Mobile Sidebar - Details or Edit Form (mobile/tablet only) */}
      {(selectedBlock || editingBlock) && (
        <>
          {/* Mobile overlay backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={handleCloseSidebar}
          />

          {/* Mobile sidebar content */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-lg bg-white p-6 shadow-lg lg:hidden">
            {editingBlock ? (
              // Edit Form
              <>
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Edit Block
                  </h3>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded p-1 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="Block title"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Notes
                    </label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          notes: e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="Notes (optional)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={editFormData.tags}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          tags: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="Tags (comma separated)"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value as BlockStatus,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Type
                    </label>
                    <select
                      value={editFormData.type}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          type: e.target.value as BlockType,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="deep-work">Deep Work</option>
                      <option value="admin">Admin</option>
                      <option value="meeting">Meeting</option>
                      <option value="break">Break</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    icon={<Check size={18} />}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              // Details View
              selectedBlock && (
                <>
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Block Details
                    </h3>
                    <button
                      onClick={handleCloseSidebar}
                      className="rounded p-1 hover:bg-slate-100"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Title
                      </label>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedBlock.title}
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Time
                      </label>
                      <p className="text-sm text-slate-600">
                        {format(parseISO(selectedBlock.start), 'h:mm a')} -{' '}
                        {format(parseISO(selectedBlock.end), 'h:mm a')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedBlock.duration} minutes
                      </p>
                    </div>

                    {selectedBlock.notes && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Notes
                        </label>
                        <p className="text-sm whitespace-pre-wrap text-slate-600">
                          {selectedBlock.notes}
                        </p>
                      </div>
                    )}

                    {selectedBlock.tags.length > 0 && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedBlock.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Status
                      </label>
                      <span
                        className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                          selectedBlock.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : selectedBlock.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-700'
                              : selectedBlock.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {selectedBlock.status}
                      </span>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Type
                      </label>
                      <span
                        className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                          selectedBlock.type === 'deep-work'
                            ? 'bg-violet-100 text-violet-700'
                            : selectedBlock.type === 'admin'
                              ? 'bg-stone-100 text-stone-700'
                              : selectedBlock.type === 'meeting'
                                ? 'bg-gray-100 text-gray-700'
                                : selectedBlock.type === 'break'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {TYPE_LABELS[selectedBlock.type]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button
                      onClick={() => handleStartEdit(selectedBlock)}
                      icon={<Edit2 size={18} />}
                      className="w-1/2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteBlock(selectedBlock.id)}
                      icon={<Trash2 size={18} />}
                      className="w-1/2"
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )
            )}
          </div>
        </>
      )}

      {/* Right Sidebar - Day Summary always visible, Block Details/Edit Form below when selected */}
      <div className="hidden w-80 flex-col gap-4 lg:flex">
        <DaySummary blocks={blocks} />

        {/* Edit Form - shown below Day Summary when editing a block */}
        {editingBlock && (
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Edit Block
              </h3>
              <button
                onClick={handleCancelEdit}
                className="rounded p-1 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      title: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Block title"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tags
                </label>
                <input
                  type="text"
                  value={editFormData.tags}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      tags: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Tags (comma separated)"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as BlockStatus,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  value={editFormData.type}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      type: e.target.value as BlockType,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="deep-work">Deep Work</option>
                  <option value="admin">Admin</option>
                  <option value="meeting">Meeting</option>
                  <option value="break">Break</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                onClick={handleSaveEdit}
                icon={<Check size={18} />}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Block Details - shown below Day Summary when a block is selected */}
        {selectedBlock && !editingBlock && (
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Block Details
              </h3>
              <button
                onClick={handleCloseSidebar}
                className="rounded p-1 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <p className="text-sm font-medium text-slate-900">
                  {selectedBlock.title}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Time
                </label>
                <p className="text-sm text-slate-600">
                  {format(parseISO(selectedBlock.start), 'h:mm a')} -{' '}
                  {format(parseISO(selectedBlock.end), 'h:mm a')}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedBlock.duration} minutes
                </p>
              </div>

              {selectedBlock.notes && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  <p className="text-sm whitespace-pre-wrap text-slate-600">
                    {selectedBlock.notes}
                  </p>
                </div>
              )}

              {selectedBlock.tags.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedBlock.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <span
                  className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                    selectedBlock.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : selectedBlock.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : selectedBlock.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedBlock.status}
                </span>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <span
                  className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                    selectedBlock.type === 'deep-work'
                      ? 'bg-violet-100 text-violet-700'
                      : selectedBlock.type === 'admin'
                        ? 'bg-stone-100 text-stone-700'
                        : selectedBlock.type === 'meeting'
                          ? 'bg-gray-100 text-gray-700'
                          : selectedBlock.type === 'break'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {TYPE_LABELS[selectedBlock.type]}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => handleStartEdit(selectedBlock)}
                icon={<Edit2 size={18} />}
                className="w-1/2"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteBlock(selectedBlock.id)}
                icon={<Trash2 size={18} />}
                className="w-1/2"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <TimelineSettings
          startHour={startHour}
          endHour={endHour}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
