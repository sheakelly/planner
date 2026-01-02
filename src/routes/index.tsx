import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Daily Time Block Planner
        </h1>
        <p className="text-slate-600">
          Plan your day with visual time blocks
        </p>
      </div>
    </div>
  )
}
