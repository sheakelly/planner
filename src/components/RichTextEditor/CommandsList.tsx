import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react'
import type { SlashCommand } from './slashCommands'

export type CommandsListProps = {
  items: SlashCommand[]
  command: (item: SlashCommand) => void
}

export type CommandsListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const CommandsList = forwardRef<CommandsListRef, CommandsListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command],
    )

    const upHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
    }, [items.length])

    const downHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev + 1) % items.length)
    }, [items.length])

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex)
    }, [selectItem, selectedIndex])

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="slash-commands-menu">
          <div className="px-3 py-2 text-sm text-slate-500">No results</div>
        </div>
      )
    }

    return (
      <div className="slash-commands-menu">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              onClick={() => selectItem(index)}
              className={`slash-commands-item ${
                index === selectedIndex ? 'is-selected' : ''
              }`}
            >
              <div className="slash-commands-icon">
                <Icon size={18} />
              </div>
              <div className="slash-commands-content">
                <div className="slash-commands-title">{item.title}</div>
                <div className="slash-commands-description">
                  {item.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  },
)

CommandsList.displayName = 'CommandsList'
