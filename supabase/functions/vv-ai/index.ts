/**
 * Veritas SynapseCore — chat proxy for the AI assistant.
 *
 * POST { "messages": [{"role":"user","content":"..."}], "system"?, "temperature"?, "max_tokens"? }
 *   ->  { "answer": "...", "model": "..." }
 *
 * The API key never leaves the server. Provider is OpenAI-compatible, configured via env:
 *   AI_BASE_URL  (default https://api.deepseek.com/v1)
 *   AI_API_KEY   (falls back to OPENAI_API_KEY)
 *   AI_MODEL     (default deepseek-chat)
 */

const AI_BASE_URL = (Deno.env.get("AI_BASE_URL") ?? "https://api.deepseek.com/v1").replace(/\/+$/, "");
const AI_API_KEY = Deno.env.get("AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? "";
const AI_MODEL = Deno.env.get("AI_MODEL") ?? "deepseek-chat";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return json({ ok: true, model: AI_MODEL, provider: "homelab-gateway" });
  }

  try {
    const body = await req.json();
    const incoming: Array<{ role?: string; content?: string }> = Array.isArray(body?.messages) ? body.messages : [];

    const messages: Array<{ role: string; content: string }> = [];
    if (body?.system ?? body?.systemPrompt) {
      messages.push({ role: "system", content: String(body.system ?? body.systemPrompt) });
    }
    for (const m of incoming) {
      if (!m || typeof m.content !== "string" || !m.content.trim()) continue;
      const role = m.role === "assistant" || m.role === "system" ? m.role : "user";
      messages.push({ role, content: m.content });
    }

    if (!messages.length) {
      return json({ answer: "No messages provided.", error: "empty_messages" }, 400);
    }

    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: typeof body?.temperature === "number" ? body.temperature : 0.7,
        max_tokens: typeof body?.max_tokens === "number" ? body.max_tokens : 2048,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("vv-ai upstream error:", res.status, detail.slice(0, 300));
      return json({ answer: "The AI provider returned an error. Please try again.", error: "upstream_error" }, 502);
    }

    const aiData = await res.json();
    const answer = aiData.choices?.[0]?.message?.content?.trim();
    return json({ answer: answer ?? "No answer received.", model: aiData.model ?? AI_MODEL });
  } catch (error) {
    console.error("vv-ai error:", error);
    return json({ answer: "Sorry, there was an error processing your message.", error: "internal_error" }, 500);
  }
});
