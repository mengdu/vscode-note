import { useEffect, useRef, type ReactNode } from 'react'
import { useImmer, type Updater } from 'use-immer'
import type { ViewState } from './state'
import { context, initState } from './state'
import vscode from './vscode'
import type { ExtEvent } from '../shared'

document.addEventListener('DOMContentLoaded', () => {
  vscode.send({type: 'READY'})
}, {once: true})

function useMessage(set: Updater<ViewState>) {
  useEffect(() => {
    const onMessage = (e: MessageEvent<ExtEvent>) => {
      console.log('onMessage:', e.data)
      switch(e.data.type) {
        case 'CHANGE':
          set(prev => {
            if (prev.text !== e.data.data) {
              prev.text = e.data.data
            }
          })
          break
      }
    }

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])
}

export function ContextProvider(props: {children: ReactNode}) {
  const [state, setState] = useImmer<ViewState>(() => initState())
  useMessage(setState)

  return (
    <context.Provider value={[state, setState]}>
      {props.children}
    </context.Provider>
  )
}
