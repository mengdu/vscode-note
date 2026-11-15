import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { TableButton } from '@/components/table'
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import { ColorHighlightPopover } from '@/components/tiptap-ui/color-highlight-popover'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { LinkPopover } from '@/components/tiptap-ui/link-popover'
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@/components/tiptap-ui-primitive/toolbar'
import { Button } from '@/components/tiptap-ui-primitive/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,

} from '@/components/tiptap-ui-primitive/dropdown-menu'
import { CheckIcon } from '@/components/tiptap-icons/check-icon'
import './menu-bar.scss'
import { EraserIcon } from '@/components/tiptap-icons/eraser-icon'
import { ParagraphIcon } from '@/components/tiptap-icons/paragraph-icon'
import { ExportIcon } from '@/components/tiptap-icons/export-icon'
import { ImageIcon } from '@/components/tiptap-icons/image-icon'
import { TableOfContentsIcon } from '@/components/tiptap-icons/table-of-contents-icon'
import { TextColorPopover } from '@/components/text-color-popover'
import { ListButton } from '@/components/tiptap-ui/list-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { ImageAlignButton } from '@/components/image-align-button'
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button'
import { snapdom } from '@zumer/snapdom'
import { pdf } from '@zumer/snapdom-pdf'
import logo from '../../../media/icon.svg'
import { tableOfContentsKey } from './extensions/table-of-contents'

snapdom.plugins(pdf())

// 25% opacity keeps the highlight soft on both light and dark backgrounds.
const HIGHLIGHT_COLORS = [
  { label: 'Amber', value: 'rgba(250, 204, 21, 0.25)' },
  { label: 'Peach', value: 'rgba(251, 146, 60, 0.25)' },
  { label: 'Rose', value: 'rgba(244, 114, 182, 0.25)' },
  { label: 'Lavender', value: 'rgba(167, 139, 250, 0.25)' },
  { label: 'Sky', value: 'rgba(56, 189, 248, 0.25)' },
  { label: 'Mint', value: 'rgba(52, 211, 153, 0.25)' },
].map(color => ({ ...color, colorValue: color.value, border: color.value }))

