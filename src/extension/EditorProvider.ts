import * as vscode from 'vscode'

export interface Editor {
  resolveHTML(token: vscode.CancellationToken): Promise<string>
}

export interface CustomTextEditor {
  new (
    context: vscode.ExtensionContext,
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Editor
}

export class CustomTextEditorProvider implements vscode.CustomTextEditorProvider {
  constructor (
    private context: vscode.ExtensionContext,
    private Editor: CustomTextEditor
  ) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    const editor = new this.Editor(this.context, document, webviewPanel, token)
    try {
      const html = await editor.resolveHTML(token)
      webviewPanel.webview.html = html
    } catch (err) {
      console.error(err)
      webviewPanel.webview.html = err instanceof Error
        ? err.message
        : String(err)
    }
  }
}
