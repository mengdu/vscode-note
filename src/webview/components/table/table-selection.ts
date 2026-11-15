import type { Editor } from '@tiptap/core'
import { CellSelection, TableMap } from '@tiptap/pm/tables'

export function tableCommand(editor: Editor) {
  // A deferred focus() can steal focus from a menu opened on the next frame.
  editor.view.focus()
  return editor.chain()
}

export function getTableContext(editor: Editor) {
  const { selection } = editor.state
  const $cell = selection instanceof CellSelection ? selection.$headCell : selection.$from
  for (let depth = $cell.depth; depth > 0; depth--) {
    if ($cell.node(depth).type.spec.tableRole !== 'table') continue
    const node = $cell.node(depth)
    const start = $cell.start(depth)
    const map = TableMap.get(node)
    const cellPos = selection instanceof CellSelection ? $cell.pos : $cell.before(depth + 2)
    return { node, start, map, cellPos }
  }
  return null
}

export function selectTableAxis(editor: Editor, axis: 'row' | 'column') {
  const context = getTableContext(editor)
  if (!context) return false
  const $cell = editor.state.doc.resolve(context.cellPos)
  const selection = axis === 'row'
    ? CellSelection.rowSelection($cell)
    : CellSelection.colSelection($cell)
  editor.view.dispatch(editor.state.tr.setSelection(selection))
  return true
}

export function appendTableAxis(editor: Editor, axis: 'row' | 'column') {
  const context = getTableContext(editor)
  if (!context) return false
  const { start, map } = context
  // Use the last cell so the strip always appends at the table edge.
  const cell = start + map.map[map.map.length - 1]
  const chain = tableCommand(editor).setCellSelection({ anchorCell: cell })
  return axis === 'row' ? chain.addRowAfter().run() : chain.addColumnAfter().run()
}
