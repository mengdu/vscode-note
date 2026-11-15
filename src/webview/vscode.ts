import type { ExtEvent, ExtMessage, Message, WebEvent, WebVSCodeState } from '../shared'

const vscode = globalThis.acquireVsCodeApi<WebVSCodeState>()
type Request = Extract<WebEvent, [string, object, object]>
type RequestOf<T> = Extract<Request, [T, object, object]>

class Api {
  private pending = new Map<string, {
    resolve: (data: unknown) => void
    reject: (error: Error) => void
  }>()

  constructor() {
    window.addEventListener('message', (e: MessageEvent<ExtMessage>) => {
      if (!Array.isArray(e.data)) return
      const [type, data] = e.data
      if (!data || typeof data !== 'object' || !('id' in data)) return
      const pending = this.pending.get(data.id)
      if (!pending) return
      this.pending.delete(data.id)
      if (type === 'ERROR') pending.reject(new Error(data.message))
      else pending.resolve(data)
    })
  }

  send(...event: Message<Extract<WebEvent, [string, unknown]>>) {
    vscode.postMessage(event)
  }

  on<T extends ExtEvent[0]>(type: T, listener: (data: Extract<ExtEvent, [T, unknown]>[1]) => void) {
    const onMessage = (e: MessageEvent<ExtEvent>) => {
      if (Array.isArray(e.data) && e.data[0] === type) {
        listener(e.data[1] as Extract<ExtEvent, [T, unknown]>[1])
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }

  handle<T extends Request[0]>(
    type: T, data: Omit<RequestOf<T>[1], 'id'>, timeoutMs = 30_000,
  ): Promise<RequestOf<T>[2]> {
    const id = globalThis.crypto.randomUUID()
    let timer: ReturnType<typeof setTimeout>
    return new Promise<RequestOf<T>[2]>((resolve, reject) => {
      this.pending.set(id, {resolve: resolve as (value: unknown) => void, reject})
      timer = setTimeout(() => reject(new Error(`Request ${type} timed out`)), timeoutMs)
      vscode.postMessage([type, {...data, id}])
    }).finally(() => {
      clearTimeout(timer)
      this.pending.delete(id)
    })
  }

  get() {
    return vscode.getState()
  }

  set(state?: WebVSCodeState) {
    vscode.setState(state)
  }
}

export default new Api()
