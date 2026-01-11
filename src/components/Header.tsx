import { Link, useRouterState } from '@tanstack/react-router'
import { Brain, Calendar, Clock } from 'lucide-react'
import { useTimer } from '../lib/context/TimerContext'
import { InlineTimer } from './PomodoroTimer'

export default function Header() {
  const { isTimerOpen, timeLeft, isRunning, openTimer } = useTimer()
  const routerState = useRouterState()
  const isWorkingMemoryRoute =
    routerState.location.pathname === '/working-memory'

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

          <div className="flex items-center gap-2">
            {/* Navigation tabs */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                  !isWorkingMemoryRoute
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Clock size={20} className="text-blue-600" />
                <span className="hidden sm:inline">Timeline</span>
              </Link>
              <Link
                to="/working-memory"
                className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                  isWorkingMemoryRoute
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Brain size={20} className="text-pink-500" />
                <span className="hidden sm:inline">Working Memory</span>
              </Link>
            </nav>

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
      </div>
    </header>
  )
}
