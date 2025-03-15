import { window, WorkspaceFolder, OutputChannel } from 'vscode'
import {
  CloseAction,
  createServerSocketTransport,
  ErrorAction,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient/node'
import { getDebugLspPort } from './utils/get-debug-lsp-port'

export abstract class LanguageClientBase {
  private clients: Map<string, LanguageClient> = new Map()
  private outputChannels: Map<string, OutputChannel> = new Map()
  private readonly stopTimeout = 3_000
  private readonly lspPort = getDebugLspPort()
  private readonly serverName: string

  constructor(language: string, protected readonly id: string) {
    this.serverName = `${language} Language Server`
  }

  private getOutputChannel(workspaceFolder: WorkspaceFolder): OutputChannel {
    if (this.outputChannels.has(workspaceFolder.name)) {
      return this.outputChannels.get(workspaceFolder.name)!
    }

    const outputChannel = window.createOutputChannel(`${this.serverName}${workspaceFolder.name ? ` - ${workspaceFolder.name}` : ''}`)
    this.outputChannels.set(workspaceFolder.name, outputChannel)
    return outputChannel
  }

  protected abstract getOptions(workspaceFolder: WorkspaceFolder): Promise<[ServerOptions, LanguageClientOptions] | undefined>

  public async start(workspaceFolder: WorkspaceFolder) {
    if (this.clients.has(workspaceFolder.name)) {
      return
    }

    const outputChannel = this.getOutputChannel(workspaceFolder)
    const options = await this.getOptions(workspaceFolder)

    if (!options) {
      outputChannel.appendLine(`The ${this.serverName} was not found in the current environment.`)
      return
    }

    // eslint-disable-next-line prefer-const
    let [serverOptions, clientOptions] = options
    clientOptions.outputChannel = outputChannel

    if (this.lspPort) {
      const transport = createServerSocketTransport(this.lspPort)
      serverOptions = async () => ({ reader: transport[0], writer: transport[1] })
      clientOptions.errorHandler = {
        error: () => ({ action: ErrorAction.Continue, handled: true }),
        closed: () => ({ action: CloseAction.Restart, handled: true }),
      }
    }

    const client = new LanguageClient(`${this.id}-${workspaceFolder.name}`, outputChannel.name, serverOptions, clientOptions)

    try {
      outputChannel.appendLine(`Starting server for ${workspaceFolder.name}.`)
      await client.start() // Also launches the server
      this.clients.set(workspaceFolder.name, client)
    } catch {
      window.showErrorMessage(`Failed to start ${this.serverName}.`)
    }
  }

  public async restart(workspaceFolder: WorkspaceFolder) {
    if (this.lspPort) {
      window.showInformationMessage('Server is running in debug mode. It will not be restarted.')
      return
    }

    const client = this.clients.get(workspaceFolder.name)
    if (client) {
      await client.stop(this.stopTimeout)
      this.clients.delete(workspaceFolder.name)
    }

    await this.start(workspaceFolder)
    window.showInformationMessage(`${this.serverName} restarted successfully`)
  }

  public async stopAll(): Promise<void> {
    const promises = Array.from(this.clients.values()).map((client) => client.stop(this.stopTimeout))
    await Promise.all(promises)
    this.clients.clear()
  }
}
