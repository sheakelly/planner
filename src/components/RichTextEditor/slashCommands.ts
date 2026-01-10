import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { Editor, Range } from '@tiptap/core'
import type { SuggestionOptions } from '@tiptap/suggestion'
import {
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  Quote,
  Code,
  Minus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SlashCommand = {
  title: string
  description: string
  icon: LucideIcon
  command: (props: { editor: Editor; range: Range }) => void
  aliases?: string[]
}

export const slashCommands: SlashCommand[] = [
  {
    title: 'Text',
    description: 'Plain text paragraph',
    icon: Text,
    aliases: ['p', 'paragraph'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    aliases: ['h1'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    aliases: ['h2'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    aliases: ['h3'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: 'Todo List',
    description: 'Track tasks with checkboxes',
    icon: CheckSquare,
    aliases: ['task', 'checkbox', 'checklist'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list of items',
    icon: List,
    aliases: ['ul', 'unordered'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list of items',
    icon: ListOrdered,
    aliases: ['ol', 'ordered'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Quote',
    description: 'Blockquote for citations',
    icon: Quote,
    aliases: ['blockquote'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Code snippet with syntax',
    icon: Code,
    aliases: ['codeblock', 'pre'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: Minus,
    aliases: ['hr', 'line', 'separator'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
]

export type SlashCommandsOptions = {
  suggestion: Omit<SuggestionOptions<SlashCommand>, 'editor'>
}

export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: SlashCommand
        }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export function filterCommands(query: string): SlashCommand[] {
  const lowerQuery = query.toLowerCase()

  return slashCommands.filter((command) => {
    const titleMatch = command.title.toLowerCase().includes(lowerQuery)
    const aliasMatch = command.aliases?.some((alias) =>
      alias.toLowerCase().includes(lowerQuery),
    )
    return titleMatch || aliasMatch
  })
}
