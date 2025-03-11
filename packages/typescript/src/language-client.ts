import { window, OutputChannel } from 'vscode'
import { WorkspaceFolder } from 'vscode'
import {
  CloseAction,
  createServerSocketTransport,
  ErrorAction,
  ErrorHandler,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'
import { getDebugLspPort } from 'common/utils/get-debug-lsp-port'

const algorandTypeScript = 'Algorand TypeScript'
const clients: Map<string, LanguageClient> = new Map()
const outputChannels: Map<string, OutputChannel> = new Map()

const getOutputChannel = (workspaceFolder: WorkspaceFolder) => {
  if (outputChannels.has(workspaceFolder.name)) {
    return outputChannels.get(workspaceFolder.name)!
  }

  const outputChannel = window.createOutputChannel(`${algorandTypeScript} - ${workspaceFolder.name}`)
  outputChannels.set(workspaceFolder.name, outputChannel)
  return outputChannel
}

const getDebugErrorHandler = (): ErrorHandler  => {
  return {
    error() {
      return { action: ErrorAction.Continue, handled: true }
    },
    closed() {
      return { action: CloseAction.Restart, handled: true }
    },
  }
}

const lspPort = getDebugLspPort()

export async function startLanguageClient(workspaceFolder: WorkspaceFolder) {
  if (clients.has(workspaceFolder.name)) {
    return
  }

  const serverOptions: ServerOptions = lspPort
    ? async () => {
        // The method name createServerSocketTransport is misleading.
        // This makes the extension becomes the client of the websocket connection
        const transport = createServerSocketTransport(lspPort)
        return { reader: transport[0], writer: transport[1] }
      }
    : {
        command: 'npx',
        args: ['run-language-server'],
        transport: TransportKind.stdio,
        options: {
          cwd: workspaceFolder.uri.fsPath,
          shell: true,
        },
      }

  const outputChannel = getOutputChannel(workspaceFolder)

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      {
        language: 'typescript',
        pattern: `${workspaceFolder.uri.fsPath}/**/*`,
      },
    ],
    workspaceFolder: workspaceFolder,
    outputChannel: outputChannel,
    errorHandler: lspPort ? getDebugErrorHandler() : undefined,
  }

  const client = new LanguageClient(
    `pupats-${workspaceFolder.name}`,
    `${algorandTypeScript} - ${workspaceFolder.name}`,
    serverOptions,
    clientOptions
  )

  try {
    outputChannel.appendLine(`Starting server for ${workspaceFolder.name}.`);

    // Start the client. This will also launch the server
    await client.start()
    clients.set(workspaceFolder.name, client)
  } catch {
    window.showErrorMessage('Failed to start Algorand TypeScript server.')
  }
}

export async function restartLanguageClient(workspaceFolder: WorkspaceFolder) {
  if (lspPort) {
    window.showInformationMessage('Server is running in debug mode. It will not be restarted.')
    return
  }

  const client = clients.get(workspaceFolder.name)
  if (client) {
    await client.stop()
    clients.delete(workspaceFolder.name)
  }

  await startLanguageClient(workspaceFolder)
  window.showInformationMessage('Algorand TypeScript server restarted successfully')
}

export async function stopAllLanguageClients(): Promise<void> {
  const promises = Array.from(clients.values()).map((client) => client.stop())
  await Promise.all(promises)
  clients.clear()
}
