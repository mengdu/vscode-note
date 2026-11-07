import { useEffect, useMemo } from 'react'
import debounce from 'lodash.debounce'
import { useViewState } from './state'
import vscode from './vscode'

function App() {
  const [state, setState] = useViewState()
  const sendChange = useMemo(() => debounce((text: string) => {
    vscode.send({type: 'CHANGE', data: text})
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
        onClick={() => {
          vscode.send({type: 'DEMO', data: state.text || ''})
        }}
      >Hi</button><span className="ml-1.5">{state.text?.length}</span>

      <textarea className="w-full h-40 border p-1"
        value={state.text || ''} 
        onBlur={() => sendChange.flush()}
        onChange={e => {
          const text = e.target.value
          setState(prev => {
            prev.text = text
          })
          sendChange(text)
        }}
      ></textarea>
    </>
  )
}

export default App
