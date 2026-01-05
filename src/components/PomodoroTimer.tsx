import { useEffect, useState, useRef } from 'react'
import {
  Pause,
  Play,
  RotateCcw,
  Minimize2,
  Maximize2,
  GripVertical,
  X,
  Timer,
} from 'lucide-react'

interface PomodoroTimerProps {
  blockId?: string
  defaultDuration?: number // in minutes
  isOpen?: boolean
  onClose?: () => void
  isRunning: boolean
  timeLeft: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

// Utility function to format time
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Inline timer component for header
interface InlineTimerProps {
  timeLeft: number
  isRunning: boolean
  onClick: () => void
}

export function InlineTimer({
  timeLeft,
  isRunning,
  onClick,
}: InlineTimerProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      aria-label="Open focus timer"
    >
      <Timer
        size={16}
        className={isRunning ? 'text-blue-600' : 'text-slate-600'}
      />
      <span className="text-sm font-medium tabular-nums text-slate-900">
        {formatTime(timeLeft)}
      </span>
      {isRunning && (
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
      )}
    </button>
  )
}

export function PomodoroTimer({
  defaultDuration = 25,
  isOpen = true,
  onClose,
  isRunning,
  timeLeft,
  onStart,
  onPause,
  onReset,
}: PomodoroTimerProps) {
  const [totalTime] = useState(defaultDuration * 60)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('pomodoroPosition')
    return saved
      ? JSON.parse(saved)
      : { x: window.innerWidth - 280, y: window.innerHeight - 400 }
  })

  const timerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroPosition', JSON.stringify(position))
  }, [position])

  // Load minimized state from localStorage
  useEffect(() => {
    const savedMinimized = localStorage.getItem('pomodoroMinimized')
    if (savedMinimized) {
      setIsMinimized(JSON.parse(savedMinimized))
    }
  }, [])

  // Save minimized state
  useEffect(() => {
    localStorage.setItem('pomodoroMinimized', JSON.stringify(isMinimized))
  }, [isMinimized])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop) return // Only drag on desktop

    e.preventDefault() // Prevent text selection

    // Get the current position of the element
    const rect = timerRef.current?.getBoundingClientRect()
    if (!rect) return

    isDragging.current = true
    // Store the offset from the mouse position to the top-left of the element
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    // Add no-transition class to prevent animation during drag
    if (timerRef.current) {
      timerRef.current.style.transition = 'none'
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      e.preventDefault() // Prevent text selection

      const newX = e.clientX - dragOffset.current.x
      const newY = e.clientY - dragOffset.current.y

      // Keep within viewport bounds
      const maxX = window.innerWidth - 260
      const maxY = window.innerHeight - (isMinimized ? 80 : 380)

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        // Re-enable transitions after drag
        if (timerRef.current) {
          timerRef.current.style.transition = ''
        }
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isMinimized])

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  // Don't render if closed
  if (!isOpen) {
    return null
  }

  // Desktop: Floating draggable timer
  if (isDesktop) {
    return (
      <div
        ref={timerRef}
        className="fixed bg-white rounded-lg shadow-lg border border-slate-200 z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '260px',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-between p-3 border-b border-slate-200 cursor-move bg-slate-50 rounded-t-lg select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">
              Focus Timer
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose?.()
              }}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              aria-label="Close timer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Timer content */}
        {!isMinimized && (
          <div className="p-4">
            {/* Compact timer display */}
            <div className="relative mb-4">
              {/* Progress ring - smaller */}
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-200"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                    className={`transition-all duration-1000 ${
                      isRunning ? 'text-blue-500' : 'text-slate-400'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Time text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {timeLeft === 0 ? 'Done!' : isRunning ? 'Focus' : 'Ready'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls - compact */}
            <div className="flex items-center justify-center gap-2">
              {!isRunning ? (
                <button
                  onClick={onStart}
                  disabled={timeLeft === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  aria-label="Start timer"
                >
                  <Play size={16} />
                  Start
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                  aria-label="Pause timer"
                >
                  <Pause size={16} />
                  Pause
                </button>
              )}
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                aria-label="Reset timer"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Minimized state */}
        {isMinimized && (
          <div className="p-3 text-center">
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-slate-500">
              {isRunning ? 'Running' : 'Paused'}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Mobile: Fixed bottom bar
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
      {/* Collapsed state - just a button to expand */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full p-3 flex items-center justify-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Play size={16} className={isRunning ? 'text-blue-500' : ''} />
          <span className="text-sm font-medium tabular-nums">
            {formatTime(timeLeft)}
          </span>
          {isRunning && <span className="text-xs text-blue-500">Running</span>}
        </button>
      ) : (
        <div className="p-3">
          {/* Mobile timer layout - horizontal */}
          <div className="flex items-center justify-between gap-3">
            {/* Compact ring */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-slate-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                  className={`transition-all duration-1000 ${
                    isRunning ? 'text-blue-500' : 'text-slate-400'
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs font-bold text-slate-900 tabular-nums">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-1">
              {!isRunning ? (
                <button
                  onClick={onStart}
                  disabled={timeLeft === 0}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex-1"
                  aria-label="Start timer"
                >
                  <Play size={16} />
                  Start
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                  aria-label="Pause timer"
                >
                  <Pause size={16} />
                  Pause
                </button>
              )}
              <button
                onClick={onReset}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                aria-label="Reset timer"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Collapse and Close buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-2 hover:bg-slate-100 rounded transition-colors"
                aria-label="Collapse timer"
              >
                <Minimize2 size={16} className="text-slate-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded transition-colors"
                aria-label="Close timer"
              >
                <X size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
