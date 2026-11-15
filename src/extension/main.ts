import * as vscode from 'vscode'
import { NoteEditor } from './NoteEditor'

export function activate(context: vscode.ExtensionContext) {
  NoteEditor.register(context)
}

export function deactivate() {}