export function MenuBar(props: {
  editor: Editor
  className?: string
  filename?: string
  fullScreen: boolean
  alignment: 'left' | 'center' | 'right'
  onFullScreen: () => void
  onRestoreSize: () => void
  onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void
  tocId: string
}) {
  const editorState = useEditorState({
    editor: props.editor,
    selector: ({ editor }) => ({
      canClearFormatting: editor.isEditable && !editor.state.selection.empty,
      canConvertToParagraph: editor.isEditable && editor.can().clearNodes(),
      isImageSelected: editor.isActive('image'),
      tocOpen: tableOfContentsKey.getState(editor.state)?.open ?? false,
    }),
  })
  const editor = props.editor
  if (!editor) return

  const exportNote = async (format: 'pdf' | 'png') => {
    const filename = props.filename?.split(/[\\/]/).at(-1)?.replace(/\.[^.]+$/, '') || 'report'
    const backgroundColor = getComputedStyle(editor.view.dom).getPropertyValue('--vscode-editor-background').trim() || '#ffffff'
    const shot = await snapdom(editor.view.dom)
    if (format === 'pdf') {
      await shot.toPdf({ page: 'a4', margin: 0, download: `${filename}.pdf`, backgroundColor })
    } else {
      await shot.download({ format: 'png', filename, scale: 2, backgroundColor })
    }
  }

  return (
    <div className={props.className}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            tabIndex={-1}
            aria-label="Note menu"
            tooltip="Note menu"
          >
            <img src={logo} alt="" className="size-5 shrink-0" draggable={false} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="note-menu border-(length:--border-width) border-black/5 dark:border-white/5">
          <DropdownMenuLabel>Editor Size</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild onSelect={props.onFullScreen} disabled={props.fullScreen}>
              <Button type="button" variant="ghost" className="w-full" disabled={props.fullScreen}>
                <span className="tiptap-button-text">Full Screen</span>
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onSelect={props.onRestoreSize}>
              <Button type="button" variant="ghost" className="w-full">
                <span className="tiptap-button-text">Restore Default Size</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Editor Alignment</DropdownMenuLabel>
          <DropdownMenuGroup>
            {(['left', 'center', 'right'] as const).map(alignment => (
              <DropdownMenuItem asChild key={alignment} onSelect={() => props.onAlignmentChange(alignment)}>
                <Button type="button" variant="ghost" className="w-full" aria-pressed={props.alignment === alignment}>
                  <span className="tiptap-button-text">{alignment === 'left' ? 'Align Left' : alignment === 'right' ? 'Align Right' : 'Center'}</span>
                  <CheckIcon className={`tiptap-button-icon ml-auto ${props.alignment === alignment ? '' : 'invisible'}`} />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild onSelect={() => exportNote('png')}>
              <Button type="button" variant="ghost" className="w-full">
                <ImageIcon className="tiptap-button-icon" />
                <span className="tiptap-button-text">Export PNG</span>
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onSelect={() => exportNote('pdf')}>
              <Button type="button" variant="ghost" className="w-full">
                <ExportIcon className="tiptap-button-icon" />
                <span className="tiptap-button-text">Export PDF</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Toolbar className="min-w-0 flex-1 gap-2 bg-transparent! border-0!">
        <ToolbarGroup>
          <Button
            type="button"
            variant="ghost"
            tabIndex={-1}
            aria-label="Clear style"
            tooltip="Clear style"
            disabled={!editorState.canClearFormatting}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain()
              .focus()
              .unsetAllMarks()
              .clearNodes()
              .setMeta('preventAutolink', true)
              .run()}
          >
            <EraserIcon className="tiptap-button-icon" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            tabIndex={-1}
            aria-label="Paragraph"
            tooltip="Paragraph"
            disabled={!editorState.canConvertToParagraph}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().clearNodes().run()}
          >
            <ParagraphIcon className="tiptap-button-icon" />
          </Button>
          <HeadingDropdownMenu editor={editor} levels={[1, 2, 3, 4, 5, 6]} />
          <ListButton editor={editor} type="bulletList" />
          <ListButton editor={editor} type="orderedList" />
          <ListButton editor={editor} type="taskList" />
          <BlockquoteButton editor={editor} />
          <CodeBlockButton editor={editor} />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <MarkButton editor={editor} type="bold" />
          <MarkButton editor={editor} type="italic" />
          <MarkButton editor={editor} type="strike" />
          <MarkButton editor={editor} type="underline" />
          <MarkButton editor={editor} type="code" />
          <TextColorPopover editor={editor} />
          <ColorHighlightPopover
            editor={editor}
            colors={HIGHLIGHT_COLORS}
          />
          <LinkPopover
            editor={editor}
            autoOpenOnLinkActive={false}
          />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <ImageUploadButton editor={editor} />
          <TableButton editor={editor} />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          {editorState.isImageSelected ? (
            <>
              <ImageAlignButton editor={editor} align="left" />
              <ImageAlignButton editor={editor} align="center" />
              <ImageAlignButton editor={editor} align="right" />
            </>
          ): (
            <>
              <TextAlignButton editor={editor} align="left" />
              <TextAlignButton editor={editor} align="center" />
              <TextAlignButton editor={editor} align="right" />
              <TextAlignButton editor={editor} align="justify" />
            </>
          )}
        </ToolbarGroup>
      </Toolbar>
      <div className="ml-1.5">
        <Button
          type="button"
          variant="ghost"
          className="shrink-0"
          tooltip="Table of contents"
          aria-label="Table of contents"
          aria-expanded={editorState.tocOpen}
          aria-controls={props.tocId}
          data-active-state={editorState.tocOpen ? 'on' : 'off'}
          onMouseDown={event => event.preventDefault()}
          onClick={() => editor.commands.toggleTableOfContents()}
        >
          <TableOfContentsIcon className="tiptap-button-icon" />
        </Button>
      </div>
    </div>
  )
}
