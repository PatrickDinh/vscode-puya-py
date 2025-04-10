import { workspace, ExtensionContext, window, TextDocument, commands, Uri } from 'vscode'
import { PythonExtension } from '@vscode/python-extension'
import { PythonLanguageClientManager } from './language-client-manager'

const clientManager = new PythonLanguageClientManager()

const extensionNamespace = 'algorandPython'
const languageServerEnableConfigId = 'languageServer.enable'
const languageServerRestartCommandId = 'languageServer.restart'

async function onDocumentOpenedHandler(_: ExtensionContext, document: TextDocument) {
  if (document.languageId === 'python') {
    const folder = workspace.getWorkspaceFolder(document.uri)
    if (folder) {
      const config = workspace.getConfiguration(extensionNamespace, folder.uri)
      const enabled = config.get<boolean | null>(languageServerEnableConfigId) ?? false
      if (enabled) {
        await clientManager.startClient(folder)
      }
    }
  }
}

async function onPythonEnvironmentChangedHandler(resource: Uri) {
  const folder = workspace.getWorkspaceFolder(resource)
  if (folder) {
    await clientManager.restartClient(folder)
  }
}

async function restartLanguageClientCommand() {
  const editor = window.activeTextEditor
  const folder = editor ? workspace.getWorkspaceFolder(editor.document.uri) : undefined
  if (!editor || !folder) {
    await clientManager.restartClients()
    return
  }

  await clientManager.restartClient(folder)
}

export async function activate(context: ExtensionContext) {
  // TODO: check if the python extension is installed
  const pythonApi = await PythonExtension.api()

  // Register restart command
  context.subscriptions.push(
    commands.registerCommand(`${extensionNamespace}.${languageServerRestartCommandId}`, restartLanguageClientCommand)
  )

  // Handle already opened documents
  if (window.activeTextEditor?.document) {
    await onDocumentOpenedHandler(context, window.activeTextEditor.document)
  }

  // Setup handler for newly opened documents
  context.subscriptions.push(
    workspace.onDidOpenTextDocument(async (document: TextDocument) => {
      await onDocumentOpenedHandler(context, document)
    })
  )

  // Handle interpreter changes
  context.subscriptions.push(
    pythonApi.environments.onDidChangeActiveEnvironmentPath(async (e) => {
      if (e.resource) {
        // TODO: what happen if the resource is undefined?
        await onPythonEnvironmentChangedHandler(e.resource.uri)
      }
    })
  )

  // Handle workspace folder removal
  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(async (event) => {
      for (const folder of event.removed) {
        await clientManager.restartClient(folder)
      }
    })
  )

  // Handle config changes
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async (event) => {
      clientManager.managedWorkspaces().forEach(async (workspaceFolder) => {
        if (event.affectsConfiguration(`${extensionNamespace}.${languageServerEnableConfigId}`, workspaceFolder)) {
          const config = workspace.getConfiguration(extensionNamespace, workspaceFolder.uri)
          let enabled = config.get<boolean | null>(languageServerEnableConfigId) ?? false

          if (enabled) {
            await clientManager.startClient(workspaceFolder)
          } else {
            await clientManager.stopClient(workspaceFolder)
          }
        }
      })
    })
  )
}

export async function deactivate(): Promise<void> {
  await clientManager.stopClients()
}
