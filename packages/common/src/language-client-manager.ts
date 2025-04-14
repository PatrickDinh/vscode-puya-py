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
import { exec } from 'child_process'

type OptionsSuccess = {
  type: 'success'
  server: ServerOptions
  client: LanguageClientOptions
}

type OptionsFailure = {
  type: 'failure'
  message: string
}

type WorkspaceContext = {
  workspaceFolder: WorkspaceFolder
  outputChannel: OutputChannel
  client?: LanguageClient
}

export type OptionsResult = OptionsSuccess | OptionsFailure

export abstract class LanguageClientManager {
  private workspaceContext: Map<string, WorkspaceContext> = new Map()
  private readonly stopTimeout = 3_000
  private readonly lspPort = getDebugLspPort()
  private readonly serverName: string

  protected readonly serverNotAvailableMessage: string

  constructor(language: string, protected readonly id: string) {
    this.serverName = `${language} Language Server`
    this.serverNotAvailableMessage = `The ${this.serverName} was not found in the current environment.`
  }

  protected abstract getOptions(workspaceFolder: WorkspaceFolder, outputChannel: OutputChannel): Promise<OptionsResult>

  public async startClient(workspaceFolder: WorkspaceFolder) {
    const context = this.workspaceContext.get(workspaceFolder.name)

    if (context && context.client) {
      return
    }

    const outputChannel =
      context?.outputChannel ?? window.createOutputChannel(`${this.serverName}${workspaceFolder.name ? ` - ${workspaceFolder.name}` : ''}`)
    const options = await this.getOptions(workspaceFolder, outputChannel)

    if (options.type === 'failure') {
      outputChannel.appendLine(options.message)
      return
    }

    // eslint-disable-next-line prefer-const
    let { server: serverOptions, client: clientOptions } = options
    clientOptions.outputChannel = outputChannel

    if (this.lspPort) {
      const lspPort = this.lspPort
      serverOptions = async () => {
        const transport = createServerSocketTransport(lspPort)
        return { reader: transport[0], writer: transport[1] }
      }
      clientOptions.errorHandler = {
        error: () => ({ action: ErrorAction.Continue, handled: true }),
        closed: () => ({ action: CloseAction.Restart, handled: true }),
      }
    }

    const client = new LanguageClient(`${this.id}-${workspaceFolder.name}`, outputChannel.name, serverOptions, clientOptions)

    try {
      outputChannel.appendLine(`Starting server for ${workspaceFolder.name}.`)
      await client.start() // Also launches the server
      this.workspaceContext.set(workspaceFolder.name, { workspaceFolder, client, outputChannel })
    } catch {
      window.showErrorMessage(`Failed to start ${this.serverName}.`)
    }
  }

  public async restartClient(workspaceFolder: WorkspaceFolder) {
    const context = this.workspaceContext.get(workspaceFolder.name)

    if (!context) {
      return
    }

    if (this.lspPort) {
      context.outputChannel.appendLine('Server is running in debug mode. It will not be restarted.')
      return
    }

    if (context.client) {
      await context.client.restart()
      context.outputChannel.appendLine(`${this.serverName} has been restarted`)
    }
  }

  public async restartClients() {
    await Promise.all(
      Array.from(this.workspaceContext.values(), async (context) => {
        await context.client?.restart()
        context.outputChannel.appendLine(`${this.serverName} has been restarted`)
      })
    )
  }

  public async stopClient(workspaceFolder: WorkspaceFolder) {
    const context = this.workspaceContext.get(workspaceFolder.name)
    if (context && context.client) {
      await context.client.stop(this.stopTimeout)
      this.workspaceContext.set(workspaceFolder.name, { ...context, client: undefined })
      context.outputChannel.appendLine(`${this.serverName} has been stopped`)
    }
  }

  public async stopClients(): Promise<void> {
    await Promise.all(Array.from(this.workspaceContext.values(), (context) => this.stopClient(context.workspaceFolder)))
  }

  public managedWorkspaces(): WorkspaceFolder[] {
    return Array.from(this.workspaceContext.values(), (wc) => wc.workspaceFolder)
  }

  protected async commandSucceeds(params: { command: string; args?: string[]; options?: { cwd?: string } }): Promise<boolean> {
    const { command, args, options } = {
      ...params,
      args: (params.args ?? []).concat('--version'), // Assumes the command supports the --version argument
    }

    try {
      await new Promise<void>((resolve, reject) => {
        exec(`${command} ${args.join(' ')}`, options, (error: Error | null) => (error ? reject(error) : resolve()))
      })
      return true
    } catch {
      return false
    }
  }
}
