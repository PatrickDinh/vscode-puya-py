import * as vscode from 'vscode'
import * as path from 'path'

export let doc: vscode.TextDocument
export let editor: vscode.TextEditor
export let documentEol: string
export let platformEol: string

/**
 * Activates the vscode-puya-py extension
 */

// TODO: NC - Need to ensure we can support a non .venv setup
export async function activate(extensionId: string, docUri: vscode.Uri) {
  // The extensionId is `publisher.name` from package.json
  // const ext = vscode.extensions.getExtension(extensionId)!
  // await ext.activate()
  doc = await vscode.workspace.openTextDocument(docUri)
  await vscode.window.showTextDocument(doc)
  await sleep(10_000) // Wait for server activation
  await vscode.commands.executeCommand('workbench.action.closeActiveEditor') // Close the document
  await sleep(10_000)
  editor = await vscode.window.showTextDocument(doc)
  await sleep(10_000) // Wait for results to be returned

  vscode.window.visibleTextEditors.forEach((e) => {
    console.log(`>>>>>${e.document.getText().length}:${e.document.languageId}: ${e.document.uri.toString()}`)
  })
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getDocPath = (p: string) => {
  return path.resolve(vscode.workspace.workspaceFolders![0]!.uri.fsPath, p)
}
export const getDocUri = (p: string) => {
  return vscode.Uri.file(getDocPath(p))
}

export async function setTestContent(content: string): Promise<boolean> {
  const all = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length))
  return editor.edit((eb) => eb.replace(all, content))
}
