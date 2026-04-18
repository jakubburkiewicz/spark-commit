import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('spark-commit.generate', async () => {
    await vscode.window.showInformationMessage('Spark Commit: hello');
  });

  context.subscriptions.push(command);
}

export function deactivate() {}
