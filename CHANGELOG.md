# Changelog

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
