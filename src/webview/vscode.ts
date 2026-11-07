import type { WebEvent, WebVSCodeState } from '../shared'

const vscode = globalThis.acquireVsCodeApi<WebVSCodeState>()

class Api {
  send(event: WebEvent) {
    vscode.postMessage(event)
  }

  get() {
    return vscode.getState()
  }

  set(state?: WebVSCodeState ) {
    vscode.setState(state)
  }
}

const api = new Api()

export default api
