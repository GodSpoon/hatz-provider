/**
 * OpenClaw config generator.
 *
 * Writes to ~/.openclaw/openclaw.json — merges into existing config.
 * Uses openai-completions API.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HatzModel } from "../catalog";

const CONFIG_PATH = join(homedir(), ".openclaw", "openclaw.json");
const BASE_URL = "https://ai.hatz.ai/v1";
const API = "openai-completions";
const PROVIDER_ID = "hatz";

export function agentName(): string {
  return "OpenClaw";
}

export async function isInstalled(): Promise<boolean> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const cfg = JSON.parse(raw);
    return cfg?.models?.providers?.[PROVIDER_ID] != null;
  } catch {
    return false;
  }
}

export function generateConfig(models: HatzModel[], apiKey: string): Record<string, unknown> {
  return {
    models: {
      providers: {
        [PROVIDER_ID]: {
          baseUrl: BASE_URL,
          apiKey: apiKey,
          api: API,
          models: models.map((m) => ({
            id: m.name,
            name: `${m.display_name} (Hatz)`,
          })),
        },
      },
    },
  };
}

export async function install(models: HatzModel[], apiKey: string): Promise<void> {
  await mkdir(join(homedir(), ".openclaw"), { recursive: true });

  let cfg: Record<string, unknown> = {};
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    cfg = JSON.parse(raw);
  } catch { /* new file */ }

  // Deep merge the provider config
  const modelsCfg = (cfg.models as Record<string, unknown>) ?? {};
  const providers = (modelsCfg.providers as Record<string, unknown>) ?? {};
  const newCfg = generateConfig(models, apiKey);
  const newProviders = (newCfg.models as Record<string, unknown>).providers as Record<string, unknown>;

  cfg.models = { ...modelsCfg, providers: { ...providers, ...newProviders } };

  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf-8");
}

export async function uninstall(): Promise<void> {
  let cfg: Record<string, unknown> = {};
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    cfg = JSON.parse(raw);
  } catch { return; }

  const modelsCfg = cfg.models as Record<string, unknown> | undefined;
  if (!modelsCfg) return;
  const providers = modelsCfg.providers as Record<string, unknown> | undefined;
  if (!providers) return;

  delete providers[PROVIDER_ID];
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf-8");
}
