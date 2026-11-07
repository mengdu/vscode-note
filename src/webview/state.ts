import { createContext, useContext } from 'react'
import { type Updater } from 'use-immer'

export interface ViewState {
  count?: number
  text?: string
}

export function initState(): ViewState {
  return {}
}

export const context = createContext<[ViewState, Updater<ViewState>]>([
  initState(),
  () => {}
])

export function useViewState() {
  return useContext(context)
}
