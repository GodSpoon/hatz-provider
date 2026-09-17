# Changelog

## [1.2] - 2026-09-17 (npm 1.2.2)

### Added
- Interactive masked `HATZ_API_KEY` prompt when running in a terminal; re-prompts on empty input.
- Shell-specific (PowerShell / cmd.exe / bash-zsh) instructions when no key and no TTY.

### Changed
- `install`/`uninstall` with no agent auto-detect installed agents by their config directory (`~/.omp`, `~/.pi`, `~/.hermes`, `~/.claude`, `~/.openclaw`) and skip the rest; explicit `install <agent>` force-installs.
- pi extension moved to `~/.pi/agent/extensions/hatz/` (current discovery root; `~/.pi/extensions` is no longer scanned).
- Claude Code now persists gateway vars in the `env` block of `~/.claude/settings.json` using `ANTHROPIC_AUTH_TOKEN` (`Authorization: Bearer` — the Hatz `/v1/anthropic` surface rejects `X-Api-Key`). Stale `~/.claude/.env` blocks are cleaned up.
- Hermes providers block rewritten for config v12: `base_url` + `transport: chat_completions` + `key_env` (the old `api: openai-completions` was parsed as a URL and broken).
- omp `apiKey` now uses the bare env-var name `HATZ_API_KEY` (the `$`-prefixed form is treated as a literal).

### Fixed
- Windows: resolve and spawn the real `bun.exe` directly (`EINVAL`/`DEP0190` fixes); removed bundled `bun` dependency.
- Removed unreachable API-key bail guards and a duplicate `readline` import.
- README rewritten for current behavior.

### Security
- npm publishes use a `NODE_AUTH_TOKEN` automation token (OIDC was not configured).

## [1.0.3] - baseline

- Fix broken publish (missing sources in tarball), slim README.
