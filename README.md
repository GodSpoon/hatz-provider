# hatz-provider

Installs Hatz AI as a model provider for coding agents. One command:

```bash
npx hatz-provider install
```

## Supported agents

| Agent | Config location | API surface |
|-------|----------------|-------------|
| [omp](https://omp.sh) | `~/.omp/agent/models.yml` | anthropic-messages |
| [pi](https://pi.dev) | `~/.pi/extensions/hatz/` | anthropic-messages |
| [Claude Code](https://claude.ai) | `~/.claude/.env` | anthropic-messages |
| [Hermes](https://hermesagent.com) | `~/.hermes/config.yaml` + `.env` | openai-completions |
| [OpenClaw](https://openclaw.ai) | `~/.openclaw/openclaw.json` | openai-completions |

## Quick start

```bash
# Get an API key at https://ai.hatz.ai (Workspace → API Keys)
export HATZ_API_KEY="hzat-..."

# Install for every detected agent
npx hatz-provider install

# Or just one
npx hatz-provider install omp
npx hatz-provider install claude-code
```

## Commands

```
hatz-provider install [agent]     Install provider (fetches live catalog)
hatz-provider update [agent]      Refresh models from live catalog
hatz-provider uninstall [agent]   Remove provider
hatz-provider status              Show install status across agents
hatz-provider list                List all available models
```

Agents: `omp`, `pi`, `hermes`, `claude-code`, `openclaw`, `all` (default).

## How it works

The installer fetches the live Hatz model catalog (80+ models from Anthropic, OpenAI, Google, xAI, DeepSeek, Meta, Mistral, and others) and writes a guarded block into each agent's config:

- omp, pi, and Claude Code use the Anthropic Messages gateway at `https://ai.hatz.ai/v1/anthropic`, with proper SSE streaming and full event payloads.
- Hermes and OpenClaw use the OpenAI-compatible endpoint at `https://ai.hatz.ai/v1`.

## Requirements

- [Bun](https://bun.sh) (the CLI is TypeScript, executed by bun)
- A [Hatz AI](https://ai.hatz.ai) API key

## Updating models

Run `install` or `update` again. Only the Hatz block in each config is touched; other providers are left alone.

## License

MIT
