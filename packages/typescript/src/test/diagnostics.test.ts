import * as vscode from 'vscode'
import * as assert from 'assert'
import { getDocUri, activate, doc } from 'common/test/helper'

const extensionId = 'AlgorandFoundation.algorand-typescript-vscode'

suite.skip('Diagnostics', () => {
  const docUri = getDocUri('diagnostics.py')

  test('Should get diagnostics', async () => {
    // A dummy test
    assert.equal(1, 1)
  })
})
