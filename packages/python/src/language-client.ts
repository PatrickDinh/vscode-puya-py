import { workspace, WorkspaceFolder } from 'vscode'
import { LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { exec } from 'child_process'
import { PythonConfig, getPythonEnvironment } from './environment'
import { LanguageClientBase } from 'common/language-client-base'

type ServerCommand = {
  command: string
  args?: string[]
}

export class PythonLanguageClient extends LanguageClientBase {
  constructor() {
    super('Algorand Python', 'puyapy')
  }

  private async tryToRunCommand(command: string): Promise<boolean> {
    try {
      await new Promise<void>((resolve, reject) => {
        exec(command, (error: Error | null) => (error ? reject(error) : resolve()))
      })
      return true
    } catch {
      return false
    }
  }

  private async findStartServerCommand(config: PythonConfig): Promise<ServerCommand | undefined> {
    if (!config.pythonPath || !config.envPath) {
      return undefined
    }

    const startWithPuyapyLsp = 'puyapy.lsp --help' // TODO: Switch to --version if/when supported

    const startWithPython = `"${config.pythonPath}" -m ${startWithPuyapyLsp}`
    if (await this.tryToRunCommand(startWithPython)) {
      return {
        command: config.pythonPath,
        args: ['-m', 'puyapy.lsp'],
      }
    }

    if (await this.tryToRunCommand(startWithPuyapyLsp)) {
      return {
        command: 'puyapy-lsp',
      }
    }

    return undefined
  }

  protected async getOptions(workspaceFolder: WorkspaceFolder): Promise<[ServerOptions, LanguageClientOptions] | undefined> {
    const pythonConfig = await getPythonEnvironment(workspaceFolder?.uri)
    if (!pythonConfig?.envPath || !pythonConfig.pythonPath) {
      throw new Error('Python configuration not found')
    }

    const config = workspace.getConfiguration('puyapy', workspaceFolder.uri)
    let languageServerPath = config.get<string>('languageServerPath')
    // Resolve ${workspaceFolder} if present
    // Doesn't seems to be a better way to handle this
    // https://github.com/microsoft/vscode/issues/46471
    // likely we will need to use this https://github.com/DominicVonk/vscode-variables
    // TODO: handle all predefined variables
    if (languageServerPath?.includes('${workspaceFolder}')) {
      languageServerPath = languageServerPath.replace('${workspaceFolder}', workspaceFolder.uri.fsPath)
    }

    const startServerCommand = languageServerPath ? { command: 'puyapy-lsp' } : await this.findStartServerCommand(pythonConfig)

    if (!startServerCommand) {
      return undefined
    }

    return [
      {
        command: startServerCommand.command,
        args: startServerCommand.args,
        transport: TransportKind.stdio,
        options: {
          env: {
            VIRTUAL_ENV: pythonConfig.envPath,
            NO_COLOR: '1',
            PYTHONUTF8: '1',
          },
          ...(languageServerPath && { cwd: languageServerPath }),
        },
      },
      {
        documentSelector: [{ language: 'python', pattern: `${workspaceFolder.uri.fsPath}/**/*` }],
        workspaceFolder: workspaceFolder,
        initializationOptions: {
          analysisPrefix: pythonConfig.envPath,
        },
      },
    ]
  }
}
