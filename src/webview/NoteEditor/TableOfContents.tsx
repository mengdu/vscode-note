import { useEffect, useRef, useState } from 'react'
import { useEditorState } from '@tiptap/react'
import { tableOfContentsKey } from './extensions/table-of-contents'
import type { Editor } from '@tiptap/core'
import { TableOfContentsIcon } from '@/components/tiptap-icons/table-of-contents-icon'
import './table-of-contents.scss'

export function TableOfContents({ id, editor }: {
  id: string
  editor: Editor
}) {
  const { headings, activeId } = useEditorState({
    editor,
    selector: ({ editor }) => tableOfContentsKey.getState(editor.state)!,
  })
  const panel = useRef<HTMLElement>(null)
  const [width, setWidth] = useState<number>()
  const drag = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null)

  const resize = (nextWidth: number) => {
    const available = panel.current?.parentElement?.getBoundingClientRect().width ?? 480
    const maximum = Math.max(80, available - 120)
    setWidth(Math.min(maximum, Math.max(Math.min(160, maximum), nextWidth)))
  }

  const navigation = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navigation.current
    const item = nav?.querySelector<HTMLElement>('[aria-current="location"]')
    if (!nav || !item) return
    const navRect = nav.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    if (itemRect.top < navRect.top) nav.scrollTop += itemRect.top - navRect.top
    else if (itemRect.bottom > navRect.bottom) nav.scrollTop += itemRect.bottom - navRect.bottom
  }, [activeId, headings])

  return (
    <aside ref={panel} id={id} className="note-toc" aria-label="Table of contents"
      style={width === undefined ? undefined : { flexBasis: width }}>
      <div
        className="note-toc-resize-handle"
        role="separator"
        aria-label="Resize table of contents"
        aria-orientation="vertical"
        aria-controls={id}
        aria-valuenow={Math.round(width ?? 240)}
        tabIndex={0}
        onPointerDown={event => {
          if (event.button !== 0) return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startWidth: panel.current!.getBoundingClientRect().width,
          }
        }}
        onPointerMove={event => {
          const current = drag.current
          if (current?.pointerId !== event.pointerId) return
          resize(current.startWidth + current.startX - event.clientX)
        }}
        onPointerUp={event => {
          if (drag.current?.pointerId !== event.pointerId) return
          drag.current = null
          event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => { drag.current = null }}
        onLostPointerCapture={() => { drag.current = null }}
        onKeyDown={event => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          resize((panel.current?.getBoundingClientRect().width ?? 240) + (event.key === 'ArrowLeft' ? 16 : -16))
        }}
      />
      <div className="note-toc-title">
        <TableOfContentsIcon className="note-toc-title-icon" aria-hidden="true" />
        <span>Table of contents</span>
      </div>
      <nav ref={navigation} className="note-toc-navigation" aria-label="Headings">
        {headings.length ? (
          <ol>
            {headings.map(heading => (
              <li key={heading.id}>
                <button
                  type="button"
                  className="note-toc-item"
                  style={{ paddingInlineStart: `${12 + (heading.level - 1) * 14}px` }}
                  aria-current={activeId === heading.id ? 'location' : undefined}
                  title={`H${heading.level} · ${heading.text}`}
                  onClick={() => editor.commands.scrollToTocHeading(heading.pos)}
                >
                  <span className="note-toc-level" aria-hidden="true">H{heading.level}</span>
                  <span className="note-toc-text">{heading.text}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : <p className="note-toc-empty">No headings yet</p>}
      </nav>
    </aside>
  )
}
