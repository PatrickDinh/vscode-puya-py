import { WorkspaceFolder } from 'vscode'
import { LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { LanguageClientBase } from 'common/language-client-base'

export class TypeScriptLanguageClient extends LanguageClientBase {
  constructor() {
    super('Algorand TypeScript', 'puyats')
  }

  protected async getOptions(workspaceFolder: WorkspaceFolder): Promise<[ServerOptions, LanguageClientOptions]> {
    return [
      {
        command: 'npx',
        args: ['run-language-server'],
        transport: TransportKind.stdio,
        options: {
          cwd: workspaceFolder.uri.fsPath,
          shell: true,
        },
      },
      {
        documentSelector: [{ language: 'typescript', pattern: `${workspaceFolder.uri.fsPath}/**/*` }],
        workspaceFolder: workspaceFolder,
      },
    ]
  }
}
