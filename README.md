# Spark Commit

AI-powered git commit message generator for VS Code. Click the ✨ button in the Source Control panel and let [Claude Code](https://claude.com/claude-code) draft your commit message from the staged diff.

Spark Commit adds no proxy, no telemetry, and no third-party collection of its own. Your staged diff flows from VS Code to the Claude CLI on your machine, which then sends it to Anthropic under your own account — the same data path `claude` uses when you run it in a terminal.

## Requirements

- **Claude Code CLI** installed and authenticated. Verify with `claude --version`.
- Git (comes with VS Code's git extension; the CLI must be on PATH).
- VS Code `^1.85.0`.

## Install

From the VS Code Marketplace: search for **Spark Commit** and install.

Or build from source:

```bash
npm install
npm run compile
npm run package
code --install-extension spark-commit-*.vsix
```

## Usage

1. Stage changes with `git add` (or via the Source Control panel).
2. Open the Source Control panel.
3. Click the ✨ icon in the panel's title bar.
4. The commit message field animates with `⏳ Generating commit message…`.
5. Claude reads the staged diff, generates a message, and writes it to the field.
6. Review, edit if needed, commit.

The button also works via the Command Palette: **Spark Commit: Generate Commit Message**.

In a multi-repository workspace the button operates on the repo whose title you clicked. When invoked from the Command Palette, the extension picks the repo of the active editor — or asks you if none matches.

## Settings

Open **Preferences → Extensions → Spark Commit**.

| Setting | Description |
| --- | --- |
| `sparkCommit.cliPath` | Absolute path to the Claude CLI. Leave empty to use `claude` from PATH. Useful when VS Code doesn't inherit PATH from your shell. |
| `sparkCommit.prompt` | Prompt template passed to Claude. Use `{diff}` as a placeholder for the staged diff. If `{diff}` is missing, the diff is appended at the end. |
| `sparkCommit.model` | Model passed to the Claude CLI via `--model`. Shortcuts: `sonnet`, `opus`, `haiku`. Exact versions like `claude-opus-4-7` also work. Empty = CLI default. |

### Example: Conventional Commits in Polish

```
Wygeneruj commit message po polsku w stylu conventional commits
(feat/fix/chore/refactor/docs/test/...).
Pierwsza linia max 72 znaki w trybie rozkazującym, bez markdownu.

{diff}
```

## Why Spark Commit

The VS Code Source Control panel has a built-in ✨ button, but it only works with GitHub Copilot and can't be rebound to another provider. Community alternatives exist but are small projects without audit. Spark Commit is minimal (≈150 lines of TypeScript, no runtime dependencies) — you can read the whole source before trusting it.

## Support

If Spark Commit saves you time, consider [sponsoring on GitHub](https://github.com/sponsors/jakubburkiewicz).

## License

[MIT](./LICENSE)
