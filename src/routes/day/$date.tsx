import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { addDays, format, parseISO, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useBlocksByDay,
  useCreateDay,
  useDayByDate,
  usePreferences,
} from '../../lib/hooks'
import { useTimer } from '../../lib/context/TimerContext'
import { Timeline } from '../../components/Timeline'
import { PomodoroTimer } from '../../components/PomodoroTimer'

export const Route = createFileRoute('/day/$date')({
  component: DayView,
})

function DayView() {
  const { date } = Route.useParams()
  const navigate = useNavigate()
  const { data: day, isLoading } = useDayByDate(date)
  const { data: blocks = [], isLoading: blocksLoading } = useBlocksByDay(
    day?.id || '',
  )
  const { data: preferences, isLoading: prefsLoading } = usePreferences()
  const createDay = useCreateDay()

  const currentDate = parseISO(date)
  const previousDate = subDays(currentDate, 1)
  const nextDate = addDays(currentDate, 1)

  const navigateToPreviousDay = () => {
    navigate({
      to: '/day/$date',
      params: { date: format(previousDate, 'yyyy-MM-dd') },
    })
  }

  const navigateToNextDay = () => {
    navigate({
      to: '/day/$date',
      params: { date: format(nextDate, 'yyyy-MM-dd') },
    })
  }

  // Get timer state from context
  const {
    isTimerOpen,
    closeTimer,
    isRunning,
    timeLeft,
    startTimer,
    pauseTimer,
    resetTimer,
  } = useTimer()

  // Auto-create day if it doesn't exist
  if (!isLoading && !day && !createDay.isPending) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    createDay.mutate({ date, timezone })
  }

  if (isLoading || blocksLoading || prefsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!day) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Creating day...</div>
      </div>
    )
  }

  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy')
  const startHour = preferences?.startHour ?? 8
  const endHour = preferences?.endHour ?? 18

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={navigateToPreviousDay}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {formattedDate}
              </h1>
              <p className="text-slate-600">Plan your day with time blocks</p>
            </div>

            <button
              onClick={navigateToNextDay}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Next day"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Main content - full width now */}
        <div className="grid grid-cols-1 gap-6">
          {/* Timeline - full width */}
          <div>
            <Timeline
              dayId={day.id}
              date={date}
              blocks={blocks}
              startHour={startHour}
              endHour={endHour}
            />
          </div>

          {/* Keyboard shortcuts help - below timeline on mobile/tablet */}
          <div className="lg:hidden bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Move block up/down</span>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">
                  ↑/↓
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Resize block</span>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">
                  ←/→
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Move by 1 hour</span>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">
                  Shift + ↑/↓
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Delete block</span>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">
                  Del
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Deselect</span>
                <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Pomodoro Timer - rendered outside main content */}
      <PomodoroTimer
        isOpen={isTimerOpen}
        onClose={closeTimer}
        isRunning={isRunning}
        timeLeft={timeLeft}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
      />
    </div>
  )
}
