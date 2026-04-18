import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as path from 'path';
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
        vscode.window.showErrorMessage(`Spark Commit: ${toUserMessage(err)}`);
      } finally {
        generating = false;
      }
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {}

function toUserMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
    const path = (err as NodeJS.ErrnoException).path ?? 'required binary';
    if (path === 'git') {
      return '`git` not found. Install Git or make sure it is on PATH.';
    }
    return `\`${path}\` not found. Install Claude CLI, add it to PATH, or set \`sparkCommit.cliPath\` in settings.`;
  }
  return err instanceof Error ? err.message : String(err);
}

async function getGitRepo(uri?: vscode.Uri): Promise<any> {
  const extension = vscode.extensions.getExtension('vscode.git');
  if (!extension) return undefined;
  const exports = extension.isActive ? extension.exports : await extension.activate();
  const api = exports.getAPI(1);

  if (uri) {
    const repo = api.getRepository(uri);
    if (repo) return repo;
  }

  if (api.repositories.length === 0) return undefined;
  if (api.repositories.length === 1) return api.repositories[0];

  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri) {
    const repo = api.getRepository(activeUri);
    if (repo) return repo;
  }

  return pickRepo(api.repositories);
}

async function pickRepo(repos: any[]): Promise<any | undefined> {
  const items = repos.map((repo) => {
    const root = repo.rootUri.fsPath as string;
    const branch = repo.state?.HEAD?.name as string | undefined;
    return {
      label: path.basename(root),
      description: branch ? `$(git-branch) ${branch}` : undefined,
      detail: root,
      repo,
    };
  });

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select repository for Spark Commit',
    matchOnDetail: true,
  });

  return picked?.repo;
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

  const config = vscode.workspace.getConfiguration('sparkCommit');

  const template = config.get<string>('prompt') ?? '';
  const prompt = template.includes('{diff}')
    ? template.replace('{diff}', trimmedDiff)
    : `${template}\n\n${trimmedDiff}`;

  const cliPath = config.get<string>('cliPath');
  const cli = cliPath && cliPath.trim() ? cliPath.trim() : 'claude';

  const args = ['-p', prompt];
  const model = config.get<string>('model')?.trim();
  if (model) {
    args.unshift('--model', model);
  }

  const { stdout } = await execFileAsync(cli, args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}
