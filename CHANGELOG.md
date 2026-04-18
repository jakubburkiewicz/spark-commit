# Changelog

All notable changes to Spark Commit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.3] - 2026-04-18

### Added
- `CHANGELOG.md` with the history of all released versions.

## [0.5.2] - 2026-04-18

### Added
- GitHub Sponsors integration: `.github/FUNDING.yml`, `sponsor.url` in `package.json`, Support section in README.

## [0.5.1] - 2026-04-18

### Added
- `README.md` with installation, usage, settings reference, multi-repo behavior notes and an example Polish Conventional Commits prompt.

## [0.5.0] - 2026-04-18

### Added
- Multi-repository support. When invoked from the Command Palette without a clear context, a QuickPick lets you choose the repo — showing folder name, current branch and absolute path.

### Changed
- Replaced the arbitrary `api.repositories[0]` fallback with explicit resolution via clicked SCM → active editor → QuickPick.

## [0.4.0] - 2026-04-18

### Added
- `sparkCommit.model` setting. Appended as `--model <value>` to the Claude CLI. Accepts shortcuts (`sonnet`, `opus`, `haiku`) or exact versions like `claude-opus-4-7`. Empty uses the CLI default.

## [0.3.0] - 2026-04-18

### Added
- `sparkCommit.prompt` setting (multiline). Customizable prompt template with `{diff}` placeholder. If the placeholder is missing, the diff is appended at the end.

## [0.2.0] - 2026-04-18

### Added
- `sparkCommit.cliPath` setting. Absolute path to the Claude CLI for environments where VS Code doesn't inherit PATH from the shell.

### Changed
- ENOENT errors now distinguish between missing `git` and missing `claude` — the latter hints at the new setting.

## [0.1.1] - 2026-04-18

### Fixed
- Unfriendly `spawn claude ENOENT` error replaced with a readable message suggesting to install Claude CLI or check PATH.

## [0.1.0] - 2026-04-18

### Added
- Initial MVP: click the ✨ icon in the Source Control title → read staged diff → generate commit message via Claude CLI → populate the commit message field.
- Animated per-repo placeholder `⏳ Generating commit message…` while the CLI runs.
- Progress indicator in the status bar during generation.
- Error handling surfaces failures as toast messages.
- Concurrent invocations ignored until the current one finishes.
