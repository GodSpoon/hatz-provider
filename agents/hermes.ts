/**
 * Hermes agent config generator.
 *
 * Writes to ~/.hermes/config.yaml + ~/.hermes/.env
 * Uses openai-completions API (Hermes is OpenAI-compatible only).
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HatzModel } from "../catalog";

const HERMES_DIR = join(homedir(), ".hermes");
const CONFIG_PATH = join(HERMES_DIR, "config.yaml");
const ENV_PATH = join(HERMES_DIR, ".env");
const BASE_URL = "https://ai.hatz.ai/v1";
const API = "openai-completions";
const GUARD = "# === Hatz AI ===";
const GUARD_END = "# === end Hatz AI ===";

export function agentName(): string {
  return "Hermes Agent";
}

export async function isInstalled(): Promise<boolean> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    return content.includes(GUARD);
  } catch {
    return false;
  }
}

export async function install(models: HatzModel[], apiKey: string): Promise<void> {
  await mkdir(HERMES_DIR, { recursive: true });

  // Write .env with API key
  const envBlock = [
    GUARD,
    `HATZ_API_KEY=${apiKey}`,
    GUARD_END,
  ].join("\n") + "\n";

  let existingEnv = "";
  try { existingEnv = await readFile(ENV_PATH, "utf-8"); } catch { /* new */ }
  const envStart = existingEnv.indexOf(GUARD);
  const envEnd = existingEnv.indexOf(GUARD_END);
  if (envStart !== -1 && envEnd !== -1) {
    existingEnv = existingEnv.slice(0, envStart) + existingEnv.slice(envEnd + GUARD_END.length);
  }
  await writeFile(ENV_PATH, [existingEnv.trimEnd(), envBlock].filter(Boolean).join("\n\n") + "\n", "utf-8");

  // Write config.yaml with provider definition
  const modelIds = models.map(m => `hatz/${m.name}`).join("\n");
  const configBlock = [
    GUARD,
    "# Hermes uses the standard OpenAI chat completions endpoint.",
    `# Base URL: ${BASE_URL}`,
    "# API key: $HATZ_API_KEY (from ~/.hermes/.env)",
    "#",
    "# Add models to your defaults:",
    "#   models:",
    "#     - hatz/gpt-5.2",
    "#     - hatz/anthropic.claude-sonnet-4-5",
    "#",
    "# Run `hermes doctor` to verify after setup.",
    GUARD_END,
  ].join("\n") + "\n";

  let existingConfig = "";
  try { existingConfig = await readFile(CONFIG_PATH, "utf-8"); } catch { /* new */ }
  const cfgStart = existingConfig.indexOf(GUARD);
  const cfgEnd = existingConfig.indexOf(GUARD_END);
  if (cfgStart !== -1 && cfgEnd !== -1) {
    existingConfig = existingConfig.slice(0, cfgStart) + existingConfig.slice(cfgEnd + GUARD_END.length);
  }
  await writeFile(CONFIG_PATH, [existingConfig.trimEnd(), configBlock].filter(Boolean).join("\n\n") + "\n", "utf-8");
}

export async function uninstall(): Promise<void> {
  for (const path of [CONFIG_PATH, ENV_PATH]) {
    try {
      let content = await readFile(path, "utf-8");
      const start = content.indexOf(GUARD);
      const end = content.indexOf(GUARD_END);
      if (start !== -1 && end !== -1) {
        content = content.slice(0, start) + content.slice(end + GUARD_END.length);
        await writeFile(path, content.trimEnd() + "\n", "utf-8");
      }
    } catch { /* didn't exist */ }
  }
}
