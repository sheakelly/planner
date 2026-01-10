import { useCallback, useEffect, useState } from 'react'

export function useTimerState(defaultDuration = 25) {
  const [isTimerOpen, setIsTimerOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('pomodoroOpen')
    return saved ? JSON.parse(saved) : true
  })

  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(defaultDuration * 60)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pomodoroOpen', JSON.stringify(isTimerOpen))
    }
  }, [isTimerOpen])

  // Timer countdown effect
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

  const startTimer = useCallback(() => setIsRunning(true), [])
  const pauseTimer = useCallback(() => setIsRunning(false), [])
  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(defaultDuration * 60)
  }, [defaultDuration])

  return {
    isTimerOpen,
    openTimer: () => setIsTimerOpen(true),
    closeTimer: () => setIsTimerOpen(false),
    isRunning,
    timeLeft,
    startTimer,
    pauseTimer,
    resetTimer,
  }
}
