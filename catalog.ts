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

/** Estimate context window for a model based on its name/developer. */
export function estimateContextWindow(model: HatzModel): number {
  const n = model.name;
  if (/gpt.*(5\.[12456]|5-nano|5-mini|5-chat|[o]3|[o]4|4o)/.test(n)) return 128_000;
  if (/gpt-4\.1/.test(n)) return 1_048_576;
  if (/gemini-3|gemini-2\.5/.test(n)) return 1_048_576;
  if (/llama/.test(n)) return 128_000;
  if (/deepseek/.test(n)) return 128_000;
  if (/claude/.test(n)) return 200_000;
  if (/grok/.test(n)) return 131_072;
  if (/kimi|moonshot/.test(n)) return 131_072;
  return 200_000;
}

/** Cap max tokens to a reasonable value. */
export function clampMaxTokens(raw: number): number {
  return Math.min(raw, 128_000) || 16_384;
}

/** Resolve input modalities. */
export function inputCapabilities(model: HatzModel): string {
  return model.vision ? "[text, image]" : "[text]";
}
