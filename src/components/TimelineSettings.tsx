import { useState } from 'react'
import { X } from 'lucide-react'

interface TimelineSettingsProps {
  startHour: number
  endHour: number
  onSave: (startHour: number, endHour: number) => void
  onClose: () => void
}

export function TimelineSettings({
  startHour,
  endHour,
  onSave,
  onClose,
}: TimelineSettingsProps) {
  const [localStartHour, setLocalStartHour] = useState(startHour)
  const [localEndHour, setLocalEndHour] = useState(endHour)
  const [error, setError] = useState<string | null>(null)

  // Generate hour options (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const handleSave = () => {
    // Validate
    if (localEndHour <= localStartHour) {
      setError('End hour must be after start hour')
      return
    }

    if (localEndHour - localStartHour < 2) {
      setError('Range must be at least 2 hours')
      return
    }

    setError(null)
    onSave(localStartHour, localEndHour)
    onClose()
  }

  const handleReset = () => {
    setLocalStartHour(8)
    setLocalEndHour(18)
    setError(null)
  }

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:00 ${period}`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Timeline Settings
            </h2>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Configure the visible hour range for your daily timeline. Blocks
              outside this range will still be saved but will show a warning
              indicator.
            </p>

            {/* Start Hour */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Start Hour
              </label>
              <select
                value={localStartHour}
                onChange={(e) => {
                  setLocalStartHour(parseInt(e.target.value))
                  setError(null)
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>

            {/* End Hour */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                End Hour
              </label>
              <select
                value={localEndHour}
                onChange={(e) => {
                  setLocalEndHour(parseInt(e.target.value))
                  setError(null)
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-900">Preview</p>
              <p className="mt-1 text-sm text-blue-700">
                Your timeline will show {formatHour(localStartHour)} to{' '}
                {formatHour(localEndHour)} ({localEndHour - localStartHour}{' '}
                hours)
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleReset}
              className="rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="rounded-md bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
