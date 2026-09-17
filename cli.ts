#!/usr/bin/env bun
/**
 * hatz-provider — Hatz AI provider installer for coding agents.
 *
 * Commands:
 *   hatz-provider install [agent]    Install for one or all agents
 *   hatz-provider update [agent]     Refresh models (same as install)
 *   hatz-provider uninstall [agent]  Remove from one or all agents
 *   hatz-provider list               List available models from Hatz
 *   hatz-provider status             Show install status across agents
 *   hatz-provider catalog            Print models.yml block (for omp)
 *   hatz-provider usage              Show credits/usage info from Hatz
 *   -n, --dry-run                    Preview install/uninstall without writing files
 *
 * Agents: omp, pi, hermes, claude-code, openclaw, all
 *
 * Auto-detects installed agents. Uses anthropic-messages gateway
 * for omp/pi/claude-code and chat-completions for hermes/openclaw.
 */
import { fetchCatalog, type HatzModel } from "./catalog";
import readline from "node:readline";

// Lazy-load agent modules to avoid importing fs for agents not being used.
type AgentModule = {
  agentName: () => string;
  isInstalled: () => Promise<boolean>;
  isAgentPresent: () => Promise<boolean>;
  install: (models: HatzModel[], apiKey: string) => Promise<void>;
  uninstall: () => Promise<void>;
};

const AGENT_IDS = ["omp", "pi", "hermes", "claude-code", "openclaw"] as const;
type AgentId = (typeof AGENT_IDS)[number];

// Config targets per agent, shown by --dry-run (mirrors agents/*.ts paths).
const AGENT_PATHS: Record<AgentId, string> = {
  omp: "~/.omp/agent/models.yml",
  pi: "~/.pi/agent/extensions/hatz/",
  hermes: "~/.hermes/config.yaml + ~/.hermes/.env",
  "claude-code": "~/.claude/settings.json",
  openclaw: "~/.openclaw/openclaw.json",
};

async function loadAgent(id: AgentId): Promise<AgentModule> {
  return import(`./agents/${id}.ts`);
}

async function detectAgents(): Promise<AgentId[]> {
  const detected: AgentId[] = [];
  for (const id of AGENT_IDS) {
    try {
      const agent = await loadAgent(id);
      if (await agent.isAgentPresent()) detected.push(id);
    } catch {
      // ignore unloadable agents
    }
  }
  return detected;
}

async function promptMasked(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    const stdout = process.stdout;
    stdout.write(question);
    if (!process.stdin.setRawMode) {
      rl.question("", (answer) => {
        resolve(answer.trim());
      });
      return;
    }
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = "";
    const onData = (char: Buffer | string) => {
      const ch = Buffer.isBuffer(char) ? char.toString("utf8") : char;
      if (ch === "\n" || ch === "\r" || ch === "\u0004") {
        try { process.stdin.setRawMode(false); } catch {}
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        rl.close();
        stdout.write("\n");
        resolve(value);
        return;
      }
      if (ch === "\u0003") {
        process.exit(1);
      }
      if (ch === "\b" || ch === "\x7f") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          stdout.write("\b \b");
        }
        return;
      }
      value += ch;
      stdout.write("*");
    };
    process.stdin.on("data", onData);
  });
}

async function promptApiKey(): Promise<string> {
  if (process.stdin.isTTY) {
    const key = await promptMasked("Enter your HATZ_API_KEY: ");
    if (!key) {
      console.error("\n❌  API key cannot be empty.");
      return promptApiKey();
    }
    return key;
  }
  bail(`HATZ_API_KEY is not set and no interactive terminal is available.
    Set it with one of:
      PowerShell:  \$env:HATZ_API_KEY = \"hzat-...\"
      cmd.exe:     set HATZ_API_KEY=hzat-...
      bash/zsh:    export HATZ_API_KEY=\"hzat-...\"`);
}

async function getApiKey(): Promise<string> {
  return process.env.HATZ_API_KEY || (await promptApiKey());
}

function bail(msg: string): never {
  console.error(`❌  ${msg}`);
  process.exit(1);
}

// ── Commands ───────────────────────────────────────────────────────────

