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
 *
 * Agents: omp, pi, hermes, claude-code, openclaw, all
 *
 * Auto-detects installed agents. Uses anthropic-messages gateway
 * for omp/pi/claude-code and openai-completions for hermes/openclaw.
 */
import { fetchCatalog, type HatzModel } from "./catalog";

// Lazy-load agent modules to avoid importing fs for agents not being used.
type AgentModule = {
  agentName: () => string;
  isInstalled: () => Promise<boolean>;
  install: (models: HatzModel[], apiKey: string) => Promise<void>;
  uninstall: () => Promise<void>;
};

const AGENT_IDS = ["omp", "pi", "hermes", "claude-code", "openclaw"] as const;
type AgentId = (typeof AGENT_IDS)[number];

async function loadAgent(id: AgentId): Promise<AgentModule> {
  return import(`./agents/${id}.ts`);
}

function getApiKey(): string {
  return process.env.HATZ_API_KEY || "";
}

function bail(msg: string): never {
  console.error(`❌  ${msg}`);
  process.exit(1);
}

// ── Commands ───────────────────────────────────────────────────────────

async function cmdInstall(agentId?: string): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) bail("HATZ_API_KEY is not set.\n    export HATZ_API_KEY=\"your-key\"");

  console.log("📡  Fetching Hatz model catalog...");
  let models: HatzModel[];
  try {
    models = await fetchCatalog(apiKey);
    console.log(`    Found ${models.length} models`);
  } catch (err: unknown) {
    bail(`Failed to fetch catalog: ${err instanceof Error ? err.message : err}`);
  }

  const targets = agentId ? [agentId as AgentId] : [...AGENT_IDS];
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
  console.log(`\n🎉  Done!`);
}

async function cmdUninstall(agentId?: string): Promise<void> {
  const targets = agentId ? [agentId as AgentId] : [...AGENT_IDS];
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
  console.log(`\n✅  Done.`);
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
  const apiKey = getApiKey();
  if (!apiKey) bail("HATZ_API_KEY is not set.");

  console.log("📡  Fetching Hatz model catalog...\n");
  const models = await fetchCatalog(apiKey);
  for (const m of models) {
    console.log(`  ${m.name.padEnd(48)} ${m.developer.padEnd(14)} ${m.vision ? "👁  " : "📝"}  ${(m.max_tokens / 1000).toFixed(0)}K max`);
  }
  console.log(`\n  ${models.length} models total`);
}

async function cmdHelp(): Promise<void> {
  console.log("hatz-provider — Hatz AI provider for coding agents\n");
  console.log("Usage:");
  console.log("  hatz-provider install [agent]     Install Hatz provider");
  console.log("  hatz-provider update [agent]      Refresh models from live catalog");
  console.log("  hatz-provider uninstall [agent]   Remove Hatz provider");
  console.log("  hatz-provider status              Show install status");
  console.log("  hatz-provider list                List available Hatz models");
  console.log("  hatz-provider catalog             Print omp models.yml block\n");
  console.log("Agents: omp, pi, hermes, claude-code, openclaw, all (default)");
  console.log("Auto-detects installed agents. Uses appropriate API per agent.");
  console.log("\nAPI surfaces used:");
  console.log("  omp, pi, claude-code    → anthropic-messages");
  console.log("  hermes, openclaw        → openai-completions");
  console.log("\nEnvironment:");
  console.log("  HATZ_API_KEY            Your Hatz API key (required)");
}

// ── Main ───────────────────────────────────────────────────────────────

const cmd = process.argv[2];
const target = process.argv[3];

if (cmd === "install" || cmd === "i" || cmd === "update" || cmd === "up") {
  await cmdInstall(target);
} else if (cmd === "uninstall" || cmd === "u" || cmd === "remove" || cmd === "rm") {
  await cmdUninstall(target);
} else if (cmd === "status" || cmd === "st") {
  await cmdStatus();
} else if (cmd === "list" || cmd === "ls") {
  await cmdList();
} else if (cmd === "catalog" || cmd === "cat") {
  // Just the omp block for backward compat
  const apiKey = getApiKey();
  if (!apiKey) bail("HATZ_API_KEY is not set.");
  const models = await fetchCatalog(apiKey);
  const { generateBlock } = await import("./agents/omp.ts");
  console.log(generateBlock(models, apiKey));
} else {
  await cmdHelp();
}
