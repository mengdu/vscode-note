import * as vscode from 'vscode'
import { NoteEditor } from './NoteEditor'

export function activate(context: vscode.ExtensionContext) {
  console.log('vscode.note activate')
  NoteEditor.register(context)
}

export function deactivate() {}
