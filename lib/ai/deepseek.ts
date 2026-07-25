import "server-only";

/**
 * Low-level DeepSeek transport. DeepSeek exposes an OpenAI-compatible
 * /chat/completions endpoint, so this is a thin server-only wrapper used by
 * every CalibiAI agent. Keeping all model calls here means the provider can be
 * swapped in one place (see CLAUDE.md § "one lib/ai/ module").
 */

const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

export function deepseekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

type ChatArgs = {
  system?: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Force JSON output. Only enable when the prompt mentions JSON (DeepSeek requirement). */
  json?: boolean;
  timeoutMs?: number;
};

/** Returns the raw assistant text. Throws on configuration or transport failure. */
export async function deepseekChat({ system, user, maxTokens = 1000, temperature = 0.2, json = false, timeoutMs = 12_000 }: ChatArgs): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set.");
  const model = process.env.DEEPSEEK_MODEL_ID ?? DEFAULT_MODEL;

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const body = JSON.stringify({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  });

  // Retry throttling (429) and transient 5xx up to two times with backoff.
  let lastError: unknown;
  for (let attempt = 0; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body,
        signal: controller.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`DeepSeek transient ${res.status}`);
        clearTimeout(timer);
        if (attempt < 2) { await backoff(attempt); continue; }
        throw lastError;
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const clientError = new Error(`DeepSeek ${res.status}: ${detail.slice(0, 200)}`) as Error & { noRetry?: boolean };
        clientError.noRetry = true; // 4xx (bad key, bad request) — do not retry.
        throw clientError;
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? "";
    } catch (error) {
      lastError = error;
      // Retry AbortError / network errors; fail fast on 4xx client errors.
      const noRetry = (error as { noRetry?: boolean })?.noRetry === true;
      if (!noRetry && attempt < 2) { await backoff(attempt); continue; }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("DeepSeek invocation failed.");
}

function backoff(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
}
