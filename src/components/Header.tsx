import { Link } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold text-slate-900">
              Planner
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
