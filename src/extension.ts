import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    'spark-commit.generate',
    async (sourceControl?: vscode.SourceControl) => {
      const repo = await getGitRepo(sourceControl?.rootUri);
      if (!repo) {
        vscode.window.showErrorMessage('Spark Commit: no Git repository found in this workspace.');
        return;
      }

      const diff = await getStagedDiff(repo.rootUri.fsPath);
      if (!diff.trim()) {
        vscode.window.showWarningMessage('Spark Commit: no staged changes. Run git add first.');
        return;
      }

      vscode.window.showInformationMessage(`Spark Commit: read ${diff.length} chars of staged diff.`);
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {}

async function getGitRepo(uri?: vscode.Uri): Promise<any> {
  const extension = vscode.extensions.getExtension('vscode.git');
  if (!extension) return undefined;
  const exports = extension.isActive ? extension.exports : await extension.activate();
  const api = exports.getAPI(1);

  const candidates: (vscode.Uri | undefined)[] = [
    uri,
    vscode.window.activeTextEditor?.document.uri,
    vscode.workspace.workspaceFolders?.[0]?.uri,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const repo = api.getRepository(candidate);
    if (repo) return repo;
  }

  return api.repositories[0];
}

async function getStagedDiff(cwd: string): Promise<string> {
  const { stdout } = await execFileAsync('git', ['diff', '--staged'], {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}
