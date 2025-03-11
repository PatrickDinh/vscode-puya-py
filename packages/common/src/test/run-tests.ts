import * as path from 'path'
import { runVSCodeCommand, runTests as runVSCodeTests } from '@vscode/test-electron'
import './run' // Importing the module to ensure it's included in the bundle
import * as fs from 'fs'

const installPath = path.resolve('../../.vscode-test')

export async function runTests(language: 'python' | 'typescript') {
  let hostLogsPath = ''
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

    const tempLogsPath = path.join(userDataPath, 'logs', 'temp')
    if (fs.existsSync(tempLogsPath)) {
      fs.rmSync(tempLogsPath, { recursive: true, force: true })
    }

    hostLogsPath = path.join(tempLogsPath, 'window1', 'exthost')

    // Download VS Code, unzip it and run the integration test
    await runVSCodeTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        workspacePath,
        `--extensions-dir=${extensionsPath}`,
        `--user-data-dir=${userDataPath}`,
        // '--log=debug',
        `--logsPath=${tempLogsPath}`,
      ],
      cachePath: installPath,
    })
    outputFilesInDirectoryWithPrefix(hostLogsPath, 'output_logging_')
  } catch {
    outputFilesInDirectoryWithPrefix(hostLogsPath, 'output_logging_')
    // eslint-disable-next-line no-console
    console.error('Failed to run tests')
    process.exit(1)
  }
}

export function listFilesInDirectoryWithPrefix(basePath: string, dirPrefix: string): string[] {
  try {
    const results: string[] = []

    // Helper function to recursively search directories
    function searchDirectory(currentPath: string) {
      const items = fs.readdirSync(currentPath)

      items.forEach((item) => {
        const itemPath = path.join(currentPath, item)
        const stat = fs.statSync(itemPath)

        if (stat.isDirectory()) {
          // If this directory path starts with the prefix, add all files in it
          if (item.startsWith(dirPrefix)) {
            const filesInDir = fs
              .readdirSync(itemPath)
              .filter((file) => fs.statSync(path.join(itemPath, file)).isFile())
              .map((file) => path.join(itemPath, file))
            results.push(...filesInDir)
          }
          // Continue searching in subdirectories regardless
          searchDirectory(itemPath)
        }
      })
    }

    searchDirectory(basePath)
    return results
  } catch (error) {
    console.error(`Error listing files in directories with prefix ${dirPrefix}: ${error}`)
    return []
  }
}

/**
 * Lists and outputs all files inside directories matching a specific prefix
 * @param basePath Base path to search from
 * @param dirPrefix Prefix to match against directory paths
 */
export function outputFilesInDirectoryWithPrefix(basePath: string, dirPrefix: string): void {
  try {
    console.log(fs.readFileSync(path.join(basePath, 'exthost.log'), 'utf-8'))

    const matchingFiles = listFilesInDirectoryWithPrefix(basePath, dirPrefix)

    if (matchingFiles.length === 0) {
      console.log(`No files found in directories with prefix "${dirPrefix}"`)
      return
    }

    console.log(`Files in directories with prefix "${dirPrefix}":`)
    matchingFiles.forEach((file) => {
      console.log(`File: ${file}`)
      console.log(fs.readFileSync(file, 'utf-8'))
      console.log(`End File`)
    })
  } catch (error) {
    console.error(`Error outputting files in directories with prefix ${dirPrefix}: ${error}`)
  }
}
