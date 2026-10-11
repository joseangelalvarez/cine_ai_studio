import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigManager } from './config';

export interface LlmGenerationResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  latencyMs: number;
  costUsd: number;
}

export interface LlmCallOptions {
  provider?: string;
  model?: string;
  systemInstruction?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  userApiKey?: string;
}

export class LlmService {
  private static getGeminiClient(customKey?: string): GoogleGenAI | null {
    const key = (customKey || process.env.GEMINI_API_KEY || '').trim();
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
  }

  private static getOpenAiClient(customKey?: string): OpenAI | null {
    const key = (customKey || process.env.OPENAI_API_KEY || '').trim();
    if (!key) return null;
    return new OpenAI({ apiKey: key });
  }

  private static getAnthropicClient(customKey?: string): Anthropic | null {
    const key = (customKey || process.env.ANTHROPIC_API_KEY || '').trim();
    if (!key) return null;
    return new Anthropic({ apiKey: key });
  }

  public static calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const m = model.toLowerCase();
    let inRate = 0.075 / 1_000_000;
    let outRate = 0.30 / 1_000_000;

    if (m.includes('pro')) {
      inRate = 1.25 / 1_000_000;
      outRate = 5.00 / 1_000_000;
    } else if (m.includes('claude-3-5-sonnet') || m.includes('claude-sonnet')) {
      inRate = 3.00 / 1_000_000;
      outRate = 15.00 / 1_000_000;
    } else if (m.includes('claude-3-5-haiku') || m.includes('claude-haiku')) {
      inRate = 0.80 / 1_000_000;
      outRate = 4.00 / 1_000_000;
    } else if (m.includes('gpt-4o-mini')) {
      inRate = 0.15 / 1_000_000;
      outRate = 0.60 / 1_000_000;
    } else if (m.includes('gpt-4o') || m.includes('gpt-5')) {
      inRate = 2.50 / 1_000_000;
      outRate = 10.00 / 1_000_000;
    }

    return Number(((inputTokens * inRate) + (outputTokens * outRate)).toFixed(6));
  }

  public static async generateText(options: LlmCallOptions): Promise<LlmGenerationResult> {
    const startTime = Date.now();
    const provider = (options.provider || 'google').toLowerCase();
    const model = options.model || (provider === 'openai' ? 'gpt-4o' : provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-3.8-flash');

    // 1. Anthropic provider
    if (provider === 'anthropic') {
      const client = this.getAnthropicClient(options.userApiKey);
      if (!client) {
        throw new Error('NO_PROVIDER: Anthropic API key no configurada. Agrega ANTHROPIC_API_KEY en las variables de entorno del servidor.');
      }

      const response = await client.messages.create({
        model: model.includes('claude') ? model : 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 3500,
        system: options.systemInstruction || 'Eres un asistente cinematográfico profesional.',
        messages: [{ role: 'user', content: options.userPrompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      const text = textBlock ? textBlock.text : '';
      const inputTokens = response.usage?.input_tokens || Math.round(options.userPrompt.length / 3.8);
      const outputTokens = response.usage?.output_tokens || Math.round(text.length / 3.8);

      return {
        text,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        model,
        provider: 'Anthropic',
        latencyMs: Date.now() - startTime,
        costUsd: this.calculateCost(model, inputTokens, outputTokens),
      };
    }

    // 2. OpenAI provider
    if (provider === 'openai') {
      const client = this.getOpenAiClient(options.userApiKey);
      if (!client) {
        throw new Error('NO_PROVIDER: OpenAI API key no configurada. Agrega OPENAI_API_KEY en las variables de entorno del servidor.');
      }

      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: options.userPrompt });

      const response = await client.chat.completions.create({
        model: model.includes('gpt') ? model : 'gpt-4o',
        messages,
        temperature: options.temperature ?? 0.7,
      });

      const text = response.choices[0]?.message?.content || '';
      const inputTokens = response.usage?.prompt_tokens || Math.round(options.userPrompt.length / 3.8);
      const outputTokens = response.usage?.completion_tokens || Math.round(text.length / 3.8);

      return {
        text,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        model,
        provider: 'OpenAI',
        latencyMs: Date.now() - startTime,
        costUsd: this.calculateCost(model, inputTokens, outputTokens),
      };
    }

    // 3. Google Gemini provider (default)
    const client = this.getGeminiClient(options.userApiKey);
    if (!client) {
      throw new Error('NO_PROVIDER: Google Gemini API key no configurada. Agrega GEMINI_API_KEY en las variables de entorno del servidor.');
    }

    // Candidate fallback models for Gemini resilience
    const candidateModels = [
      model,
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let lastError: any = null;
    for (const targetModel of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model: targetModel,
          contents: options.userPrompt,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.7,
          },
        });

        if (response.text) {
          const inputTokens = (response as any).usageMetadata?.promptTokenCount || Math.round(options.userPrompt.length / 3.8);
          const outputTokens = (response as any).usageMetadata?.candidatesTokenCount || Math.round(response.text.length / 3.8);

          return {
            text: response.text,
            usage: {
              inputTokens,
              outputTokens,
              totalTokens: inputTokens + outputTokens,
            },
            model: targetModel,
            provider: 'Google Gemini',
            latencyMs: Date.now() - startTime,
            costUsd: this.calculateCost(targetModel, inputTokens, outputTokens),
          };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        console.warn(`[LlmService] Gemini model ${targetModel} call failed:`, errMsg);

        // If authentication error or disabled account, stop immediately (no candidate will work with invalid key)
        if (
          errMsg.includes('ACCOUNT_STATE_INVALID') ||
          errMsg.includes('deleted or disabled') ||
          errMsg.includes('UNAUTHENTICATED') ||
          errMsg.includes('API_KEY_INVALID')
        ) {
          throw new Error('AUTH_ERROR: La API Key de Google Gemini configurada está deshabilitada o su cuenta de servicio asociada no está activa (ACCOUNT_STATE_INVALID). Por favor, introduce tu propia clave de Google Gemini o OpenAI en la Configuración de Proveedores.');
        }
      }
    }

    const rawMessage = lastError?.message || 'Servicio no disponible';
    let cleanMessage = rawMessage;
    try {
      if (rawMessage.startsWith('{')) {
        const parsed = JSON.parse(rawMessage);
        cleanMessage = parsed?.error?.message || rawMessage;
      }
    } catch {
      // Ignore json parse error
    }

    if (cleanMessage.includes('RESOURCE_EXHAUSTED') || cleanMessage.includes('quota')) {
      throw new Error(`QUOTA_ERROR: La cuota de llamadas para Google Gemini se ha agotado (${cleanMessage}). Por favor revisa la cuota de tu clave o introduce una clave personal en la Configuración.`);
    }

    throw new Error(`Error en la llamada a Google Gemini: ${cleanMessage}`);
  }
}
