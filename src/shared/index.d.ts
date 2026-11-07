export type WebEvent = 
  {type: 'READY'}
  | {type: 'CHANGE'; data: string}
  | {type: 'DEMO'; data: string}

export type WebVSCodeState = unknown

export type ExtEvent =
  {type: 'CHANGE', data: string}
