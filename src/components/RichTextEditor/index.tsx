import { useCallback, useEffect, useRef } from 'react'
import { EditorContent, useEditor, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import tippy from 'tippy.js'
import type { Instance as TippyInstance } from 'tippy.js'
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
import type { JSONContent } from '@tiptap/core'
import { SlashCommands, filterCommands } from './slashCommands'
import { CommandsList } from './CommandsList'
import type { CommandsListRef } from './CommandsList'

export type RichTextEditorProps = {
  initialContent?: JSONContent | string
  onUpdate?: (content: JSONContent) => void
  placeholder?: string
  className?: string
  editorClassName?: string
  minHeight?: string
  showToolbar?: boolean
  saveStatus?: 'saving' | 'saved' | 'idle'
}

export function RichTextEditor({
  initialContent,
  onUpdate,
  className = '',
  editorClassName = 'working-memory-editor',
  minHeight = '400px',
  showToolbar = true,
  saveStatus = 'idle',
}: RichTextEditorProps) {
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
      SlashCommands.configure({
        suggestion: {
          items: ({ query }: { query: string }) => filterCommands(query),
          render: () => {
            let component: ReactRenderer<CommandsListRef> | null = null
            let popup: TippyInstance[] | null = null

            return {
              onStart: (props) => {
                component = new ReactRenderer(CommandsList, {
                  props,
                  editor: props.editor,
                })

                if (!props.clientRect) {
                  return
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },

              onUpdate(props) {
                component?.updateProps(props)

                if (!props.clientRect) {
                  return
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                })
              },

              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide()
                  return true
                }

                return component?.ref?.onKeyDown(props) ?? false
              },

              onExit() {
                popup?.[0]?.destroy()
                component?.destroy()
              },
            }
          },
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onUpdate?.(currentEditor.getJSON())
    },
    immediatelyRender: false,
  })

  // Initialize editor content when initialContent is provided
  useEffect(() => {
    if (editor && initialContent && !isInitializedRef.current) {
      if (typeof initialContent === 'string') {
        try {
          const content = JSON.parse(initialContent)
          editor.commands.setContent(content)
        } catch {
          // If content is not valid JSON, treat as plain text
          editor.commands.setContent(initialContent)
        }
      } else {
        editor.commands.setContent(initialContent)
      }
      isInitializedRef.current = true
    }
  }, [editor, initialContent])

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

  return (
    <div className={`rounded-lg bg-white shadow ${className}`}>
      {/* Toolbar */}
      {showToolbar && editor && (
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
      <div className="px-6 py-4" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      {saveStatus !== 'idle' && (
        <div className="border-t border-slate-200 px-6 py-3">
          <p className="text-xs text-slate-400">
            {saveStatus === 'saving' ? 'Saving...' : 'Auto-saved'}
          </p>
        </div>
      )}
    </div>
  )
}

export { SlashCommands, filterCommands } from './slashCommands'
export type { SlashCommand } from './slashCommands'
