# hatz-provider

Adds Hatz AI as a model provider to your coding agents. One command.

```bash
npx hatz-provider install
```

Built by [Sam King](https://github.com/GodSpoon)

## What it does

Points your coding agents at the [Hatz AI](https://ai.hatz.ai) API — 80+ models (OpenAI, Anthropic, Google, xAI, DeepSeek, Meta, Mistral, and more) through one API key.

Each agent gets the API surface it expects:

- **omp, pi, Claude Code** → Anthropic Messages (`/v1/anthropic`)
- **Hermes, OpenClaw** → OpenAI Completions (`/v1`)

Config blocks are guarded with comment markers. Reinstalling or updating only touches the Hatz section and leaves your other providers alone.

## Quick start

```bash
npx hatz-provider install
```

You'll be prompted for your API key ([get one](https://ai.hatz.ai) → Workspace → API Keys), then Hatz is installed into every supported agent detected on your machine.

Want just one agent?

```bash
npx hatz-provider install omp
npx hatz-provider install hermes
```

## How it picks agents

`install` and `uninstall` with no agent name auto-detect which supported agents are set up on your machine — by checking for `~/.omp`, `~/.pi`, `~/.hermes`, `~/.claude`, `~/.openclaw` — and only touch those. Naming an agent explicitly (e.g. `install omp`) always installs it, detected or not.

| Agent | Config written |
|-------|---------------|
| [omp](https://omp.sh) | `~/.omp/agent/models.yml` |
| [pi](https://pi.dev) | `~/.pi/extensions/hatz/` |
| [Claude Code](https://claude.ai) | `~/.claude/.env` |
| [Hermes](https://hermesagent.com) | `~/.hermes/config.yaml` + `.env` |
| [OpenClaw](https://openclaw.ai) | `~/.openclaw/openclaw.json` |

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

## Setting the key instead of a prompt

For scripts or CI, set the key in your shell before running:

```powershell
# PowerShell
$env:HATZ_API_KEY = "hzat-..."
```

```bat
rem cmd.exe
set HATZ_API_KEY=hzat-...
```

```bash
# bash / zsh
export HATZ_API_KEY="hzat-..."
```

## How it works

`hatz-provider` fetches the Hatz model catalog when you install and writes the right config for each agent. Where the agent can resolve env vars (omp, pi), the config references `$HATZ_API_KEY`. For agents that need a literal key (Claude Code, Hermes), it writes the key directly into the config. The key is never sent anywhere except to the Hatz API at runtime.

Run `install` or `update` again to refresh the model list. Only the Hatz block is changed.

## Requirements

- [Bun](https://bun.sh) installed globally (the CLI runs on Bun)
- A [Hatz AI](https://ai.hatz.ai) API key

## License

MIT
