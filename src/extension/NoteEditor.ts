import * as vscode from 'vscode'
import { type Editor, CustomTextEditorProvider } from './EditorProvider'
import { getWebviewHtml } from './utils/getWebviewHtml'
import type { ExtEvent, WebEvent } from '../shared'

export class NoteEditor implements Editor {
  static viewType = 'note.editor'
  static register(context: vscode.ExtensionContext) {
    const provider = new CustomTextEditorProvider(context, NoteEditor)
    const dispose = vscode.window.registerCustomEditorProvider(NoteEditor.viewType, provider, {
      webviewOptions: {
        retainContextWhenHidden: true
      },
    })
    context.subscriptions.push(dispose)
  }

  disposes: vscode.Disposable[] = []
  raw?: string // file raw content
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly document: vscode.TextDocument,
    private readonly webviewPanel: vscode.WebviewPanel,
    private readonly token: vscode.CancellationToken
  ) {
    console.log('open file:', document.uri.fsPath)
    webviewPanel.webview.options = {
			enableScripts: true,
		}

    webviewPanel.webview.onDidReceiveMessage((e: WebEvent) => {
      console.log('onDidReceiveMessage:', e)
      switch(e.type) {
        case 'READY':
          const text = this.document.getText()
          this.send({type: 'CHANGE', data: text})
          break
        case 'CHANGE':
          this.applyEdit(e.data)
          break
        case 'DEMO':
          vscode.window.showInformationMessage(e.data)
          break
      }
    })

    webviewPanel.onDidDispose(() => {
      console.log('onDidDispose', this.document.uri.fsPath)
      this.disposes.forEach(d => d.dispose())
    })

    vscode.workspace.onDidChangeTextDocument(async e => {
      if (e.document.uri.toString() !== this.document.uri.toString()) return
      const text = this.document.getText()
      console.log('file change:', {text})

      // no change break
      if (text === this.raw) return

      this.raw = text // update cache
      this.send({type: 'CHANGE', data: text})
    }, null, this.disposes)
  }

  async resolveHTML(_: vscode.CancellationToken) {
    const html = await getWebviewHtml(this.context, this.webviewPanel.webview)
    return html
  }

  async send(event: ExtEvent) {
    return await this.webviewPanel.webview.postMessage(event)
  }

  private applyEdit(text: string) {
    this.raw = text // update cache
    const edit = new vscode.WorkspaceEdit()
    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(this.document.uri, new vscode.Range(0, 0, this.document.lineCount, 0), text)
    // Apply change to file
    return vscode.workspace.applyEdit(edit, { isRefactoring: false })
  }
}
