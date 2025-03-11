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
  const ext = vscode.extensions.getExtension(extensionId)!
  await ext.activate()
  try {
    doc = await vscode.workspace.openTextDocument(docUri)
    editor = await vscode.window.showTextDocument(doc)
    await sleep(5_000) // Wait for server activation and results to be returned
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
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
