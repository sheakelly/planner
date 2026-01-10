import { Link } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'
import { useTimer } from '../lib/context/TimerContext'
import { InlineTimer } from './PomodoroTimer'

export default function Header() {
  const { isTimerOpen, timeLeft, isRunning, openTimer } = useTimer()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold text-slate-900">
              Planner
            </span>
          </Link>

          {/* Show inline timer when closed */}
          {!isTimerOpen && (
            <InlineTimer
              timeLeft={timeLeft}
              isRunning={isRunning}
              onClick={openTimer}
            />
          )}
        </div>
      </div>
    </header>
  )
}