async function cmdInstall(agentId?: string, dryRun = false): Promise<void> {
  const apiKey = await getApiKey();

  console.log("📡  Fetching Hatz model catalog...");
  let models: HatzModel[];
  try {
    models = await fetchCatalog(apiKey);
    console.log(`    Found ${models.length} models`);
  } catch (err: unknown) {
    bail(`Failed to fetch catalog: ${err instanceof Error ? err.message : err}`);
  }

  let targets: AgentId[];
  if (agentId) {
    targets = [agentId as AgentId];
  } else {
    targets = await detectAgents();
    if (targets.length === 0) {
      console.log("\nNo supported agents detected.");
      console.log("Install one first, or target a specific agent:");
      console.log("  npx hatz-provider install <agent>");
      console.log("\nSupported agents: omp, pi, hermes, claude-code, openclaw");
      return;
    }
    const skipped = AGENT_IDS.filter((id) => !targets.includes(id));
    if (skipped.length > 0) {
      console.log(`\nAuto-detected ${targets.length} agent(s). Skipping: ${skipped.join(", ")}`);
    }
  }
  if (dryRun) {
    console.log("\n🔍  Dry run — would install:");
    for (const id of targets) {
      try {
        const agent = await loadAgent(id);
        console.log(`    ${agent.agentName()}  →  ${AGENT_PATHS[id]}`);
      } catch {
        console.log(`    ${id}  →  (config path unknown)`);
      }
    }
  } else {
    for (const id of targets) {
      try {
        const agent = await loadAgent(id);
        console.log(`\n🔧  ${agent.agentName()}...`);
        await agent.install(models, apiKey);
        console.log(`    ✅  Installed`);
      } catch (err: unknown) {
        console.log(`    ⚠   Skipped: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  console.log(dryRun ? "\nDry run — no files written" : "\n🎉  Done!");
}

async function cmdUninstall(agentId?: string, dryRun = false): Promise<void> {
  let targets: AgentId[];
  if (agentId) {
    targets = [agentId as AgentId];
  } else {
    targets = await detectAgents();
    if (targets.length === 0) {
      console.log("No supported agents detected.");
      console.log("Run with an explicit agent to remove a config:");
      console.log("  npx hatz-provider uninstall <agent>");
      return;
    }
    const skipped = AGENT_IDS.filter((id) => !targets.includes(id));
    if (skipped.length > 0) {
      console.log(`\nAuto-detected ${targets.length} agent(s). Skipping: ${skipped.join(", ")}`);
    }
  }
  if (dryRun) {
    console.log("🔍  Dry run — would remove:");
    for (const id of targets) {
      try {
        const agent = await loadAgent(id);
        console.log(`    ${agent.agentName()}  →  ${AGENT_PATHS[id]}`);
      } catch {
        console.log(`    ${id}  →  (config path unknown)`);
      }
    }
  } else {
    for (const id of targets) {
      try {
        const agent = await loadAgent(id);
        console.log(`🗑   ${agent.agentName()}...`);
        await agent.uninstall();
        console.log(`    ✅  Removed`);
      } catch {
        console.log(`    ⚠   Skipped (not found)`);
      }
    }
  }
  console.log(dryRun ? "Dry run — no files written" : "\n✅  Done.");
}

async function cmdStatus(): Promise<void> {
  console.log("Hatz AI provider status:\n");
  for (const id of AGENT_IDS) {
    try {
      const agent = await loadAgent(id);
      const installed = await agent.isInstalled();
      console.log(`  ${installed ? "✅" : "⬜"}  ${agent.agentName()}`);
    } catch {
      console.log(`  ❓  ${id}`);
    }
  }
}

async function cmdList(): Promise<void> {
  const apiKey = await getApiKey();

  console.log("📡  Fetching Hatz model catalog...\n");
  const models = await fetchCatalog(apiKey);
  for (const m of models) {
    console.log(`  ${m.name.padEnd(48)} ${m.developer.padEnd(14)} ${m.vision ? "👁  " : "📝"}  ${(m.max_tokens / 1000).toFixed(0)}K max`);
  }
  console.log(`\n  ${models.length} models total`);
}

async function cmdUsage(): Promise<void> {
  const apiKey = await getApiKey();

  console.log("📊  Fetching Hatz usage...\n");
  let resp: Response;
  try {
    resp = await fetch("https://ai.hatz.ai/v1/usage", {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
  } catch (err: unknown) {
    bail(`Failed to reach usage endpoint: ${err instanceof Error ? err.message : err}`);
  }

  if (resp.status === 404) {
    bail("Usage endpoint not available (HTTP 404). This account/plan may not support it.");
  } else if (resp.status === 401 || resp.status === 403) {
    bail(`Usage endpoint rejected the API key (HTTP ${resp.status}). Check HATZ_API_KEY.`);
  } else if (resp.status === 429) {
    bail("Rate limited (HTTP 429). Try again later.");
  } else if (!resp.ok) {
    bail(`Usage endpoint returned HTTP ${resp.status}.`);
  }

  let data: unknown;
  try {
    data = await resp.json();
  } catch {
    bail("Usage endpoint returned a non-JSON response.");
  }

  // The API may wrap the payload in a `data` field; unwrap it if so.
  const root = (typeof data === "object" && data !== null ? data : { raw: data }) as Record<string, unknown>;
  const obj =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  const pick = (keys: string[]): number | undefined => {
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === "number") return v;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
    }
    return undefined;
  };

  const remaining = pick(["credits_remaining", "remaining_credits", "creditsRemaining", "credit_balance", "credits_left", "balance"]);
  const used = pick(["credits_used", "used_credits", "creditsUsed", "credits_spent", "spent_credits"]);
  const total = pick(["total_credits", "credits_total", "totalCredits", "credit_limit", "total"]);
  const modelsUsed = pick(["models_used", "model_count", "modelsUsed"]);

  if (remaining === undefined && used === undefined && total === undefined && modelsUsed === undefined) {
    console.log("Hatz AI usage (raw response):");
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log("Hatz AI usage:\n");
  if (remaining !== undefined) console.log(`  Credits remaining:  ${remaining}`);
  if (used !== undefined) console.log(`  Credits used:       ${used}`);
  if (total !== undefined) console.log(`  Total credits:      ${total}`);
  if (modelsUsed !== undefined) console.log(`  Models used:        ${modelsUsed}`);
}

async function cmdHelp(): Promise<void> {
  console.log("hatz-provider — Hatz AI provider for coding agents\n");
  console.log("Usage:");
  console.log("  hatz-provider install [agent]     Install Hatz provider");
  console.log("  hatz-provider update [agent]      Refresh models from live catalog");
  console.log("  hatz-provider uninstall [agent]   Remove Hatz provider");
  console.log("  hatz-provider status              Show install status");
  console.log("  hatz-provider list                List available Hatz models");
  console.log("  hatz-provider catalog             Print omp models.yml block");
  console.log("  hatz-provider usage               Show credits/usage from Hatz\n");
  console.log("Flags:");
  console.log("  -n, --dry-run                    Preview install/uninstall without writing files\n");
  console.log("Agents: omp, pi, hermes, claude-code, openclaw, all (auto-detected)");
  console.log("Auto-detects installed agents. Uses appropriate API per agent.");
  console.log("\nAPI surfaces used:");
  console.log("  omp, pi, claude-code    → anthropic-messages");
  console.log("  hermes, openclaw        → openai-completions");
  console.log("\nEnvironment:");
  console.log("  HATZ_API_KEY            Your Hatz API key (required)");
}

// ── Main ───────────────────────────────────────────────────────────────

// Flags may appear anywhere in args; strip them before command parsing so
// `-n install omp` and `install omp -n` both work.
const dryRun = process.argv.includes("--dry-run") || process.argv.includes("-n");
const args = process.argv.slice(2).filter((a) => a !== "--dry-run" && a !== "-n");
const cmd = args[0];
const target = args[1];

if (cmd === "install" || cmd === "i" || cmd === "update" || cmd === "up") {
  await cmdInstall(target, dryRun);
} else if (cmd === "uninstall" || cmd === "u" || cmd === "remove" || cmd === "rm") {
  await cmdUninstall(target, dryRun);
} else if (cmd === "status" || cmd === "st") {
  await cmdStatus();
} else if (cmd === "list" || cmd === "ls") {
  await cmdList();
} else if (cmd === "usage" || cmd === "us") {
  await cmdUsage();
} else if (cmd === "catalog" || cmd === "cat") {
  // Just the omp block for backward compat
  const apiKey = await getApiKey();
  const models = await fetchCatalog(apiKey);
  const { generateBlock } = await import("./agents/omp.ts");
  console.log(generateBlock(models, apiKey));
} else {
  await cmdHelp();
}
