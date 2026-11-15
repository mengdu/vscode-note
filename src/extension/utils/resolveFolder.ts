import * as vscode from 'vscode'

export function resolveFolder(
  rootUri: vscode.Uri,
  targetUri: vscode.Uri,
  path: string
): vscode.Uri {
  path = path.replace(/\\/g, '/').trim()
  const result = path.startsWith('/')
    ? vscode.Uri.joinPath(rootUri, path)
    : vscode.Uri.joinPath(targetUri, path)

  const rootPath = rootUri.path.replace(/\/+$/, '')
  if (
    result.scheme !== rootUri.scheme ||
    result.authority !== rootUri.authority ||
    (result.path !== rootPath && !result.path.startsWith(`${rootPath}/`))
  ) {
    throw new Error('Image upload folder must stay within the workspace or standalone note directory')
  }

  return result
}
