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
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Timeline Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded"
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Hour
              </label>
              <select
                value={localStartHour}
                onChange={(e) => {
                  setLocalStartHour(parseInt(e.target.value))
                  setError(null)
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Hour
              </label>
              <select
                value={localEndHour}
                onChange={(e) => {
                  setLocalEndHour(parseInt(e.target.value))
                  setError(null)
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm font-medium text-blue-900">Preview</p>
              <p className="text-sm text-blue-700 mt-1">
                Your timeline will show {formatHour(localStartHour)} to{' '}
                {formatHour(localEndHour)} ({localEndHour - localStartHour}{' '}
                hours)
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Save
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
