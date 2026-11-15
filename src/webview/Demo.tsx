import { useEffect, useMemo } from 'react'
import debounce from 'lodash.debounce'
import { useViewState } from './state'
import vscode from './vscode'

function App() {
  const [state, setState] = useViewState()
  const sendChange = useMemo(() => debounce((text: string) => {
    vscode.send('CHANGE', text)
  }, 150), [])

  useEffect(() => {
    return () => {
      sendChange.flush()
      sendChange.cancel()
    }
  }, [sendChange])

  return (
    <>
      <button
        className="border rounded-sm px-1.5"
        onClick={() => setState(prev => {
          prev.count = prev.count ? prev.count + 1 : 1
        })}
      >{state.count || 0}</button>
      <button className="border rounded-sm px-1.5"
        onClick={async () => {
          // vscode.send('DEMO', state.text || '')
          const file = new File(['hi'], 'hello.txt')
          const {src} = await vscode.handle('UPLOAD_IMAGE', {
            name: file.name,
            bytes: await file.arrayBuffer()
          })
          console.log(src)
        }}
      >Hi</button><span className="ml-1.5">{state.content?.length}</span>

      <textarea className="w-full h-40 border p-1"
        value={state.content || ''} 
        onBlur={() => sendChange.flush()}
        onChange={e => {
          const text = e.target.value
          setState(prev => {
            prev.content = text
          })
          sendChange(text)
        }}
      ></textarea>

      <img src={new URL(state.content || '', (state.fileDirURL || '') + '/').href} alt="" />
    </>
  )
}

export default App
