import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Node } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'

export type TocHeading = {
  id: string
  pos: number
  text: string
  level: number
}

type TocState = {
  open: boolean
  headings: TocHeading[]
  activeId: string
}

type TocMeta = Partial<Pick<TocState, 'open' | 'activeId'>>

export const tableOfContentsKey = new PluginKey<TocState>('tableOfContents')
const SCROLL_OFFSET = 24

function getHeadings(doc: Node): TocHeading[] {
  const headings: TocHeading[] = []
  doc.descendants((node, pos) => {
    if (node.type.name !== 'heading') return
    headings.push({
      id: `heading-${pos}`,
      pos,
      text: node.textContent.trim() || 'Untitled heading',
      level: node.attrs.level,
    })
  })
  return headings
}

function getScrollContainer(view: EditorView) {
  return view.dom.closest<HTMLElement>('.note-editor-content')
}

function getHeadingElement(view: EditorView, pos: number) {
  const element = view.nodeDOM(pos)
  return element instanceof HTMLElement ? element : null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      toggleTableOfContents: () => ReturnType
      scrollToTocHeading: (pos: number) => ReturnType
    }
  }
}

export const TableOfContentsExtension = Extension.create({
  name: 'tableOfContents',

  addCommands() {
    return {
      toggleTableOfContents: () => ({ tr, state, dispatch }) => {
        const toc = tableOfContentsKey.getState(state)
        if (!toc) return false
        const open = (tr.getMeta(tableOfContentsKey) as TocMeta | undefined)?.open ?? toc.open
        if (dispatch) tr.setMeta(tableOfContentsKey, { open: !open } satisfies TocMeta)
        return true
      },
      scrollToTocHeading: pos => ({ editor, dispatch }) => {
        const container = getScrollContainer(editor.view)
        const heading = tableOfContentsKey.getState(editor.state)?.headings.find(item => item.pos === pos)
        const element = heading && getHeadingElement(editor.view, heading.pos)
        if (!container || !element) return false
        if (dispatch) {
          container.scrollTo({
            top: container.scrollTop + element.getBoundingClientRect().top -
              container.getBoundingClientRect().top - container.clientTop - SCROLL_OFFSET,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          })
        }
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    return [new Plugin<TocState>({
      key: tableOfContentsKey,
      state: {
        init: (_, state) => ({ open: false, headings: getHeadings(state.doc), activeId: '' }),
        apply: (tr, previous) => {
          const meta = tr.getMeta(tableOfContentsKey) as TocMeta | undefined
          if (!tr.docChanged && !meta) return previous
          return {
            ...previous,
            ...meta,
            headings: tr.docChanged ? getHeadings(tr.doc) : previous.headings,
          }
        },
      },
      view: view => {
        let container: HTMLElement | null = null
        let frame = 0
        let destroyed = false
        const resize = new ResizeObserver(() => scheduleUpdate())

        const updateActive = () => {
          if (destroyed) return
          const nextContainer = getScrollContainer(view)
          if (nextContainer !== container) {
            container?.removeEventListener('scroll', scheduleUpdate)
            resize.disconnect()
            container = nextContainer
            if (container) {
              container.addEventListener('scroll', scheduleUpdate, { passive: true })
              resize.observe(container)
              resize.observe(view.dom)
            }
          }
          const state = tableOfContentsKey.getState(view.state)
          if (!container || !state?.open) return
          const top = container.getBoundingClientRect().top + container.clientTop + SCROLL_OFFSET
          let active = state.headings[0]
          for (const heading of state.headings) {
            const element = getHeadingElement(view, heading.pos)
            if (!element) continue
            if (element.getBoundingClientRect().top > top) break
            active = heading
          }
          // The final heading may not have enough content below it to reach the top.
          if (container.scrollHeight > container.clientHeight &&
              container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
            active = state.headings.at(-1) ?? active
          }
          const activeId = active?.id ?? ''
          if (state.activeId !== activeId) {
            view.dispatch(view.state.tr
              .setMeta(tableOfContentsKey, { activeId } satisfies TocMeta)
              .setMeta('addToHistory', false))
          }
        }
        const scheduleUpdate = () => {
          cancelAnimationFrame(frame)
          frame = requestAnimationFrame(updateActive)
        }
        scheduleUpdate()
        return {
          update: (view, previous) => {
            if (tableOfContentsKey.getState(view.state) !== tableOfContentsKey.getState(previous)) scheduleUpdate()
          },
          destroy: () => {
            destroyed = true
            cancelAnimationFrame(frame)
            resize.disconnect()
            container?.removeEventListener('scroll', scheduleUpdate)
          },
        }
      },
    })]
  },
})
