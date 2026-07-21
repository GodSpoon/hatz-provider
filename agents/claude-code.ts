/**
 * Claude Code config generator.
 *
 * Sets ANTHROPIC_BASE_URL + ANTHROPIC_API_KEY env vars.
 * Writes to ~/.claude/.env (shell-sourced) and offers shell profile option.
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HatzModel } from "../catalog";

const ENV_FILE = join(homedir(), ".claude", ".env");
const BASE_URL = "https://ai.hatz.ai/v1/anthropic";

export function agentName(): string {
  return "Claude Code";
}

export async function isInstalled(): Promise<boolean> {
  try {
    const content = await readFile(ENV_FILE, "utf-8");
    return content.includes("# === Hatz AI ===");
  } catch {
    return false;
  }
}

export async function install(models: HatzModel[], apiKey: string): Promise<void> {
  await mkdir(join(homedir(), ".claude"), { recursive: true });

  const block = [
    "# === Hatz AI ===",
    `ANTHROPIC_BASE_URL=${BASE_URL}`,
    `ANTHROPIC_API_KEY=${apiKey}`,
    "# Model aliases: sonnet, opus, haiku resolve to latest Claude family models",
    `# Available: ${models.filter(m => m.developer === "Anthropic").map(m => m.name).slice(0, 5).join(", ")}...`,
    "# === end Hatz AI ===",
  ].join("\n") + "\n";

  let existing = "";
  try { existing = await readFile(ENV_FILE, "utf-8"); } catch { /* new file */ }

  const guard = "# === Hatz AI ===";
  const guardEnd = "# === end Hatz AI ===";
  const start = existing.indexOf(guard);
  const end = existing.indexOf(guardEnd);
  if (start !== -1 && end !== -1) {
    existing = existing.slice(0, start) + existing.slice(end + guardEnd.length);
  }

  await writeFile(ENV_FILE, [existing.trimEnd(), block].filter(Boolean).join("\n\n") + "\n", "utf-8");
}

export async function uninstall(): Promise<void> {
  let content = "";
  try { content = await readFile(ENV_FILE, "utf-8"); } catch { return; }
  const guard = "# === Hatz AI ===";
  const guardEnd = "# === end Hatz AI ===";
  const start = content.indexOf(guard);
  const end = content.indexOf(guardEnd);
  if (start !== -1 && end !== -1) {
    content = content.slice(0, start) + content.slice(end + guardEnd.length);
    await writeFile(ENV_FILE, content.trimEnd() + "\n", "utf-8");
  }
}
