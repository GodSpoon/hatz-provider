# hatz-provider

Install Hatz AI as a provider for any coding agent — one command.

```bash
npx hatz-provider install
```

## Supported Agents

| Agent | Config location | API surface |
|-------|----------------|-------------|
| [omp](https://omp.sh) | `~/.omp/agent/models.yml` | anthropic-messages |
| [pi](https://pi.dev) | `~/.pi/extensions/hatz/` | anthropic-messages |
| [Claude Code](https://claude.ai) | `~/.claude/.env` | anthropic-messages |
| [Hermes](https://hermesagent.com) | `~/.hermes/config.yaml` + `.env` | openai-completions |
| [OpenClaw](https://openclaw.ai) | `~/.openclaw/openclaw.json` | openai-completions |

## Quick Start

```bash
# Set your Hatz API key (get one at https://ai.hatz.ai → Workspace → API Keys)
export HATZ_API_KEY="hzat-..."

# Install for all detected agents
npx hatz-provider install

# Or pick one
npx hatz-provider install omp
npx hatz-provider install claude-code
```

## Commands

```
hatz-provider install [agent]     Install provider (fetches live catalog)
hatz-provider update [agent]      Refresh models from live catalog
hatz-provider uninstall [agent]   Remove provider
hatz-provider status              Show install status across agents
hatz-provider list                List all 80+ available models
```

Agents: `omp`, `pi`, `hermes`, `claude-code`, `openclaw`, `all` (default).

## How It Works

Fetches Hatz's live model catalog (80+ models across Anthropic, OpenAI, Google, xAI, DeepSeek, Meta, Mistral, and more) and writes the appropriate config for each agent:

- **omp, pi, Claude Code** use the Anthropic Messages gateway at `https://ai.hatz.ai/v1/anthropic` — proper SSE streaming with full event payloads.
- **Hermes, OpenClaw** use the standard OpenAI-compatible endpoint at `https://ai.hatz.ai/v1`.

## Requirements

- [Bun](https://bun.sh) runtime (the CLI is TypeScript)
- A [Hatz AI](https://ai.hatz.ai) API key

## Model Updates

Re-run `install` or `update` anytime. Only the Hatz block in each agent's config is touched — other providers are safe.

## License

MIT
