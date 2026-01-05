import { createContext, useContext, ReactNode } from 'react'
import { useTimerState } from '../hooks/useTimerState'

type TimerContextType = ReturnType<typeof useTimerState>

const TimerContext = createContext<TimerContextType | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const timerState = useTimerState()
  return (
    <TimerContext.Provider value={timerState}>{children}</TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider')
  }
  return context
}
