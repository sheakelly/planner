import { useCallback, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Bold,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
} from 'lucide-react'
import { useUpdateWorkingMemory, useWorkingMemory } from '../lib/hooks'

export const Route = createFileRoute('/working-memory')({
  component: WorkingMemoryPage,
})

function WorkingMemoryPage() {
  const { data: workingMemory, isLoading } = useWorkingMemory()
  const updateWorkingMemory = useUpdateWorkingMemory()
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitializedRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'working-memory-editor',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      // Debounced auto-save
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        const content = JSON.stringify(currentEditor.getJSON())
        updateWorkingMemory.mutate(content)
      }, 2000)
    },
    immediatelyRender: false,
  })

  // Initialize editor content when data loads
  useEffect(() => {
    if (editor && workingMemory?.content && !isInitializedRef.current) {
      try {
        const content = JSON.parse(workingMemory.content)
        editor.commands.setContent(content)
        isInitializedRef.current = true
      } catch {
        // If content is not valid JSON, treat as empty
        isInitializedRef.current = true
      }
    }
  }, [editor, workingMemory])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const ToolbarButton = useCallback(
    ({
      onClick,
      isActive,
      children,
      title,
    }: {
      onClick: () => void
      isActive?: boolean
      children: React.ReactNode
      title: string
    }) => (
      <button
        onClick={onClick}
        title={title}
        className={`rounded p-2 transition-colors ${
          isActive
            ? 'bg-pink-100 text-pink-700'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {children}
      </button>
    ),
    [],
  )

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
            Capture your thoughts, ideas, and tasks
          </p>
        </div>

        {/* Editor Card */}
        <div className="rounded-lg bg-white shadow">
          {/* Toolbar */}
          {editor && (
            <div className="flex flex-wrap gap-1 border-b border-slate-200 px-4 py-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
              >
                <Bold size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
              >
                <Italic size={18} />
              </ToolbarButton>

              <div className="mx-2 w-px bg-slate-200" />

              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
              >
                <Heading1 size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
              >
                <Heading2 size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
              >
                <Heading3 size={18} />
              </ToolbarButton>

              <div className="mx-2 w-px bg-slate-200" />

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
              >
                <List size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Ordered List"
              >
                <ListOrdered size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                isActive={editor.isActive('taskList')}
                title="Task List"
              >
                <CheckSquare size={18} />
              </ToolbarButton>
            </div>
          )}

          {/* Editor Content */}
          <div className="min-h-[500px] px-6 py-4">
            <EditorContent editor={editor} />
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-3">
            <p className="text-xs text-slate-400">
              {updateWorkingMemory.isPending ? 'Saving...' : 'Auto-saved'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
