# hatz-provider

Adds Hatz AI as a model provider to your coding agents. One command.

```bash
npx hatz-provider install
```

Built by [Sam Ko](https://github.com/GodSpoon). Hatz (hatz.ai) is the provider.

## What it does

Points your coding agents at the Hatz AI API so you can use 80+ models (OpenAI, Anthropic, Google, xAI, DeepSeek, Meta, Mistral, and others) through one API key.

Each agent gets the right API surface for how it talks to models:

- **omp, pi, Claude Code** → Anthropic Messages (`/v1/anthropic`)
- **Hermes, OpenClaw** → OpenAI Completions (`/v1`)

Config blocks are guarded with comment markers. Reinstalling or updating only touches the Hatz section and leaves your other providers alone.

## Supported agents

| Agent | Config written |
|-------|---------------|
| [omp](https://omp.sh) | `~/.omp/agent/models.yml` |
| [pi](https://pi.dev) | `~/.pi/extensions/hatz/` |
| [Claude Code](https://claude.ai) | `~/.claude/.env` |
| [Hermes](https://hermesagent.com) | `~/.hermes/config.yaml` + `.env` |
| [OpenClaw](https://openclaw.ai) | `~/.openclaw/openclaw.json` |

## Quick start

```bash
# Get an API key: https://ai.hatz.ai → Workspace → API Keys
export HATZ_API_KEY="hzat-..."

# Install everywhere
npx hatz-provider install

# Or pick one
npx hatz-provider install omp
npx hatz-provider install hermes
```

## Commands

```
install [agent]     Add Hatz provider (fetches live model catalog)
update [agent]      Refresh models from the catalog
uninstall [agent]   Remove Hatz provider
status              Show which agents have Hatz installed
list                Print all available models
usage               Show Hatz credit usage
catalog             Dump omp models.yml block
-n, --dry-run       Preview changes without writing files
```

Default agent is `all` (every detected agent).

## How it works

`hatz-provider` fetches the Hatz model catalog when you install and writes the right config for each agent. Where the agent can resolve env vars (omp, pi), the config references `$HATZ_API_KEY`. For agents that need a literal key (Claude Code, Hermes), it writes the key directly into the config. The key is never sent anywhere except to the Hatz API at runtime.

Run `install` or `update` again to refresh the model list. Only the Hatz block is changed.

## Requirements

- [Bun](https://bun.sh) (the CLI runs on Bun)
- A [Hatz AI](https://ai.hatz.ai) API key

## License

MIT
