import * as vscode from 'vscode'
import * as path from 'path'
import * as assert from 'assert'

export let doc: vscode.TextDocument
export let editor: vscode.TextEditor
export let documentEol: string
export let platformEol: string

type DiagnosticSource = 'puyapy' | 'puyats'

export async function waitForDocumentDiagnostics(docUri: vscode.Uri, diagnosticSource: DiagnosticSource) {
  doc = await vscode.workspace.openTextDocument(docUri)
  editor = await vscode.window.showTextDocument(doc)

  return await getDocumentDiagnostics(docUri, diagnosticSource)
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

function getDocumentDiagnostics(docUri: vscode.Uri, diagnosticSource: string) {
  return new Promise<vscode.Diagnostic[]>((resolve, reject) => {
    let attempts = 0

    const interval = setInterval(() => {
      attempts++
      if (attempts > 100) {
        clearInterval(interval)
        reject('Failed to retrieve diagnostics within retry limit')
        return
      }

      const allDiagnostics = vscode.languages.getDiagnostics(docUri)
      const actualDiagnostics = allDiagnostics.filter((diagnostic) => diagnostic.source === diagnosticSource)

      if (actualDiagnostics.length > 0) {
        clearInterval(interval)
        resolve(actualDiagnostics)
      }
    }, 600)
  })
}

export async function testDiagnostics(docUri: vscode.Uri, diagnosticSource: DiagnosticSource, expectedDiagnostics: vscode.Diagnostic[]) {
  const diagnostics = await waitForDocumentDiagnostics(docUri, diagnosticSource)

  assert.equal(diagnostics.length, expectedDiagnostics.length)
  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = diagnostics[i]
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message)
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range)
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity)
  })
}

export function toRange(params: { startLine: number; startChar: number; endLine: number; endChar: number }) {
  const { startLine, startChar, endLine, endChar } = params
  const start = new vscode.Position(startLine, startChar)
  const end = new vscode.Position(endLine, endChar)
  return new vscode.Range(start, end)
}
