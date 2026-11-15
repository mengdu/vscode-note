import { createContext, useContext } from 'react'
import { type Updater } from 'use-immer'
import type { InitState } from '../shared'

export interface ViewState {
  layout?: InitState['layout']
  count?: number
  content?: string
  contentType?: 'html' | 'markdown'
  fileDirURL?: string,
  filename?: string
}

export function initState(): ViewState {
  const init = JSON.parse(document.querySelector('head #state')?.textContent || '{}') as InitState
  return {
    layout: init.layout || { size: '', alignment: 'center' },
    fileDirURL: init.fileDirURL || '',
    contentType: init.contentType || 'html',
    filename: init.filename || '',
    content: init.content || '',
  }
}

export const context = createContext<[ViewState, Updater<ViewState>]>([
  initState(),
  () => {}
])

export function useViewState() {
  return useContext(context)
}
