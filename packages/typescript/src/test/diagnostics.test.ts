import * as vscode from 'vscode'
import { getDocUri, testDiagnostics, toRange } from 'common/test/helper'

suite('diagnostics', () => {
  const docUri = getDocUri('diagnostics.algo.ts')

  test('should get diagnostics', async () => {
    await testDiagnostics(docUri, 'puyats', [
      {
        message:
          '`2` is not valid as a variable, parameter, return, or property type. Please use an algo-ts type such as `biguint` or `uint64`',
        range: toRange({ startLine: 4, startChar: 10, endLine: 4, endChar: 11 }),
        severity: vscode.DiagnosticSeverity.Error,
        source: 'ex',
      },
      {
        message:
          '`2` is not valid as a variable, parameter, return, or property type. Please use an algo-ts type such as `biguint` or `uint64`',
        range: toRange({ startLine: 5, startChar: 11, endLine: 5, endChar: 12 }),
        severity: vscode.DiagnosticSeverity.Error,
        source: 'ex',
      },
    ])
  })
})
