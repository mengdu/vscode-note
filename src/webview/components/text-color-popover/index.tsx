import { useRef, useState } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { Card, CardBody, CardItemGroup } from '@/components/tiptap-ui-primitive/card'
import { ButtonGroup } from '@/components/tiptap-ui-primitive/button-group'
import { Separator } from '@/components/tiptap-ui-primitive/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/tiptap-ui-primitive/popover'
import { useMenuNavigation } from '@/hooks/use-menu-navigation'
import { BanIcon } from '@/components/tiptap-icons/ban-icon'
import { TextColorIcon } from '@/components/tiptap-icons/text-color-icon'
import './text-color-popover.scss'

const TEXT_COLORS = [
  { label: 'Red', value: '#d45d5d' },
  { label: 'Green', value: '#429b70' },
  { label: 'Blue', value: '#4b83d1' },
  { label: 'Yellow', value: '#b89432' },
  { label: 'Amber', value: '#c58a2a' },
  { label: 'Peach', value: '#db8551' },
  { label: 'Rose', value: '#d35e86' },
  { label: 'Lavender', value: '#9873d9' },
  { label: 'Sky', value: '#3989d8' },
  { label: 'Mint', value: '#289b7b' },
]
const COLOR_OPTIONS = [...TEXT_COLORS, { label: 'Default color', value: null }]

// Browsers can serialize hex colors as rgb() when HTML is saved and reloaded.
function toHex(color: string | null): string | null {
  if (!color) return null
  if (/^#[\da-f]{6}$/i.test(color)) return color.toLowerCase()
  if (/^#[\da-f]{3}$/i.test(color)) {
    return `#${color.slice(1).split('').map((digit) => digit.repeat(2)).join('')}`.toLowerCase()
  }
  const rgb = color.match(/^rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)$/i)
  return rgb
    ? `#${rgb.slice(1).map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}`
    : null
}

function TextColorPalette({ color, onSelect }: { color: string | null; onSelect: (color: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: COLOR_OPTIONS,
    orientation: 'both',
    onSelect: ({ value }) => onSelect(value),
    autoSelectFirstItem: false,
  })

  return (
    <Card className="text-color-popover" ref={containerRef} tabIndex={0}>
      <CardBody>
        <CardItemGroup orientation="horizontal" aria-label="Text colors">
          <ButtonGroup>
            {TEXT_COLORS.map(({ label, value }, index) => (
              <ButtonGroup key={value}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={label}
                  tooltip={label}
                  aria-pressed={color === value}
                  data-active-state={color === value ? 'on' : 'off'}
                  tabIndex={selectedIndex === index ? 0 : -1}
                  data-highlighted={selectedIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(value)}
                >
                  <span className="text-color-swatch" style={{ backgroundColor: value }} />
                </Button>
              </ButtonGroup>
            ))}
          </ButtonGroup>
          <Separator />
          <ButtonGroup>
            <Button
              type="button"
              variant="ghost"
              aria-label="Default color"
              tooltip="Default color"
              tabIndex={selectedIndex === TEXT_COLORS.length ? 0 : -1}
              data-highlighted={selectedIndex === TEXT_COLORS.length}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(null)}
            >
              <BanIcon className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  )
}

export function TextColorPopover({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false)
  const returnToEditor = useRef(false)
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      const color = (editor?.getAttributes('textStyle').color as string | undefined) ?? null
      return {
        color,
        hex: toHex(color),
        canSetColor: !!editor?.isEditable && editor.can().setColor('#3b82f6'),
      }
    },
  })

  const applyColor = (color: string | null) => {
    if (!editor?.isEditable) return
    const chain = editor.chain().focus()
    const applied = color ? chain.setColor(color).run() : chain.unsetColor().run()
    if (applied) {
      returnToEditor.current = true
      setOpen(false)
    }
  }

  if (!editor || !state) return null

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      if (nextOpen) {
        returnToEditor.current = false
      }
      setOpen(nextOpen)
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          tabIndex={-1}
          tooltip="Text color"
          aria-label="Text color"
          disabled={!state.canSetColor}
          data-active-state={state.color ? 'on' : 'off'}
          onMouseDown={(event) => event.preventDefault()}
        >
          <TextColorIcon className="tiptap-button-icon" color={state.color ?? 'currentColor'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Text color"
        onCloseAutoFocus={(event) => {
          // Keep the selection focused after applying; Escape still returns to the trigger.
          if (returnToEditor.current) event.preventDefault()
        }}
      >
        <TextColorPalette color={state.hex} onSelect={applyColor} />
      </PopoverContent>
    </Popover>
  )
}
