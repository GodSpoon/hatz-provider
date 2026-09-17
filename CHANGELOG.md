# Changelog

## [1.2.1] - 2026-09-17

### Changed
- README rewritten: auto-detect behavior, interactive key prompt, and PowerShell/cmd/bash key examples.

## [1.2.0] - 2026-09-17

### Changed
- `install`/`uninstall` with no agent now auto-detect installed agents by their config directory (`~/.omp`, `~/.pi`, `~/.hermes`, `~/.claude`, `~/.openclaw`) and skip the rest.
- Explicit `install <agent>` still force-installs regardless of detection.

### Fixed
- Removed duplicate `readline` import in cli.ts.

## [1.1.9] - 2026-09-17

### Fixed
- Removed unreachable `if (!apiKey)` guards now that `getApiKey()` always returns a non-empty value (prompts in TTY, bails with shell-specific instructions otherwise).

## [1.1.8] - 2026-09-17

### Fixed
- Interactive `HATZ_API_KEY` prompt now re-asks if you press Enter without typing a key.
- All missing-key error messages are now universal (PowerShell/cmd/bash examples).

## [1.1.7] - 2026-09-17

### Fixed
- `cli.ts` now actually prompts for `HATZ_API_KEY` when missing (masked input in TTY), with shell-specific fallback instructions for PowerShell, cmd.exe, and bash/zsh.

## [1.1.6] - 2026-09-17

### Fixed
- `cli.ts` now interactively prompts for `HATZ_API_KEY` when it is not set, instead of showing a Unix-only `export` command. Non-TTY usage shows platform-specific examples for PowerShell, cmd.exe, and bash/zsh.

## [1.1.5] - 2026-09-17

### Fixed
- `cli.js` now resolves the real `bun.exe` on Windows (global npm install or `BUN_INSTALL`/`~/.bun`) and spawns it directly, fixing the `EINVAL` regression from v1.1.4 and avoiding the DEP0190 warning.

## [1.1.4] - 2026-09-17

### Fixed
- `cli.js` now spawns `bun.cmd` directly on Windows instead of using `shell: true`, removing the Node DEP0190 deprecation warning and the command-injection risk from unescaped arguments.

## [1.1.3] - 2026-09-17

### Fixed
- Removed `bun` from `dependencies` so the package no longer bundles a platform-specific `bun` binary that fails on some Windows installs. Users must have Bun installed globally (already documented in README).

## [1.1.2] - 2026-09-17

### Fixed
- Switched npm publish from OIDC trusted publishing to `NODE_AUTH_TOKEN` because OIDC was not configured for this package at npmjs.com.
- Removed `--provenance` flag (requires OIDC).

## [1.1.1] - 2026-09-17

### Fixed
- Removed broken `prepare: skilld prepare` script and unused `npm-skills` dependency that caused npm publish to fail (`skilld: not found`).
- Added `npm ci` to publish workflow so dependencies are installed before publish.

## [1.1.0] - 2026-07-30

### Added
- `usage` command — shows Hatz credit usage and billing info
- `--dry-run` / `-n` flag — preview install/uninstall without writing files
- `supportsReasoning()` and `supportsVision()` helpers in catalog — models only get `reasoning: true` when they actually support it
- Developer-based context window estimation (cleaner than regex-only)

### Fixed
- omp: API key now written as `$HATZ_API_KEY` env reference instead of literal key
- omp: added `authHeader: true` for proper Bearer token injection
- Hermes: config.yaml now writes an actual `providers.hatz.base_url` entry (was comment-only, did nothing)
- Hermes: uninstall now removes the `providers.hatz` YAML block, not just the comments
- pi: removed needless dynamic import in `isInstalled()`
- pi: removed unused `inputCapabilities` import
- openclaw: removed unused catalog imports
- package.json: fixed malformed JSON (stray braces in scripts block)
- catalog: fixed regex to catch bare `o3`/`o4` model names

### Changed
- README rewritten — humanized, credits creator (Sam Ko), concise


## [1.0.3] - 2026-07-26

### Fixed
- Published tarball was missing the entire CLI source: `files` pointed at a nonexistent `src/` directory, so `npx hatz-provider` shipped only docs and a broken entry point. `cli.js` now resolves `cli.ts` at the package root and `files` includes `cli.ts`, `catalog.ts`, and `agents/`.
- Slimmed README, removed em dashes from package description.

## [1.0.0] — 2026-07-21

### Added
- Initial release: Hatz AI provider installer for coding agents
- Multi-agent support: omp, pi, Claude Code, Hermes, OpenClaw
- Live model catalog fetch from Hatz API (80+ models)
- `install` / `update` / `uninstall` / `status` / `list` / `catalog` commands
- Auto-detection of installed agents
- Per-agent API surface selection (anthropic-messages vs openai-completions)
- Guard-commented config blocks — safe to merge with existing configs
- Zero hardcoded secrets — API key always from environment

### Design decisions
- **Anthropic Messages** for omp/pi/claude-code: proper SSE streaming, full event payloads
- **OpenAI Completions** for hermes/openclaw: only OpenAI-compatible surfaces supported
- **Literal API keys** in config files: agents that don't resolve `$VAR` env references get the key directly; pi resolves `$HATZ_API_KEY` natively
