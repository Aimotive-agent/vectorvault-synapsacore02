import { supabase } from '@/integrations/supabase/client';
import { AISettings } from '@/types/mcp';

/**
 * Provider-aware chat routing.
 *
 * - If the selected provider has a user-supplied API key (BYOK), the request goes
 *   straight from the browser to that provider.
 * - Otherwise it falls back to the self-hosted gateway (`vv-ai` Supabase edge
 *   function on the homelab), so chat works with no key configured. The gateway
 *   key stays on the server.
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type CompatProvider = 'openai' | 'openrouter' | 'deepseek' | 'perplexity' | 'grok';

const COMPAT_BASE_URLS: Record<CompatProvider, string> = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  deepseek: 'https://api.deepseek.com/v1',
  perplexity: 'https://api.perplexity.ai',
  grok: 'https://api.x.ai/v1',
};

const DEFAULT_MODELS: Record<AISettings['provider'], string> = {
  openai: 'gpt-4o-mini',
  openrouter: 'openai/gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  anthropic: 'claude-3-5-haiku-latest',
  deepseek: 'deepseek-chat',
  perplexity: 'sonar',
  grok: 'grok-2-latest',
};

const KEY_FIELDS: Record<AISettings['provider'], keyof AISettings> = {
  openai: 'openaiApiKey',
  openrouter: 'openrouterApiKey',
  gemini: 'geminiApiKey',
  anthropic: 'anthropicApiKey',
  deepseek: 'deepseekApiKey',
  perplexity: 'perplexityApiKey',
  grok: 'grokApiKey',
};

/** Does the selected model plausibly belong to this provider? */
const modelFitsProvider = (model: string, provider: AISettings['provider']): boolean => {
  if (!model) return false;
  switch (provider) {
    case 'gemini': return model.startsWith('gemini');
    case 'anthropic': return model.startsWith('claude');
    case 'openai': return /^(gpt-|o[0-9]|chatgpt)/.test(model);
    case 'openrouter': return model.includes('/');
    case 'deepseek': return model.startsWith('deepseek');
    case 'perplexity': return model.startsWith('sonar');
    case 'grok': return model.startsWith('grok');
    default: return false;
  }
};

const resolveModel = (settings: AISettings): string => {
  const { selectedModel, provider } = settings;
  return modelFitsProvider(selectedModel, provider) ? selectedModel : DEFAULT_MODELS[provider];
};

const apiKeyFor = (settings: AISettings): string => {
  const value = settings[KEY_FIELDS[settings.provider]];
  return typeof value === 'string' ? value.trim() : '';
};

const splitSystem = (messages: AIMessage[]): { system?: string; rest: AIMessage[] } => {
  const systems = messages.filter(m => m.role === 'system').map(m => m.content);
  return {
    system: systems.length ? systems.join('\n\n') : undefined,
    rest: messages.filter(m => m.role !== 'system'),
  };
};

const friendly = (provider: string, status: number): string => {
  if (status === 401 || status === 403) return `The ${provider} API key was rejected. Check it in AI Settings.`;
  if (status === 404) return `The selected model is not available for ${provider}. Check AI Settings.`;
  if (status === 429) return `${provider} rate limit reached. Please wait a moment and try again.`;
  return `${provider} returned an error (HTTP ${status}). Please try again.`;
};

async function chatCompat(messages: AIMessage[], settings: AISettings, baseUrl: string, apiKey: string): Promise<string> {
  const { system, rest } = splitSystem(messages);
  const payload: Record<string, unknown> = {
    model: resolveModel(settings),
    messages: system ? [{ role: 'system', content: system }, ...rest] : rest,
    temperature: settings.temperature ?? 0.7,
    max_tokens: settings.maxTokens ?? 2048,
  };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(friendly(settings.provider, res.status));
  const data = await res.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error(`${settings.provider} returned an empty response.`);
  return answer.trim();
}

async function chatGemini(messages: AIMessage[], settings: AISettings, apiKey: string): Promise<string> {
  const { system, rest } = splitSystem(messages);
  const contents = rest.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: settings.temperature ?? 0.7,
      maxOutputTokens: settings.maxTokens ?? 2048,
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${resolveModel(settings)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(friendly('Gemini', res.status));
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const answer = parts.map((p: { text?: string }) => p.text ?? '').join('').trim();
  if (!answer) throw new Error('Gemini returned an empty response.');
  return answer;
}

async function chatAnthropic(messages: AIMessage[], settings: AISettings, apiKey: string): Promise<string> {
  const { system, rest } = splitSystem(messages);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: resolveModel(settings),
      max_tokens: settings.maxTokens ?? 2048,
      temperature: settings.temperature ?? 0.7,
      ...(system ? { system } : {}),
      messages: rest,
    }),
  });

  if (!res.ok) throw new Error(friendly('Anthropic', res.status));
  const data = await res.json();
  const answer = (data?.content ?? [])
    .map((block: { type?: string; text?: string }) => (block.type === 'text' ? block.text ?? '' : ''))
    .join('')
    .trim();
  if (!answer) throw new Error('Anthropic returned an empty response.');
  return answer;
}

async function chatGateway(messages: AIMessage[], settings: AISettings): Promise<string> {
  const { system, rest } = splitSystem(messages);

  const { data, error } = await supabase.functions.invoke('vv-ai', {
    body: {
      messages: rest,
      ...(system ? { system } : {}),
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens ?? 2048,
    },
  });

  if (error) throw new Error('The AI gateway is unreachable. Please try again shortly.');
  const answer = (data as { answer?: string } | null)?.answer;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error('The AI gateway returned an empty response.');
  return answer.trim();
}

export const aiProviderService = {
  /**
   * Generate a chat completion for the given messages using the selected
   * provider. Falls back to the self-hosted gateway when no API key is set.
   */
  async chat(messages: AIMessage[], settings: AISettings): Promise<string> {
    const apiKey = apiKeyFor(settings);

    if (!apiKey) {
      return chatGateway(messages, settings);
    }

    switch (settings.provider) {
      case 'gemini':
        return chatGemini(messages, settings, apiKey);
      case 'anthropic':
        return chatAnthropic(messages, settings, apiKey);
      default:
        return chatCompat(messages, settings, COMPAT_BASE_URLS[settings.provider as CompatProvider], apiKey);
    }
  },

  /** Which backend will serve the next message (for status labels). */
  describe(settings: AISettings): string {
    return apiKeyFor(settings) ? settings.provider : 'Veritas gateway';
  },
};

export default aiProviderService;
