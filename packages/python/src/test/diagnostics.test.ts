import * as vscode from 'vscode'
import * as assert from 'assert'
import { getDocUri, waitForDocumentDiagnostics, doc, testDiagnostics, toRange } from 'common/test/helper'

suite('diagnostics', () => {
  const docUri = getDocUri('diagnostics.py')

  test('should get diagnostics', async () => {
    await testDiagnostics(docUri, 'puyapy', [
      {
        message: `Incompatible return value type (got "int", expected "UInt64")  [return-value]`,
        range: toRange({ startLine: 8, startChar: 0, endLine: 8, endChar: 17 }),
        severity: vscode.DiagnosticSeverity.Error,
        source: 'ex',
      },
    ])
  })

  // Skip until code actions are available
  test.skip('should fix the issue', async () => {
    await waitForDocumentDiagnostics(docUri, 'puyapy')

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
