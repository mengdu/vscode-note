import type { EditorLayout } from '../../shared'
import { useEffect, useId, useRef } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import Text from '@tiptap/extension-text'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import HardBreak from '@tiptap/extension-hard-break'
import Heading from '@tiptap/extension-heading'
import Blockquote from '@tiptap/extension-blockquote'
import { CodeBlock } from './extensions/code-block'
import Code from '@tiptap/extension-code'
import {
  ListItem, TaskItem, TaskList,
  OrderedList, BulletList
} from '@tiptap/extension-list'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { Dropcursor } from '@tiptap/extensions'
import { Gapcursor } from '@tiptap/extensions'
import { Selection } from '@tiptap/extensions'
import { Placeholder } from '@tiptap/extensions'
import { UndoRedo } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
// import InvisibleCharacters from '@tiptap/extension-invisible-characters'
// import FindAndReplace from '@tiptap/extension-find-and-replace'
import { TableKit } from '@tiptap/extension-table'
import { TableControls } from '@/components/table'
import { AlignedImage } from './extensions/aligned-image'
import { ImageUploadNode, type UploadFunction } from '@/components/tiptap-node/image-upload-node'
import { MAX_FILE_SIZE } from '@/lib/tiptap-utils'
import { MenuBar } from './MenuBar'
import { formatHTML } from './formatHTML'
import { TableOfContents } from './TableOfContents'
import { TableOfContentsExtension, tableOfContentsKey } from './extensions/table-of-contents'
import './prose-mirror.scss'

function pastedImageFile(event: ClipboardEvent): File | null {
  const clipboard = event.clipboardData
  if (!clipboard) return null

  let image = Array.from(clipboard.files).find(file => file.type.startsWith('image/'))
    ?? Array.from(clipboard.items)
      .find(item => item.kind === 'file' && item.type.startsWith('image/'))
      ?.getAsFile()

  if (!image) {
    const html = clipboard.getData('text/html')
    const src = html && new DOMParser().parseFromString(html, 'text/html')
      .querySelector('img[src^="data:image/"]')?.getAttribute('src')
    const comma = src?.indexOf(',') ?? -1
    if (!src || comma < 0) return null
    const [type, ...parameters] = src.slice(5, comma).split(';')
    if (!type.startsWith('image/')) return null
    try {
      const data = src.slice(comma + 1)
      if (parameters.some(value => value.toLowerCase() === 'base64')) {
        const binary = atob(data)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        image = new File([bytes], 'pasted-image', { type })
      } else {
        image = new File([decodeURIComponent(data)], 'pasted-image', { type })
      }
    } catch {
      return null
    }
  }

  const subtype = image.type.slice('image/'.length).split('+')[0].replace(/[^a-z0-9]/gi, '')
  const extension = subtype.toLowerCase() === 'jpeg' ? 'jpg' : subtype.toLowerCase() || 'png'
  return new File([image], `pasted-${crypto.randomUUID()}.${extension}`, { type: image.type })
}

