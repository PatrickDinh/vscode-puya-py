import * as path from 'path'
import { runTests as vscodeRunTests } from '@vscode/test-electron'
import './run' // Importing the module to ensure it's included in the bundle

const cachePath = '../../.vscode-test'

export async function runTests() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed as `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../../')

    // The path to test runner
    // Passed as --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './run')

    // Download VS Code, unzip it and run the integration test
    await vscodeRunTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        process.env.CODE_TESTS_WORKSPACE!,
        `--extensions-dir=${path.join(cachePath, 'extensions')}`,
        `--user-data-dir=${path.join(cachePath, 'user-data')}`,
      ],
      cachePath: cachePath,
    })
  } catch {
    // eslint-disable-next-line no-console
    console.error('Failed to run tests')
    process.exit(1)
  }
}
