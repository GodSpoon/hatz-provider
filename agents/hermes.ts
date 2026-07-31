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

export async function install(_models: HatzModel[], apiKey: string): Promise<void> {
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
  let existingConfig = "";
  try { existingConfig = await readFile(CONFIG_PATH, "utf-8"); } catch { /* new */ }
  const cfgStart = existingConfig.indexOf(GUARD);
  const cfgEnd = existingConfig.indexOf(GUARD_END);
  if (cfgStart !== -1 && cfgEnd !== -1) {
    existingConfig = existingConfig.slice(0, cfgStart) + existingConfig.slice(cfgEnd + GUARD_END.length);
  }
  existingConfig = existingConfig.trimEnd();

  // Merge a real `providers:` block into the existing config.
  const hatzBlock = `  hatz:\n    base_url: "${BASE_URL}"`;
  const lines = existingConfig ? existingConfig.split("\n") : [];
  const providersIdx = lines.findIndex(line => /^providers:/.test(line));

  let mergedConfig: string;
  if (providersIdx === -1) {
    // No providers section yet — append a new one at the end.
    mergedConfig = existingConfig
      ? `${existingConfig}\n\nproviders:\n${hatzBlock}`
      : `providers:\n${hatzBlock}`;
  } else {
    // The providers section ends at the first line after it that is
    // non-empty, not a comment, and not indented (the next top-level key).
    let insertAt = lines.length;
    for (let i = providersIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "" || line.trim().startsWith("#") || line.startsWith(" ")) {
        continue;
      }
      insertAt = i;
      break;
    }
    // providers is the last section — drop trailing blank/comment lines so
    // the hatz block lands right after the last indented line.
    if (insertAt === lines.length) {
      while (insertAt > providersIdx + 1) {
        const line = lines[insertAt - 1];
        if (line.trim() === "" || line.trim().startsWith("#")) {
          insertAt--;
        } else {
          break;
        }
      }
    }
    // Skip insertion if a hatz entry already exists under providers (re-install).
    const hasHatz = lines
      .slice(providersIdx + 1, insertAt)
      .some(line => /^  hatz:/.test(line));
    mergedConfig = hasHatz
      ? lines.join("\n")
      : [...lines.slice(0, insertAt), hatzBlock, ...lines.slice(insertAt)].join("\n");
  }

  // Guard block is informational only — the real config lives above it.
  const guardBlock = [
    GUARD,
    "# Hatz AI provider configured above (providers.hatz).",
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
  ].join("\n");

  await writeFile(CONFIG_PATH, [mergedConfig, guardBlock].filter(Boolean).join("\n\n") + "\n", "utf-8");
}

export async function uninstall(): Promise<void> {
  // config.yaml — strip guard block *and* remove providers.hatz entry
  try {
    let content = await readFile(CONFIG_PATH, "utf-8");
    // Strip guard comments
    const gStart = content.indexOf(GUARD);
    const gEnd = content.indexOf(GUARD_END);
    if (gStart !== -1 && gEnd !== -1) {
      content = content.slice(0, gStart) + content.slice(gEnd + GUARD_END.length);
    }
    // Remove providers.hatz YAML block
    const lines = content.split("\n");
    const provIdx = lines.findIndex((l) => /^providers:/.test(l));
    if (provIdx >= 0) {
      const hatzIdx = lines.findIndex((l, i) => i > provIdx && /^  hatz:/.test(l));
      if (hatzIdx >= 0) {
        // Find end of the hatz block: next line at same indent (2-space,
        // another provider) or a top-level key (0-space).
        let endIdx = lines.length;
        for (let i = hatzIdx + 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim() === "" || line.trim().startsWith("#")) continue;
          if (!line.startsWith("    ")) { endIdx = i; break; }
        }
        lines.splice(hatzIdx, endIdx - hatzIdx);
        content = lines.join("\n");
      }
    }
    await writeFile(CONFIG_PATH, content.trimEnd() + "\n", "utf-8");
  } catch { /* didn't exist */ }

  // .env — strip guard block only (key is inside the guards)
  try {
    let content = await readFile(ENV_PATH, "utf-8");
    const start = content.indexOf(GUARD);
    const end = content.indexOf(GUARD_END);
    if (start !== -1 && end !== -1) {
      content = content.slice(0, start) + content.slice(end + GUARD_END.length);
      await writeFile(ENV_PATH, content.trimEnd() + "\n", "utf-8");
    }
  } catch { /* didn't exist */ }
}
