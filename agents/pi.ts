/**
 * Pi (pi.dev) extension generator.
 *
 * Creates ~/.pi/extensions/hatz/ with package.json + index.ts.
 * Pi resolves $VAR env references in apiKey — no literal key needed.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HatzModel } from "../catalog";
import { estimateContextWindow, clampMaxTokens, inputCapabilities } from "../catalog";

const EXT_DIR = join(homedir(), ".pi", "extensions", "hatz");
const BASE_URL = "https://ai.hatz.ai/v1/anthropic";
const API = "anthropic-messages";

export function agentName(): string {
  return "pi (pi.dev)";
}

export async function isInstalled(): Promise<boolean> {
  try { await (await import("node:fs/promises")).stat(join(EXT_DIR, "index.ts")); return true; } catch { return false; }
}

function generateIndex(models: HatzModel[]): string {
  const modelDefs = models.map((m) => {
    return `      {
        id: "${m.name}",
        name: "${m.display_name} (Hatz)",
        reasoning: true,
        input: [${m.vision ? '"text", "image"' : '"text"'}],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: ${estimateContextWindow(m)},
        maxTokens: ${clampMaxTokens(m.max_tokens)},
      }`;
  }).join(",\n");

  return `import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("hatz", {
    name: "Hatz AI",
    baseUrl: "${BASE_URL}",
    apiKey: "$HATZ_API_KEY",
    api: "${API}",
    models: [
${modelDefs}
    ],
  });
}
`;
}

export async function install(models: HatzModel[], _apiKey: string): Promise<void> {
  await mkdir(EXT_DIR, { recursive: true });

  await writeFile(join(EXT_DIR, "package.json"), JSON.stringify({
    name: "pi-extension-hatz",
    version: "1.0.0",
    private: true,
    type: "module",
    main: "index.ts",
    dependencies: {
      "@earendil-works/pi-coding-agent": "*",
    },
  }, null, 2) + "\n", "utf-8");

  await writeFile(join(EXT_DIR, "index.ts"), generateIndex(models), "utf-8");
}

export async function uninstall(): Promise<void> {
  const { rm } = await import("node:fs/promises");
  try { await rm(EXT_DIR, { recursive: true }); } catch { /* didn't exist */ }
}
