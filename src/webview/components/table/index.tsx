import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useEditorState, type Editor } from '@tiptap/react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/tiptap-ui-primitive/dropdown-menu'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { appendTableAxis, getTableContext, selectTableAxis, tableCommand } from './table-selection'
import './table.scss'

function TableIcon() {
  return <svg className="tiptap-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
}

function CellActions({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      merge: editor.can().mergeCells(),
      split: editor.can().splitCell(),
    }),
  })
  return <>
    <DropdownMenuItem disabled={!state.merge} onSelect={() => tableCommand(editor).mergeCells().run()}>Merge cells</DropdownMenuItem>
    <DropdownMenuItem disabled={!state.split} onSelect={() => tableCommand(editor).splitCell().run()}>Split cell</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => tableCommand(editor).toggleHeaderRow().run()}>Toggle header row</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => tableCommand(editor).toggleHeaderColumn().run()}>Toggle header column</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onSelect={() => tableCommand(editor).deleteTable().run()}>Delete table</DropdownMenuItem>
  </>
}

export function TableButton({ editor }: { editor: Editor }) {
  const [size, setSize] = useState({ rows: 3, cols: 3 })
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      active: editor.isActive('table'),
      editable: editor.isEditable,
      insert: !editor.isActive('table') && editor.can().insertTable(),
    }),
  })
  return <DropdownMenu modal={false} onOpenChange={open => { if (open) setSize({ rows: 3, cols: 3 }) }}>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant="ghost" aria-label="Table" tooltip="Table"
        disabled={!state.editable || (!state.active && !state.insert)}
        data-active-state={state.active ? 'on' : 'off'}>
        <TableIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="note-table-menu" align="start">
      {state.active ? <>
        <DropdownMenuItem onSelect={() => tableCommand(editor).addRowBefore().run()}>Insert row above</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => tableCommand(editor).addRowAfter().run()}>Insert row below</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => tableCommand(editor).addColumnBefore().run()}>Insert column left</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => tableCommand(editor).addColumnAfter().run()}>Insert column right</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => tableCommand(editor).deleteRow().run()}>Delete row</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => tableCommand(editor).deleteColumn().run()}>Delete column</DropdownMenuItem>
        <DropdownMenuSeparator />
        <CellActions editor={editor} />
      </> : <>
        <div className="note-table-size" aria-live="polite">{size.rows} × {size.cols}</div>
        <div className="note-table-picker">
          {Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, col) => (
            <DropdownMenuItem key={`${row}-${col}`} className="note-table-picker-cell"
              aria-label={`Insert ${row + 1} × ${col + 1} table`}
              data-selected={row < size.rows && col < size.cols}
              onFocus={() => setSize({ rows: row + 1, cols: col + 1 })}
              onPointerMove={() => setSize({ rows: row + 1, cols: col + 1 })}
              onSelect={() => tableCommand(editor).insertTable({ rows: row + 1, cols: col + 1, withHeaderRow: true }).run()} />
          )))}
        </div>
      </>}
    </DropdownMenuContent>
  </DropdownMenu>
}

function AxisMenu({ editor, axis, style }: { editor: Editor; axis: 'row' | 'column'; style: CSSProperties }) {
  const row = axis === 'row'
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(style)
  return <DropdownMenu modal={false} open={open} onOpenChange={nextOpen => {
    if (nextOpen) {
      // Selecting a whole row/column changes the head cell. Keep its menu still.
      setAnchor(style)
      selectTableAxis(editor, axis)
    }
    setOpen(nextOpen)
  }}>
    <DropdownMenuTrigger asChild>
      <button type="button" className={`note-table-handle note-table-${axis}`} style={open ? anchor : style}
        aria-label={`${row ? 'Row' : 'Column'} actions`} onMouseDown={event => event.preventDefault()}>
        <span aria-hidden="true">{row ? '⋮' : '⋯'}</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="note-table-menu" side={row ? 'left' : 'top'}>
      <DropdownMenuItem onSelect={() => row ? tableCommand(editor).addRowBefore().run() : tableCommand(editor).addColumnBefore().run()}>
        {row ? 'Insert row above' : 'Insert column left'}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => row ? tableCommand(editor).addRowAfter().run() : tableCommand(editor).addColumnAfter().run()}>
        {row ? 'Insert row below' : 'Insert column right'}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => row ? tableCommand(editor).toggleHeaderRow().run() : tableCommand(editor).toggleHeaderColumn().run()}>
        {row ? 'Toggle header row' : 'Toggle header column'}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onSelect={() => row ? tableCommand(editor).deleteRow().run() : tableCommand(editor).deleteColumn().run()}>
        {row ? 'Delete row' : 'Delete column'}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}

type Geometry = { host: HTMLElement; table: DOMRect; cell: DOMRect; clip: DOMRect; left: number; top: number }

/** Keep controls outside the editable DOM and out of serialized HTML. */
export function TableControls({ editor }: { editor: Editor }) {
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  useEffect(() => {
    const host = editor.view.dom.parentElement!
    let frame = 0
    const update = () => {
      frame = 0
      const context = editor.isEditable && getTableContext(editor)
      if (!context) { setGeometry(null); return }
      const cell = editor.view.nodeDOM(context.cellPos)
      if (!(cell instanceof HTMLTableCellElement)) { setGeometry(null); return }
      const table = cell.closest('table')!
      const rect = host.getBoundingClientRect()
      setGeometry({
        host, table: table.getBoundingClientRect(), cell: cell.getBoundingClientRect(),
        clip: table.parentElement!.getBoundingClientRect(),
        left: rect.left - host.scrollLeft, top: rect.top - host.scrollTop,
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    editor.on('transaction', schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    const observer = new ResizeObserver(schedule)
    observer.observe(host)
    observer.observe(editor.view.dom)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      editor.off('transaction', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [editor])

  if (!geometry) return null
  const { host, table, cell, clip, left, top } = geometry
  const visibleLeft = Math.max(table.left, clip.left)
  const visibleRight = Math.min(table.right, clip.right)
  const columnLeft = Math.max(cell.left, visibleLeft)
  const columnRight = Math.min(cell.right, visibleRight)
  return createPortal(<div className="note-table-controls" contentEditable={false}>
    {columnRight > columnLeft && <div className="note-table-active-cell" aria-hidden="true"
      style={{ left: columnLeft - left, top: cell.top - top, width: columnRight - columnLeft, height: cell.height }} />}
    {columnRight > columnLeft && <AxisMenu editor={editor} axis="column" style={{ left: columnLeft - left, top: table.top - top - 24, width: columnRight - columnLeft }} />}
    <AxisMenu editor={editor} axis="row" style={{ left: visibleLeft - left - 24, top: cell.top - top, height: cell.height }} />
    <button type="button" className="note-table-handle note-table-add-row" aria-label="Append row"
      style={{ left: visibleLeft - left, top: table.bottom - top + 4, width: visibleRight - visibleLeft }}
      onMouseDown={event => event.preventDefault()} onClick={() => appendTableAxis(editor, 'row')}>+</button>
    {table.right <= clip.right + 1 && <button type="button" className="note-table-handle note-table-add-column" aria-label="Append column"
      style={{ left: table.right - left + 4, top: table.top - top, height: table.height }}
      onMouseDown={event => event.preventDefault()} onClick={() => appendTableAxis(editor, 'column')}>+</button>}
  </div>, host)
}
