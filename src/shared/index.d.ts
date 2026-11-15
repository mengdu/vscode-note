export interface EditorLayout {
  size: string
  alignment: 'left' | 'center' | 'right'
}

export interface InitState {
  layout: EditorLayout
  fileDirURL: string // current file dir webview url
  contentType: 'html' | 'markdown'
  filename: string
  content: string
}

export type Req<T extends object> = T & {id: string}
export type Res<T extends object> = T & {id: string}

export interface UploadData {
  name: string
  bytes: ArrayBuffer
}

// [name, input] = notification; [name, input, output] = request.
export type WebEvent =
  | ['READY', void]
  | ['UPDATE_LAYOUT', Req<Partial<EditorLayout>>, Res<EditorLayout>]
  | ['CHANGE', string]
  | ['UPLOAD_IMAGE', Req<UploadData>, Res<{src: string}>]
  | ['DEMO', string]

export type ExtEvent = ['CHANGE', string] | ['LAYOUT', EditorLayout]

// Only the first two items travel over postMessage.
export type Message<E> = E extends [infer Name, infer Data, ...unknown[]]
  ? Data extends void ? [Name, data?: Data] : [Name, Data]
  : never
export type Response<E> = E extends [infer Name, unknown, infer Data] ? [Name, Data] : never
export type ExtMessage = ExtEvent | Response<WebEvent> | ['ERROR', Res<{message: string}>]

export type WebVSCodeState = unknown
