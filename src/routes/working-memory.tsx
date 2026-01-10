import { useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RichTextEditor } from '../components/RichTextEditor'
import { useUpdateWorkingMemory, useWorkingMemory } from '../lib/hooks'
import type { JSONContent } from '@tiptap/core'

export const Route = createFileRoute('/working-memory')({
  component: WorkingMemoryPage,
})

function WorkingMemoryPage() {
  const { data: workingMemory, isLoading } = useWorkingMemory()
  const updateWorkingMemory = useUpdateWorkingMemory()
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleUpdate = (content: JSONContent) => {
    // Debounced auto-save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      updateWorkingMemory.mutate(JSON.stringify(content))
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Working Memory</h1>
          <p className="mt-1 text-slate-600">
            Capture your thoughts, ideas, and tasks. Type{' '}
            <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-sm">
              /
            </kbd>{' '}
            for commands.
          </p>
        </div>

        {/* Editor */}
        <RichTextEditor
          initialContent={workingMemory?.content}
          onUpdate={handleUpdate}
          minHeight="500px"
          saveStatus={updateWorkingMemory.isPending ? 'saving' : 'saved'}
        />
      </div>
    </div>
  )
}
