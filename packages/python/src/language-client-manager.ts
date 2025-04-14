import { WorkspaceFolder } from 'vscode'
import { ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { PythonConfig, getPythonEnvironment } from './environment'
import { LanguageClientManager, OptionsResult } from 'common/language-client-manager'

// TODO: NC - How do we want to show a multi-root workspace in the output channel? How do other extensions handle this?
// TODO: NC -Auto detect a AlgoKit project and enable the language server
// TODO: NC - Docs

export class PythonLanguageClientManager extends LanguageClientManager {
  constructor() {
    super('Algorand Python', 'puyapy')
  }

  private async resolveServerOptions(pythonConfig: PythonConfig): Promise<ServerOptions | undefined> {
    const baseServerOptions = {
      transport: TransportKind.stdio,
      options: {
        env: {
          VIRTUAL_ENV: pythonConfig.envPath,
          NO_COLOR: '1',
          PYTHONUTF8: '1',
        },
      },
    }

    // If the language server is installed locally in a venv, then use it.
    const locallyInstalledServerOptions: ServerOptions = {
      ...baseServerOptions,
      command: pythonConfig.pythonPath,
      args: ['-m', 'puyapy.lsp'],
    }
    if (await this.commandSucceeds(locallyInstalledServerOptions)) {
      return locallyInstalledServerOptions
    }

    // If the language server available on the path, then use it.
    const onPathServerOptions: ServerOptions = {
      ...baseServerOptions,
      command: 'puyapy-ls',
    }
    if (await this.commandSucceeds(onPathServerOptions)) {
      return onPathServerOptions
    }

    return undefined
  }

  protected async getOptions(workspaceFolder: WorkspaceFolder): Promise<OptionsResult> {
    const pythonConfig = await getPythonEnvironment(workspaceFolder?.uri)
    if (!pythonConfig) {
      return { type: 'failure', message: 'Could not determine Python environment configuration.' }
    }

    const serverOptions = await this.resolveServerOptions(pythonConfig)

    if (!serverOptions) {
      return { type: 'failure', message: this.serverNotAvailableMessage }
    }

    return {
      type: 'success',
      server: serverOptions,
      client: {
        documentSelector: [{ language: 'python', pattern: `${workspaceFolder.uri.fsPath}/**/*` }],
        workspaceFolder: workspaceFolder,
        initializationOptions: {
          analysisPrefix: pythonConfig.envPath,
        },
      },
    }
  }
}
