import * as vscode from 'vscode'
import { type Editor, CustomTextEditorProvider } from './EditorProvider'
import { getWebviewHtml } from './utils/getWebviewHtml'
import type { ExtMessage, InitState, Message, UploadData, WebEvent } from '../shared'
import { escapeJson } from './utils/escapeJson'
import { resolveFolder } from './utils/resolveFolder'
import { relativeUriPath } from './utils/relativeUriPath'

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
  cacheContent?: string // file raw content
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly document: vscode.TextDocument,
    private readonly webviewPanel: vscode.WebviewPanel,
    private readonly token: vscode.CancellationToken
  ) {
    // console.log('open file:', document.uri.fsPath)
    webviewPanel.webview.options = {
			enableScripts: true,
		}

    webviewPanel.webview.onDidReceiveMessage(async (e: Message<WebEvent>) => {
      // console.log('onDidReceiveMessage:', e)
      const [type, data] = e
      switch(type) {
        case 'READY':
          break
        case 'CHANGE':
          this.applyEdit(data)
          break
        case 'UPDATE_LAYOUT':
          await this.updateEditorLayout(data)
          break
        case 'UPLOAD_IMAGE':
          try {
            const src = await this.saveImage(data)
            await this.send('UPLOAD_IMAGE', {id: data.id, src})
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            await this.send('ERROR', {id: data.id, message})
          }
          break
        case 'DEMO':
          break
      }
    })

    webviewPanel.onDidDispose(() => {
      // console.log('onDidDispose', this.document.uri.fsPath)
      this.disposes.forEach(d => d.dispose())
    })

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('vsnote', this.document.uri)) {
        this.send('LAYOUT', this.getEditorLayout())
      }
    }, null, this.disposes)

    vscode.workspace.onDidChangeTextDocument(async e => {
      if (e.document.uri.toString() !== this.document.uri.toString()) return
      const text = this.document.getText()
      // console.log('file change:', {text})

      // no change break
      if (text === this.cacheContent) return

      this.cacheContent = text // update cache
      this.send('CHANGE', text)
    }, null, this.disposes)
  }

  async resolveHTML(_: vscode.CancellationToken) {
    const isMarkdown = /\.md$/i.test(this.document.uri.fsPath)
    const html = await getWebviewHtml(this.context, this.webviewPanel.webview)
    const currentDir = vscode.Uri.joinPath(this.document.uri, '..')
    const initState: InitState = {
      layout: this.getEditorLayout(),
      fileDirURL: this.webviewPanel.webview.asWebviewUri(currentDir).toString(),
      filename: this.document.uri.fsPath,
      content: this.document.getText(),
      contentType: isMarkdown ? 'markdown' : 'html',
    }
    this.cacheContent = initState.content
    const json = JSON.stringify(initState)
    const safeJson = escapeJson(json)
    // A replacement string would interpret note content such as $`, $& and $'.
    return html.replace(/<head>/i, () => {
      return `<head><script type="application/json" id="state">${safeJson}</script>`
    })
  }

  private async updateEditorLayout(data: Extract<WebEvent, ['UPDATE_LAYOUT', unknown, unknown]>[1]) {
    try {
      const cfg = vscode.workspace.getConfiguration('vsnote', this.document.uri)
      const update = async (key: string, value: string) => {
        const existing = cfg.inspect(key)
        const target = existing?.workspaceFolderValue !== undefined ? vscode.ConfigurationTarget.WorkspaceFolder
          : existing?.workspaceValue !== undefined ? vscode.ConfigurationTarget.Workspace
          : vscode.ConfigurationTarget.Global
        await cfg.update(key, value, target)
      }
      if (data.size !== undefined) {
        if (!/^(|fullscreen|[1-9][0-9]*(px)?)$/.test(data.size)) throw new Error('Invalid editor size')
        await update('editorMaxWidth', data.size)
      }
      if (data.alignment !== undefined) {
        if (data.alignment !== 'left' && data.alignment !== 'center' && data.alignment !== 'right') throw new Error('Invalid editor alignment')
        await update('editorAlignment', data.alignment)
      }
      await this.send('UPDATE_LAYOUT', { id: data.id, ...this.getEditorLayout() })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      vscode.window.showErrorMessage(`Failed to update editor layout: ${message}`)
      await this.send('ERROR', { id: data.id, message })
    }
  }

  getEditorLayout(): InitState['layout'] {
    const cfg = vscode.workspace.getConfiguration('vsnote', this.document.uri)
    const size = cfg.get<string>('editorMaxWidth', '')
    const alignment = cfg.get<string>('editorAlignment', 'center')
    return {
      size: /^(|fullscreen|[1-9][0-9]*(px)?)$/.test(size) ? size : '',
      alignment: alignment === 'left' || alignment === 'right' ? alignment : 'center',
    }
  }

  getImageUploadFolder() {
    if (this.document.isUntitled) {
      throw new Error('Save the note before uploading images')
    }
    const cfg = vscode.workspace.getConfiguration('vsnote', this.document.uri)
    const targetUri = vscode.Uri.joinPath(this.document.uri, '..')
    // Standalone notes use their own directory as the upload root.
    const rootUri = vscode.workspace.getWorkspaceFolder(this.document.uri)?.uri ?? targetUri
    return resolveFolder(rootUri, targetUri, cfg.get('imageUploadFolder') || '')
  }

  async saveImage(event: UploadData) {
    if (!event.name || event.name === '.' || event.name === '..' || /[/\\]/.test(event.name)) {
      throw new Error('Invalid image filename')
    }
    const dest = this.getImageUploadFolder()
    await vscode.workspace.fs.createDirectory(dest)
    const dot = event.name.lastIndexOf('.')
    const extension = dot > 0 ? event.name.slice(dot).toLowerCase() : ''
    if (extension && !/^\.[a-z0-9]+$/.test(extension)) {
      throw new Error('Invalid image extension')
    }
    const file = vscode.Uri.joinPath(dest, `${globalThis.crypto.randomUUID()}${extension}`)
    await vscode.workspace.fs.writeFile(file, new Uint8Array(event.bytes))

    return relativeUriPath(
      vscode.Uri.joinPath(this.document.uri, '..'),
      file
    )
  }

  async send(...event: ExtMessage) {
    return await this.webviewPanel.webview.postMessage(event)
  }

  private applyEdit(text: string) {
    this.cacheContent = text // update cache
    const edit = new vscode.WorkspaceEdit()
    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(this.document.uri, new vscode.Range(0, 0, this.document.lineCount, 0), text)
    // Apply change to file
    return vscode.workspace.applyEdit(edit, { isRefactoring: false })
  }
}
