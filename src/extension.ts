import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('spark-commit.generate', async () => {
    const repo = await getGitRepo();
    if (!repo) {
      vscode.window.showErrorMessage('Spark Commit: no Git repository found in this workspace.');
      return;
    }
    vscode.window.showInformationMessage(`Spark Commit: found repo at ${repo.rootUri.fsPath}`);
  });

  context.subscriptions.push(command);
}

export function deactivate() {}

async function getGitRepo(): Promise<any> {
  const extension = vscode.extensions.getExtension('vscode.git');
  if (!extension) return undefined;
  const exports = extension.isActive ? extension.exports : await extension.activate();
  const api = exports.getAPI(1);
  return api.repositories[0];
}
