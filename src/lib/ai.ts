/**
 * 统一大模型调用封装（服务端专用）
 * - DeepSeek 优先，OpenAI 备选；两者密钥缺失时返回 mock 降级
 * - 现有 AI 路由仍可各自保留旧 fetch 逻辑，本封装仅供给新模块复用
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallAIResult {
  content: string;
  source: "ai" | "mock";
  model: string;
}

export async function callAI(opts: {
  system?: string;
  user: string;
  messages?: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<CallAIResult> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!deepseekKey && !openaiKey) {
    return { content: "", source: "mock", model: "none" };
  }

  const useDeepseek = !!deepseekKey;
  const apiKey = useDeepseek ? deepseekKey! : openaiKey!;
  const apiUrl = useDeepseek
    ? process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = useDeepseek ? "deepseek-chat" : "gpt-4o-mini";

  const messages: AIMessage[] =
    opts.messages ||
    [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      { role: "user" as const, content: opts.user },
    ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 55000);
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 4000,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("AI_HTTP_" + res.status);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { content, source: "ai", model };
  } catch (e) {
    return { content: "", source: "mock", model };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 从模型输出中安全提取 JSON（支持 |JSON_START|...|JSON_END| 或裸花括号）
 */
export function extractJSON<T = any>(content: string): T | null {
  if (!content) return null;
  try {
    let str = "";
    const s = content.indexOf("|JSON_START|");
    const e = content.indexOf("|JSON_END|");
    if (s !== -1 && e !== -1 && e > s) {
      str = content.substring(s + 12, e).trim();
    } else {
      const fb = content.indexOf("{");
      const lb = content.lastIndexOf("}");
      if (fb !== -1 && lb !== -1 && lb > fb) str = content.substring(fb, lb + 1);
    }
    if (!str) return null;
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}
