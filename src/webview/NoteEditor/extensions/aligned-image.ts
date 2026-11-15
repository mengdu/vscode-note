import Image, { type ImageOptions } from '@tiptap/extension-image'
import { NodeSelection } from '@tiptap/pm/state'
import { DOMSerializer, type Node as ProseMirrorNode } from '@tiptap/pm/model'

export interface AlignedImageOptions extends ImageOptions {
  /** Convert the display URL only; the document and exports retain the original src. */
  resolveURL?: (src: string) => string
}

export type ImageAlignment = 'left' | 'center' | 'right'

function isImageAlignment(value: unknown): value is ImageAlignment {
  return value === 'left' || value === 'center' || value === 'right'
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageAlignment: {
      setImageAlign: (align: ImageAlignment) => ReturnType
    }
  }
}

export const AlignedImage = Image.extend<AlignedImageOptions>({
  addOptions() {
    return {
      ...this.parent!(),
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'left',
        parseHTML: element => {
          const align = element.getAttribute('data-align') ?? element.style.textAlign
          return isImageAlignment(align) ? align : 'left'
        },
        renderHTML: attributes => {
          const align = isImageAlignment(attributes.align) ? attributes.align : 'left'
          return {
            'data-align': align,
            // Inline margins also preserve alignment in exported HTML.
            style: `display: block; margin-left: ${align === 'left' ? '0' : 'auto'}; margin-right: ${align === 'right' ? '0' : 'auto'}`,
          }
        },
      },
    }
  },

  addNodeView() {
    const createNodeView = this.parent?.()

    return props => {
      // Pass a display-only node to the parent so even its initial image request
      // uses the resolved URL. Never write the converted src into editor state.
      const displayNode = (node: ProseMirrorNode) => {
        if (!this.options.resolveURL) return node
        return node.type.create(
        { ...node.attrs, src: typeof node.attrs.src === 'string' ? this.options.resolveURL(node.attrs.src) : node.attrs.src },
        node.content,
        node.marks,
        )
      }
      const node = displayNode(props.node)
      const serializer = DOMSerializer.fromSchema(props.editor.schema)
      const nodeView = createNodeView
        ? createNodeView({ ...props, node, HTMLAttributes: { ...props.HTMLAttributes, src: node.attrs.src } })
        : {
            dom: serializer.serializeNode(node) as HTMLElement,
            update(updatedNode: ProseMirrorNode) {
              if (updatedNode.type !== node.type) return false
              const next = serializer.serializeNode(updatedNode) as HTMLElement
              const dom = this.dom as HTMLElement
              for (const attribute of Array.from(dom.attributes)) dom.removeAttribute(attribute.name)
              for (const attribute of Array.from(next.attributes)) dom.setAttribute(attribute.name, attribute.value)
              return true
            },
          }
      const container = nodeView.dom as HTMLElement
      const image = container.matches('img') ? container : container.querySelector('img')
      if (!image) return nodeView
      const resizable = container.hasAttribute('data-resize-container')

      container.classList.add('note-image')
      const syncLayout = (node: ProseMirrorNode) => {
        if (!resizable) return
        container.dataset.align = isImageAlignment(node.attrs.align) ? node.attrs.align : 'left'
        // The parent handles src/alt/title; keep the resize wrapper aligned and
        // reflect saved dimensions when content is reloaded or changed externally.
        const width = Number(node.attrs.width)
        image.style.width = width > 0 ? `${width}px` : ''
        image.style.height = 'auto'
      }

      syncLayout(props.node)
      const update = nodeView.update?.bind(nodeView)
      nodeView.update = (node, decorations, innerDecorations) => {
        if (!update?.(displayNode(node), decorations, innerDecorations)) return false
        syncLayout(node)
        return true
      }

      return nodeView
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign: align => ({ editor, state, commands }) => {
        const { selection } = state
        if (
          !editor.isEditable ||
          !isImageAlignment(align) ||
          !(selection instanceof NodeSelection) ||
          selection.node.type !== this.type
        ) return false

        return commands.updateAttributes(this.name, { align })
      },
    }
  },
})
