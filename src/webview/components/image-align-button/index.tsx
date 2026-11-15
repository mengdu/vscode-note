import { forwardRef } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import type { ImageAlignment } from '@/NoteEditor/extensions/aligned-image'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { Button, type ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { AlignLeftIcon } from '@/components/tiptap-icons/align-left-icon'
import { AlignCenterIcon } from '@/components/tiptap-icons/align-center-icon'
import { AlignRightIcon } from '@/components/tiptap-icons/align-right-icon'

const alignments = {
  left: { label: 'Align image left', Icon: AlignLeftIcon },
  center: { label: 'Center image', Icon: AlignCenterIcon },
  right: { label: 'Align image right', Icon: AlignRightIcon },
}

export interface ImageAlignButtonProps extends Omit<ButtonProps, 'type'> {
  editor?: Editor | null
  align: ImageAlignment
  hideWhenUnavailable?: boolean
  onAligned?: () => void
  text?: string
}

export const ImageAlignButton = forwardRef<HTMLButtonElement, ImageAlignButtonProps>(
  ({
    editor: providedEditor,
    align,
    hideWhenUnavailable = false,
    onAligned,
    text,
    disabled,
    onMouseDown,
    onClick,
    children,
    ...buttonProps
  }, ref) => {
    const { editor } = useTiptapEditor(providedEditor)
    const state = useEditorState({
      editor,
      selector: ({ editor }) => ({
        canAlign: !!editor?.isEditable && !!editor.commands.setImageAlign && editor.can().setImageAlign(align),
        isActive: !!editor?.isActive('image', { align }),
      }),
    })

    if (hideWhenUnavailable && !state?.canAlign) return null

    const { label, Icon } = alignments[align]
    const isDisabled = disabled || !state?.canAlign

    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        tabIndex={-1}
        aria-label={label}
        tooltip={label}
        {...buttonProps}
        disabled={isDisabled}
        aria-pressed={state?.isActive ?? false}
        data-active-state={state?.isActive ? 'on' : 'off'}
        data-disabled={isDisabled}
        onMouseDown={event => {
          onMouseDown?.(event)
          // Keep the image node selected while interacting with the toolbar.
          if (event.button === 0) event.preventDefault()
        }}
        onClick={event => {
          onClick?.(event)
          if (event.defaultPrevented || isDisabled || !editor) return
          if (editor.chain().focus().setImageAlign(align).run()) onAligned?.()
        }}
      >
        {children ?? <>
          <Icon className="tiptap-button-icon" />
          {text && <span className="tiptap-button-text">{text}</span>}
        </>}
      </Button>
    )
  }
)

ImageAlignButton.displayName = 'ImageAlignButton'
