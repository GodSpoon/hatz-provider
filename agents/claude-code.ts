/**
 * Claude Code config generator.
 *
 * Persists gateway env vars in the `env` block of ~/.claude/settings.json
 * (the documented mechanism — reaches background agents too).
 * Uses ANTHROPIC_AUTH_TOKEN (Authorization: Bearer), which the Hatz
 * /v1/anthropic surface accepts; ANTHROPIC_API_KEY (X-Api-Key) is rejected.
 */
import { writeFile, mkdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HatzModel } from "../catalog";

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_PATH = join(CLAUDE_DIR, "settings.json");
const LEGACY_ENV = join(CLAUDE_DIR, ".env");
const BASE_URL = "https://ai.hatz.ai/v1/anthropic";
const GUARD = "// === Hatz AI ===";
const GUARD_END = "// === end Hatz AI ===";
const OWNED_KEYS = ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN"];

export function agentName(): string {
  return "Claude Code";
}

export async function isInstalled(): Promise<boolean> {
  try {
    const content = await readFile(SETTINGS_PATH, "utf-8");
    return content.includes(GUARD);
  } catch {
    return false;
  }
}

export async function isAgentPresent(): Promise<boolean> {
  try { await stat(CLAUDE_DIR); return true; } catch { return false; }
}

// Strip `//` line comments outside strings and trailing commas (JSONC → JSON).
function stripJsonc(text: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += text[i + 1] ?? "";
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    out += ch;
  }
  return out.replace(/,\s*([}\]])/g, "$1");
}

function removeGuardedBlock(text: string): string {
  const start = text.indexOf(GUARD);
  const end = text.indexOf(GUARD_END);
  if (start === -1 || end === -1) return text;
  const after = text.slice(end + GUARD_END.length);
  const nl = after.indexOf("\n");
  return text.slice(0, start) + (nl === -1 ? "" : after.slice(nl + 1));
}

async function writeLegacyEnvCleanup(): Promise<void> {
  // Older versions wrote a literal key to ~/.claude/.env, which Claude Code
  // does not read. Strip that stale block if present.
  const legacyGuard = "# === Hatz AI ===";
  const legacyEnd = "# === end Hatz AI ===";
  try {
    const content = await readFile(LEGACY_ENV, "utf-8");
    const start = content.indexOf(legacyGuard);
    const end = content.indexOf(legacyEnd);
    if (start !== -1 && end !== -1) {
      await writeFile(
        LEGACY_ENV,
        content.slice(0, start).trimEnd() + "\n",
        "utf-8"
      );
    }
  } catch { /* never existed */ }
}

export async function install(models: HatzModel[], apiKey: string): Promise<void> {
  await mkdir(CLAUDE_DIR, { recursive: true });

  let text = "";
  try { text = await readFile(SETTINGS_PATH, "utf-8"); } catch { /* new file */ }

  text = removeGuardedBlock(text);

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(stripJsonc(text));
  } catch {
    obj = {};
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) obj = {};

  const oldEnv = (obj.env as Record<string, unknown>) ?? {};
  const restEnv: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(oldEnv)) {
    if (!OWNED_KEYS.includes(k)) restEnv[k] = v;
  }
  obj.env = {
    ANTHROPIC_BASE_URL: BASE_URL,
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ...restEnv,
  };

  const lines = JSON.stringify(obj, null, 2).split("\n");
  const baseIdx = lines.findIndex((l) => l.includes('"ANTHROPIC_BASE_URL"'));
  const tokenIdx = lines.findIndex((l) => l.includes('"ANTHROPIC_AUTH_TOKEN"'));
  if (baseIdx !== -1) lines.splice(baseIdx, 0, GUARD);
  const tokenAfter = lines.findIndex((l) => l.includes('"ANTHROPIC_AUTH_TOKEN"'));
  if (tokenAfter !== -1) lines.splice(tokenAfter + 1, 0, GUARD_END);

  await writeFile(SETTINGS_PATH, lines.join("\n") + "\n", "utf-8");
  await writeLegacyEnvCleanup();
}

export async function uninstall(): Promise<void> {
  try {
    let text = await readFile(SETTINGS_PATH, "utf-8");
    text = removeGuardedBlock(text);

    // Drop an emptied `env` object if we created it.
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(stripJsonc(text));
      if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        const env = obj.env as Record<string, unknown> | undefined;
        if (env && Object.keys(env).length === 0) {
          delete obj.env;
          text = JSON.stringify(obj, null, 2);
        }
      }
    } catch { /* leave text as-is */ }

    await writeFile(SETTINGS_PATH, text.trimEnd() + "\n", "utf-8");
  } catch { /* didn't exist */ }

  await writeLegacyEnvCleanup();
}
