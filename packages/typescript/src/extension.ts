import { workspace, ExtensionContext, window, TextDocument, commands } from 'vscode'
import { TypeScriptLanguageClient } from './language-client'

const client = new TypeScriptLanguageClient()

async function onDocumentOpenedHandler(context: ExtensionContext, document: TextDocument) {
  if (document.languageId === 'typescript' && document.uri.fsPath.endsWith('algo.ts')) {
    const folder = workspace.getWorkspaceFolder(document.uri)
    if (folder) {
      await client.start(folder)
    }
  }
}

async function restartLanguageClientCommand() {
  const editor = window.activeTextEditor
  if (!editor) {
    window.showErrorMessage('No active editor found')
    return
  }

  const folder = workspace.getWorkspaceFolder(editor.document.uri)
  if (!folder) {
    window.showErrorMessage('No workspace folder found for the current file')
    return
  }

  await client.restart(folder)
}

export async function activate(context: ExtensionContext) {
  // Register restart command
  context.subscriptions.push(commands.registerCommand('algorandTypescript.restartLanguageClient', restartLanguageClientCommand))

  // Handle already opened documents
  if (window.activeTextEditor?.document) {
    await onDocumentOpenedHandler(context, window.activeTextEditor.document)
  }

  // Setup handler for newly opened documents
  context.subscriptions.push(
    workspace.onDidOpenTextDocument(async (document: TextDocument) => {
      await onDocumentOpenedHandler(context, document)
    })
  )

  // Handle workspace folder removal
  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(async (event) => {
      for (const folder of event.removed) {
        await client.restart(folder)
      }
    })
  )
}

export async function deactivate(): Promise<void> {
  await client.stopAll()
}
