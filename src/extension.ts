import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const MAX_DIFF_CHARS = 8000;

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    'spark-commit.generate',
    async (sourceControl?: vscode.SourceControl) => {
      const repo = await getGitRepo(sourceControl?.rootUri);
      if (!repo) {
        vscode.window.showErrorMessage('Spark Commit: no Git repository found in this workspace.');
        return;
      }

      const cwd = repo.rootUri.fsPath;
      const diff = await getStagedDiff(cwd);
      if (!diff.trim()) {
        vscode.window.showWarningMessage('Spark Commit: no staged changes. Run git add first.');
        return;
      }

      const message = await generateWithClaude(diff, cwd);
      const firstLine = message.split('\n')[0].trim();
      vscode.window.showInformationMessage(`Spark Commit: ${firstLine}`);
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

async function generateWithClaude(diff: string, cwd: string): Promise<string> {
  const trimmedDiff =
    diff.length > MAX_DIFF_CHARS ? diff.slice(0, MAX_DIFF_CHARS) + '\n... (diff truncated)' : diff;

  const prompt = [
    'Generate a concise git commit message for the following staged diff.',
    'Use imperative mood. First line max 72 characters. No markdown, no backticks.',
    'If the change is complex, add a blank line and a short body.',
    '',
    trimmedDiff,
  ].join('\n');

  const { stdout } = await execFileAsync('claude', ['-p', prompt], {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}
