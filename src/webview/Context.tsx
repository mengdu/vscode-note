import { useEffect, type ReactNode } from 'react'
import { useImmer, type Updater } from 'use-immer'
import type { ViewState } from './state'
import { context, initState } from './state'
import vscode from './vscode'

document.addEventListener('DOMContentLoaded', () => {
  vscode.send('READY')
}, {once: true})

function useMessage(set: Updater<ViewState>) {
  useEffect(() => {
    const disposeLayout = vscode.on('LAYOUT', layout => {
      set(prev => { prev.layout = layout })
    })
    const disposeChange = vscode.on('CHANGE', content => {
      set(prev => {
        if (prev.content !== content) {
          prev.content = content
        }
      })
    })
    return () => { disposeLayout(); disposeChange() }
  }, [set])
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