export function NoteEditor(props: {
  onLayoutChange: (layout: Partial<EditorLayout>) => void
  layout?: EditorLayout
  value: string
  contentType?: 'markdown' | 'html'
  className?: string
  onChange?: (value: string) => void
  /** Resolve image URLs for display without changing the saved source. */
  resolveImageURL?: (src: string) => string
  filename?: string
  uploadImage: UploadFunction
}) {
  const size = props.layout?.size || ''
  const alignment = props.layout?.alignment ?? 'center'
  const maxWidth = size === 'fullscreen' ? 'none'
    : /^[1-9][0-9]*(px)?$/.test(size) ? `${parseInt(size, 10)}px` : '56rem'
  const cache = useRef<string>('')
  const tocId = useId()
  const editor = useEditor({
    extensions: [
      Placeholder.configure({ placeholder: 'Write something …' }),
      UndoRedo,
      Document,
      Paragraph,
      Text,
      HardBreak,
      Heading,
      TableOfContentsExtension,
      Blockquote,
      CodeBlock,
      Code,
      Bold,
      Italic,
      Strike,
      Underline,
      TextStyle,
      Dropcursor,
      Gapcursor,
      Selection,
      TableKit.configure({ table: { resizable: true, cellMinWidth: 64 } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        enableClickSelection: true,
      }),
      AlignedImage.configure({
        allowBase64: true,
        resolveURL: props.resolveImageURL,
        resize: {
          enabled: true,
          directions: ['left', 'right'],
          minWidth: 80,
          minHeight: 1,
          alwaysPreserveAspectRatio: true,
        },
      }),
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: props.uploadImage,
        onError: (err: any) => console.error('Upload failed:', err),
      }),
      ListItem,
      OrderedList,
      BulletList,
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      // InvisibleCharacters,
      Markdown,
    ],
    content: props.value,
    contentType: props.contentType,
    editorProps: {
      handlePaste(view, event) {
        const file = pastedImageFile(event)
        const imageType = view.state.schema.nodes.image
        if (!file || !imageType) {
          const html = event.clipboardData?.getData('text/html')
          if (html && new DOMParser().parseFromString(html, 'text/html')
            .querySelector('img[src^="data:image/"]')) {
            event.preventDefault()
            console.error('Unable to read pasted image')
            return true
          }
          return false
        }

        const { from, to } = view.state.selection
        event.preventDefault()
        void props.uploadImage(file).then(src => {
          if (view.isDestroyed) return
          const size = view.state.doc.content.size
          const start = Math.min(from, size)
          const end = view.state.selection.from === from && view.state.selection.to === to
            ? Math.min(to, size)
            : start
          view.dispatch(view.state.tr.replaceRangeWith(start, end, imageType.create({ src })))
        }).catch(error => console.error('Failed to upload pasted image:', error))
        return true
      },
      handleDOMEvents: {
        click(view, event) {
          const target = event.target instanceof Element ? event.target : null
          const link = target?.closest('a[href]')
          if (!view.editable || !link) return false

          // Let VS Code open links on Cmd/Ctrl + left click.
          if (event.button === 0 && (event.metaKey || event.ctrlKey)) return false

          event.preventDefault()
          // Webview's link listener opens URLs even when default is prevented.
          event.stopPropagation()
          return true
        },
      },
    },
    onUpdate: ({ editor }) => {
      const text = props.contentType === 'markdown' 
        ? editor.getMarkdown()
        : formatHTML(editor.getHTML())
      cache.current = text
      props.onChange?.(text)
    }
  })

  const tocOpen = useEditorState({
    editor,
    selector: ({ editor }) => editor ? tableOfContentsKey.getState(editor.state)?.open ?? false : false,
  })

  useEffect(() => {
    if (!editor) return
    if (cache.current !== props.value) {
      editor.commands.setContent(props.value, {
        emitUpdate: false,
        contentType: props.contentType,
      })
    }
  }, [props.value, props.contentType, editor])
  return (
    <div className={`flex flex-col min-h-0 w-full ${props.className || ''}`}
      style={{ maxWidth, marginLeft: alignment === 'left' ? 0 : 'auto', marginRight: alignment === 'right' ? 0 : 'auto' }}>
      <MenuBar
        className="editor-menubar h-10 shrink-0 flex items-center px-3 sticky top-0 z-1 border-(length:--border-width) border-black/5 dark:border-white/5 rounded-t-xl bg-[#E8E8E8] dark:bg-[#22252C]"
        editor={editor}
        filename={props.filename}
        tocId={tocId}
        fullScreen={size === 'fullscreen'}
        alignment={alignment}
        onFullScreen={() => props.onLayoutChange({ size: 'fullscreen' })}
        onRestoreSize={() => props.onLayoutChange({ size: '' })}
        onAlignmentChange={alignment => props.onLayoutChange({ alignment })}
      />
      <div className="flex-1 flex min-h-0 overflow-hidden border-(length:--border-width) border-black/5 dark:border-white/5 border-t-0 rounded-b-xl">
        <EditorContent
          className="note-editor-content min-w-0 flex-1 overflow-auto dark:bg-black/5"
          editor={editor}
          onKeyDownCapture={(event) => {
            const key = event.key.toLowerCase()
            if (editor && (event.metaKey || event.ctrlKey) && !event.altKey && key === 'z' && !event.nativeEvent.isComposing) {
              // Capture stops the event before Tiptap's keymap, so run its command here.
              // Consume the shortcut even when history is empty.
              event.preventDefault()
              event.stopPropagation()
              if (event.shiftKey) {
                editor.commands.redo()
              } else {
                editor.commands.undo()
              }
              return
            }

            if (key === 'b' && event.metaKey) {
              if (!editor || editor.state.selection.empty) return
              event.preventDefault()
              event.stopPropagation()
              editor.commands.toggleBold()
            }
          }}
        />
        {editor && <TableControls editor={editor} />}
        {tocOpen && editor && (
          <TableOfContents id={tocId} editor={editor} />
        )}
      </div>
    </div>
  )
}
