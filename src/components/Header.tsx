import { Link } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'
import { InlineTimer } from './PomodoroTimer'
import { useTimer } from '../lib/context/TimerContext'

export default function Header() {
  const { isTimerOpen, timeLeft, isRunning, openTimer } = useTimer()

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
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
