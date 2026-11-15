import { useMemo } from 'react'
import debounce from 'lodash.debounce'
import { useViewState } from './state'
import { NoteEditor } from './NoteEditor'
import { MAX_FILE_SIZE } from './lib/tiptap-utils'
import vscode from './vscode'

async function uploadImage(
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal,
): Promise<string> {
  if (!file) throw new Error('No file provided')
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum allowed (' + MAX_FILE_SIZE / (1024 * 1024) + 'MB)')
  }
  if (abortSignal?.aborted) throw new Error('Upload cancelled')

  onProgress?.({ progress: 0 })
  const bytes = await file.arrayBuffer()
  if (abortSignal?.aborted) throw new Error('Upload cancelled')

  const { src } = await vscode.handle('UPLOAD_IMAGE', { name: file.name, bytes })
  if (abortSignal?.aborted) throw new Error('Upload cancelled')
  onProgress?.({ progress: 100 })
  return src
}

function App() {
  const [state, setState] = useViewState()
  const submitChange = useMemo(() => debounce((text: string) => {
    vscode.send('CHANGE', text)
  }, 100), [])

  const handleChange = (content: string) => {
    setState(prev => {
      prev.content = content
    })
    submitChange(content)
  }

  return (
    <>
      <div className="h-screen">
        <NoteEditor
          className="rounded-xl h-full"
          layout={state.layout}
          onLayoutChange={layout => {
            void vscode.handle('UPDATE_LAYOUT', layout).then(updated => {
              setState(prev => { prev.layout = updated })
            }).catch(error => console.error('Failed to update editor layout:', error))
          }}
          value={state.content || ''}
          contentType={state.contentType || 'html'}
          filename={state.filename}
          uploadImage={uploadImage}
          resolveImageURL={(src) => {
            if (/^[a-z][a-z\d+.-]*:/i.test(src)) return src
            console.log(src, state.fileDirURL)
            return new URL(src, state.fileDirURL?.replace(/\/*$/, '/')).href
          }}
          onChange={handleChange}
        />
      </div>
    </>
  )
}

export default App
