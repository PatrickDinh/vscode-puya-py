import * as vscode from 'vscode'
import * as assert from 'assert'
import { getDocUri, activate, doc } from 'common/test/helper'

const extensionId = 'AlgorandFoundation.algorand-python-vscode'

suite('Diagnostics', () => {
  const docUri = getDocUri('diagnostics.py')

  test('Should get diagnostics', async () => {
    await testDiagnostics(docUri, [
      {
        message: `Incompatible return value type (got "int", expected "UInt64")  [return-value]`,
        range: toRange({ startLine: 8, startChar: 0, endLine: 8, endChar: 17 }),
        severity: vscode.DiagnosticSeverity.Error,
        source: 'ex',
      },
    ])
  })

  // Skip until code actions are available
  test.skip('Should fix the issue', async () => {
    await activate(extensionId, docUri)

    const range = toRange({ startLine: 7, startChar: 0, endLine: 7, endChar: 17 })

    // Execute the code action provider command to retrieve action list.
    const codeActions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
      'vscode.executeCodeActionProvider',
      docUri,
      range,
      vscode.CodeActionKind.QuickFix.value
    )

    assert.equal(codeActions[0].title, "Replace 'list' with 'arc4.Array'")
    await vscode.workspace.applyEdit(codeActions[0]!.edit!)
    assert.equal(doc.getText(), 'a = arc4.Array([1, 2, 3])')
  })
})

function toRange(params: { startLine: number; startChar: number; endLine: number; endChar: number }) {
  const { startLine, startChar, endLine, endChar } = params
  const start = new vscode.Position(startLine, startChar)
  const end = new vscode.Position(endLine, endChar)
  return new vscode.Range(start, end)
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
  await activate(extensionId, docUri)

  const allDiagnostics = vscode.languages.getDiagnostics(docUri)
  const actualDiagnostics = allDiagnostics.filter((diagnostic) => diagnostic.source === 'puyapy-lsp')

  assert.equal(allDiagnostics.length > 0, true, 'No diagnostics found')
  assert.equal(actualDiagnostics.length, expectedDiagnostics.length)

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i]
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message)
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range)
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity)
  })
}
