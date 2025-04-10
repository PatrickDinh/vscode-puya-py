import { WorkspaceFolder } from 'vscode'
import { TransportKind } from 'vscode-languageclient/node'
import { LanguageClientManager, OptionsResult } from 'common/language-client-manager'

export class TypeScriptLanguageClientManager extends LanguageClientManager {
  constructor() {
    super('Algorand TypeScript', 'puyats')
  }

  protected async getOptions(workspaceFolder: WorkspaceFolder): Promise<OptionsResult> {
    const serverOptions = {
      command: 'npx',
      args: ['--no-install', '-p', '@algorandfoundation/puya-ts', 'puyats-ls'],
      transport: TransportKind.stdio,
      options: {
        cwd: workspaceFolder.uri.fsPath,
        shell: true,
      },
    }

    if (!(await this.commandSucceeds({ ...serverOptions, args: serverOptions.args.concat('--version') }))) {
      return { type: 'failure', message: this.serverNotAvailableMessage }
    }

    return {
      type: 'success',
      server: serverOptions,
      client: {
        documentSelector: [{ language: 'typescript', pattern: `${workspaceFolder.uri.fsPath}/**/*` }],
        workspaceFolder: workspaceFolder,
      },
    }
  }
}
