/**
 * omp (Oh My Pi) config generator.
 *
 * Writes to ~/.omp/agent/models.yml using anthropic-messages API.
 * Guard-commented block, safe to merge with existing config.
 */
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HatzModel } from "../catalog";
import { estimateContextWindow, clampMaxTokens, supportsReasoning, supportsVision } from "../catalog";

const OMP_DIR = join(homedir(), ".omp", "agent");
const CONFIG_PATH = join(OMP_DIR, "models.yml");
const GUARD = "# === Hatz AI ===";
const GUARD_END = "# === end Hatz AI ===";

const BASE_URL = "https://ai.hatz.ai/v1/anthropic";
const API = "anthropic-messages";

export function agentName(): string {
  return "omp (Oh My Pi)";
}

export async function isInstalled(): Promise<boolean> {
  try { await stat(CONFIG_PATH); return true; } catch { return false; }
}

export async function isAgentPresent(): Promise<boolean> {
  try { await stat(join(homedir(), ".omp")); return true; } catch { return false; }
}

export function generateBlock(models: HatzModel[], apiKey: string): string {
  const lines = [GUARD];
  lines.push("providers:");
  lines.push("  hatz:");
  lines.push("    baseUrl: " + BASE_URL);
  lines.push("    api: " + API);
  lines.push("    authHeader: true");
  lines.push('    apiKey: "HATZ_API_KEY"');
  lines.push("    models:");

  for (const m of models) {
    lines.push("      - id: " + m.name);
    lines.push("        name: " + m.display_name + " (Hatz)");
    lines.push("        contextWindow: " + estimateContextWindow(m));
    lines.push("        maxTokens: " + clampMaxTokens(m.max_tokens));
    if (supportsReasoning(m)) {
      lines.push("        reasoning: true");
    }
    lines.push("        input: " + (supportsVision(m) ? "[text, image]" : "[text]"));
  }

  lines.push(GUARD_END);
  return lines.join("\n");
}

export async function install(models: HatzModel[], apiKey: string): Promise<void> {
  await mkdir(OMP_DIR, { recursive: true });

  let existing = "";
  try { existing = await readFile(CONFIG_PATH, "utf-8"); } catch { /* new file */ }

  const start = existing.indexOf(GUARD);
  const end = existing.indexOf(GUARD_END);
  if (start !== -1 && end !== -1) {
    existing = existing.slice(0, start) + existing.slice(end + GUARD_END.length);
  }

  const block = generateBlock(models, apiKey);
  const merged = [existing.trimEnd(), block].filter(Boolean).join("\n\n") + "\n";
  await writeFile(CONFIG_PATH, merged, "utf-8");
}

export async function uninstall(): Promise<void> {
  let content = "";
  try { content = await readFile(CONFIG_PATH, "utf-8"); } catch { return; }

  const start = content.indexOf(GUARD);
  const end = content.indexOf(GUARD_END);
  if (start !== -1 && end !== -1) {
    content = content.slice(0, start) + content.slice(end + GUARD_END.length);
    await writeFile(CONFIG_PATH, content.trimEnd() + "\n", "utf-8");
  }
}
