# AlgoKit Languages Visual Studio Code Extension for Contributors

## Setup

### Initial Setup

1. Clone this repository.
1. Run `npm i` at the root to install the dependencies.
1. Open the repository root in VS Code as a workspace.
1. Install recommended extensions.

### Run/Debug the Algorand Python Extension

1. Run either the "Launch Algorand Python (python)" or "Launch Python (python)" configurations via the "Run and Debug" pane.
1. A new "Extension Development Host" VS Code instance will be launched.
1. Run `poetry install` to bootstrap the project dependencies.
1. Begin tweaking the relevant Algorand Python or Python source code to see the language server in action.

### Run/Debug the Algorand TypeScript Extension

1. Run either the "Launch Algorand TypeScript (typescript)" or "Launch TypeScript (typescript)" configurations via the "Run and Debug" pane.
1. A new "Extension Development Host" VS Code instance will be launched.
1. Run `npm install` to bootstrap the project dependencies.
1. Begin tweaking the relevant Algorand TypeScript or TypeScript source code to see the language server in action.

### Create and Install a Test Extension Package

1. Ensure you're current working directory is within either the `python` or `typescript` package workspace.
1. Run `npm run build`.
1. Run `npm run package` to produce a `.vsix` package in the package workspace root.
1. Open a repository containing the smart contract you'd like to interact with or test in VS Code and install the Algorand Python or Algorand TypeScript `.vsix` package.
1. Begin authoring or editing the smart contract to see relevant language server diagnostics.

### Debug the Language Server Client and Language Server

1. Uncomment `"env": { "ALGORAND_LSP_PORT": "8888" }` in `launch.json` located in the `python` or `typescript` package workspace `.vscode` directory.
1. Run the relevant language server bound on port `8888`.
1. Run `npm i` inside the `avm-debugger` repository to install the dependencies.
1. Open the `avm-debugger` repository root in VS Code.
1. Run the "Server" configuration via the "Run and Debug" pane, which starts the debug adapter on port 4711.
1. Run the steps in [Run/Debug the Algorand Python Extension](#rundebug-the-algorand-python-extension) or [Run/Debug the Algorand TypeScript Extension](#rundebug-the-algorand-typescript-extension).

## Commits

We are using the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) standard for commit messages. This allows us to automatically generate release notes and version numbers. We do this via [Semantic Release](https://semantic-release.gitbook.io/semantic-release/) and [GitHub actions](.github/workflows/cd.yaml).
