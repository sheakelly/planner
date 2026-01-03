import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'

interface PomodoroTimerProps {
  blockId?: string
  defaultDuration?: number // in minutes
}

export function PomodoroTimer({
  blockId,
  defaultDuration = 25,
}: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(defaultDuration * 60) // in seconds
  const [totalTime] = useState(defaultDuration * 60)

  useEffect(() => {
    let interval: number | undefined

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            // TODO: Play notification sound or show notification
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, timeLeft])

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(defaultDuration * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Focus Timer{' '}
        {blockId && <span className="text-sm text-slate-500">(Stub)</span>}
      </h3>

      {/* Timer display */}
      <div className="relative mb-6">
        {/* Progress ring */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className={`transition-all duration-1000 ${
                isRunning ? 'text-blue-500' : 'text-slate-400'
              }`}
              strokeLinecap="round"
            />
          </svg>

          {/* Time text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {timeLeft === 0
                  ? 'Complete!'
                  : isRunning
                    ? 'Focusing...'
                    : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={timeLeft === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            aria-label="Start timer"
          >
            <Play size={20} />
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
            aria-label="Pause timer"
          >
            <Pause size={20} />
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw size={20} />
          Reset
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          <strong>Note:</strong> This is a UI stub for the Pomodoro timer. In
          the full implementation, this will:
        </p>
        <ul className="mt-2 text-sm text-slate-600 list-disc list-inside space-y-1">
          <li>Link to specific time blocks</li>
          <li>Show notifications when complete</li>
          <li>Track focus sessions and breaks</li>
          <li>Provide statistics and insights</li>
        </ul>
      </div>
    </div>
  )
}
