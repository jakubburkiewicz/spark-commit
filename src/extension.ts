import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const MAX_DIFF_CHARS = 8000;
const PLACEHOLDER_FRAMES = [
  '⏳ Generating commit message',
  '⏳ Generating commit message.',
  '⏳ Generating commit message..',
  '⏳ Generating commit message...',
];
const PLACEHOLDER_FRAME_MS = 400;

export function activate(context: vscode.ExtensionContext) {
  let generating = false;

  const command = vscode.commands.registerCommand(
    'spark-commit.generate',
    async (sourceControl?: vscode.SourceControl) => {
      if (generating) return;
      generating = true;

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Window,
            title: 'Spark Commit: generating…',
          },
          async () => {
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

            let frameIndex = 0;
            repo.inputBox.value = PLACEHOLDER_FRAMES[0];
            const interval = setInterval(() => {
              frameIndex = (frameIndex + 1) % PLACEHOLDER_FRAMES.length;
              repo.inputBox.value = PLACEHOLDER_FRAMES[frameIndex];
            }, PLACEHOLDER_FRAME_MS);

            try {
              const message = await generateWithClaude(diff, cwd);
              repo.inputBox.value = message.trim();
            } catch (err) {
              repo.inputBox.value = '';
              throw err;
            } finally {
              clearInterval(interval);
            }
          }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Spark Commit: ${msg}`);
      } finally {
        generating = false;
      }
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
