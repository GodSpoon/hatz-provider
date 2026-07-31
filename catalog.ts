/**
 * Hatz AI model catalog — fetches and normalizes the full model list.
 */

export interface HatzModel {
  name: string;
  developer: string;
  display_name: string;
  max_tokens: number;
  vision: boolean;
}

const CATALOG_URL = "https://ai.hatz.ai/v1/chat/models";

export async function fetchCatalog(apiKey: string): Promise<HatzModel[]> {
  const resp = await fetch(CATALOG_URL, {
    headers: { "X-API-Key": apiKey, Accept: "application/json" },
  });
  if (!resp.ok) throw new Error(`Hatz catalog fetch failed: ${resp.status}`);
  const data = (await resp.json()) as { data?: HatzModel[]; models?: HatzModel[] };
  const models = data.data ?? data.models ?? [];
  return models.filter((m) => m.name !== "auto");
}

/** Estimate context window for a model. Developer-based primary, regex fallback. */
export function estimateContextWindow(model: HatzModel): number {
  const dev = model.developer.toLowerCase();
  // Developer defaults (most accurate)
  if (dev === "anthropic" || dev === "claude") return 200_000;
  if (dev === "google" || dev === "gemini") return 1_048_576;
  if (dev === "openai") return 128_000;
  if (dev === "meta" || dev === "llama") return 128_000;
  if (dev === "deepseek") return 128_000;
  if (dev === "xai" || dev === "grok") return 131_072;
  if (dev === "moonshot" || dev === "kimi") return 131_072;
  // Regex overrides for specific models
  const n = model.name;
  if (/gpt-4\.1/.test(n)) return 1_048_576;
  if (/gemini-3|gemini-2\.5/.test(n)) return 1_048_576;
  return 200_000; // conservative default
}

/** Detect if a model supports reasoning/thinking. */
export function supportsReasoning(model: HatzModel): boolean {
  const n = model.name;
  // Extended-thinking and reasoning models
  if (/\b(o[34]|gpt-5\.[2456])\b/.test(n)) return true;
  if (/claude.*(sonnet|opus).*4/.test(n)) return true; // Claude 4.x series
  if (/gemini.*(thinking|flash-thinking)/i.test(n)) return true;
  if (/deepseek.*(reasoner|r1)/i.test(n)) return true;
  if (/grok.*(think|reason)/i.test(n)) return true;
  return false;
}

/** Detect if a model supports vision/image input. */
export function supportsVision(model: HatzModel): boolean {
  return model.vision;
}

/** Cap max tokens to a reasonable value. */
export function clampMaxTokens(raw: number): number {
  return Math.min(raw, 128_000) || 16_384;
}

/** Resolve input modalities. */
export function inputCapabilities(model: HatzModel): string {
  return model.vision ? "[text, image]" : "[text]";
}
