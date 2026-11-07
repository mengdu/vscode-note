import * as vscode from 'vscode'
import { isDev } from './env'

const WEB_HOST = 'http://localhost:4321'

let cacheHTML: string | undefined = undefined
export const getWebviewHtml = async (
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
) => {
  const resolve = (file: string) => webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, file)).toString()
  let html = ''

  if (isDev()) {
    const res = await fetch(WEB_HOST)
    html = await res.text()
    html = html.replace(/"\//g, '"'+ WEB_HOST + '/')
  } else {
    if (cacheHTML !== undefined) return cacheHTML

    const file = vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'index.html')
    html = await vscode.workspace.fs.readFile(file).then(buffer => buffer.toString())
    html = html.replace(/"\//g, '"' + resolve('dist/webview/'))
    cacheHTML = html
  }
  return html
}
