import { useEffect, useRef, useState } from 'react'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { all, createLowlight } from 'lowlight'

const lowlight = createLowlight(all)
const languages = [...lowlight.listLanguages(), 'html']
  .filter(language => language !== 'plaintext')
  .sort()

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Some VS Code webviews do not grant Clipboard API access.
    const selection = window.getSelection()
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : []
    const active = document.activeElement as HTMLElement | null
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0'
    document.body.append(textarea)
    try {
      textarea.select()
      if (!document.execCommand('copy')) throw new Error('Copy failed')
    } finally {
      textarea.remove()
      active?.focus({ preventScroll: true })
      selection?.removeAllRanges()
      ranges.forEach(range => selection?.addRange(range))
    }
  }
}

function CodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const language = node.attrs.language || ''

  async function copy() {
    clearTimeout(timer.current)
    try {
      await copyText(node.textContent)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    timer.current = setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <NodeViewWrapper className="note-code-block">
      <div className="note-code-block-toolbar" contentEditable={false}>
        <select
          aria-label="Code block language"
          value={language}
          disabled={!editor.isEditable}
          onChange={event => updateAttributes({ language: event.target.value || null })}
        >
          <option value="">Auto detect</option>
          <option value="plaintext">Plain text</option>
          {language && language !== 'plaintext' && !languages.includes(language) && <option value={language}>{language}</option>}
          {languages.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <button type="button" onClick={copy} aria-live="polite" aria-label="Copy code">
          {status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed, retry' : 'Copy'}
        </button>
      </div>
      <pre><NodeViewContent<'code'> as="code" className={language ? `language-${language}` : undefined} style={{ whiteSpace: 'pre' }} /></pre>
    </NodeViewWrapper>
  )
}

export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView, { contentDOMElementTag: 'span' })
  },
}).configure({ lowlight })
