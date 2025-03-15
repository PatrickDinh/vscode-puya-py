import * as path from 'path'
import { runVSCodeCommand, runTests as runVSCodeTests } from '@vscode/test-electron'
import './run' // Importing the module to ensure it's included in the bundle

const installPath = path.resolve('../../.vscode-test')

export async function runTests(language: 'python' | 'typescript') {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed as `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../../')

    // The path to test runner
    // Passed as --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './run')

    // The path to the workspace
    const workspacePath = path.resolve(extensionDevelopmentPath, process.env.CODE_TESTS_WORKSPACE!)

    // The path to the extensions
    const extensionsPath = path.join(installPath, 'extensions')

    // The path to the user data
    const userDataPath = path.join(installPath, 'user-data')

    if (language === 'python') {
      await runVSCodeCommand(
        ['--install-extension', 'ms-python.python', '--extensions-dir', extensionsPath, '--user-data-dir', userDataPath],
        {
          cachePath: installPath,
        }
      )
    }

    // Download VS Code, unzip it and run the integration test
    await runVSCodeTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath, `--extensions-dir=${extensionsPath}`, `--user-data-dir=${userDataPath}`],
      cachePath: installPath,
    })
  } catch {
    // eslint-disable-next-line no-console
    console.error('Failed to run tests')
    process.exit(1)
  }
}
