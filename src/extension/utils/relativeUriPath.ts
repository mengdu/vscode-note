import * as vscode from 'vscode'

export function relativeUriPath(fromDir: vscode.Uri, target: vscode.Uri): string {
  if (
    fromDir.scheme !== target.scheme ||
    fromDir.authority !== target.authority
  ) {
    throw new Error('Cannot compute a relative path across URI roots')
  }

  const from = fromDir.path.split('/').filter(Boolean)
  const to = target.path.split('/').filter(Boolean)

  let common = 0
  while (
    common < from.length &&
    common < to.length &&
    from[common] === to[common]
  ) {
    common++
  }

  return [
    ...Array(from.length - common).fill('..'),
    ...to.slice(common),
  ].join('/') || '.'
}
