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

const languageServerName = 'Algorand TypeScript Language Server'
const clients: Map<string, LanguageClient> = new Map()
const outputChannels: Map<string, OutputChannel> = new Map()

const getOutputChannel = (workspaceFolder: WorkspaceFolder) => {
  if (outputChannels.has(workspaceFolder.name)) {
    return outputChannels.get(workspaceFolder.name)!
  }

  const outputChannel = window.createOutputChannel(`${languageServerName} - ${workspaceFolder.name}`)
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

export async function startLanguageServer(workspaceFolder: WorkspaceFolder) {
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
    `${languageServerName} - ${workspaceFolder.name}`,
    serverOptions,
    clientOptions
  )

  try {
    outputChannel.appendLine(`Starting language server for ${workspaceFolder.name}...`);

    // Start the client. This will also launch the server
    await client.start()
    clients.set(workspaceFolder.name, client)
  } catch {
    window.showErrorMessage('Failed to start Algorand TypeScript language server.')
  }
}

export async function restartLanguageServer(workspaceFolder: WorkspaceFolder) {
  if (lspPort) {
    window.showInformationMessage('Language server is running in debug mode. It will not be restarted.')
    return
  }

  const client = clients.get(workspaceFolder.name)
  if (client) {
    await client.stop()
    clients.delete(workspaceFolder.name)
  }

  await startLanguageServer(workspaceFolder)
  window.showInformationMessage('Algorand TypeScript language server restarted successfully')
}

export async function stopAllLanguageServers(): Promise<void> {
  const promises = Array.from(clients.values()).map((client) => client.stop())
  await Promise.all(promises)
  clients.clear()
}
