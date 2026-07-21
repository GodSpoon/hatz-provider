# Changelog

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
