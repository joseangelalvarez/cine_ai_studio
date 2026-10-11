import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export interface GeneratedAudioOutput {
  id: string;
  projectId: number;
  url: string;
  text: string;
  provider: string;
  model: string;
  createdAt: number;
}

export class AudioMediaService {
  private static ensureOutputDir(projectId: number): string {
    const dir = path.resolve(process.cwd(), 'public', 'output', String(projectId), 'audio');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public static async generateTts(params: {
    projectId: number;
    text: string;
    voice?: string;
    userApiKey?: string;
    provider?: string;
  }): Promise<GeneratedAudioOutput> {
    const { projectId, text, voice = 'Aoede', userApiKey, provider = 'google' } = params;
    const outputDir = this.ensureOutputDir(projectId);
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.mp3`;
    const filePath = path.join(outputDir, fileName);
    const publicUrl = `/output/${projectId}/audio/${fileName}`;

    // 1. OpenAI TTS
    if (provider.toLowerCase() === 'openai') {
      const openAiKey = (userApiKey || process.env.OPENAI_API_KEY || '').trim();
      if (!openAiKey) {
        throw new Error('NO_API_KEY: Clave de OpenAI no configurada para síntesis de audio.');
      }
      const openai = new OpenAI({ apiKey: openAiKey });
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: (voice as any) || 'onyx',
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      return {
        id: `aud_${Date.now()}`,
        projectId,
        url: publicUrl,
        text,
        provider: 'OpenAI',
        model: 'tts-1',
        createdAt: Date.now(),
      };
    }

    // 2. Google Gemini TTS
    const geminiKey = (userApiKey || process.env.GEMINI_API_KEY || '').trim();
    if (!geminiKey) {
      throw new Error('NO_API_KEY: Clave de Google Gemini no configurada para síntesis de audio.');
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: text,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voice) ? voice : 'Kore',
              },
            },
          },
        },
      });

      let audioData: string | null = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if ((part as any).inlineData?.data) {
          audioData = (part as any).inlineData.data;
          break;
        }
      }

      if (audioData) {
        fs.writeFileSync(filePath, Buffer.from(audioData, 'base64'));
        return {
          id: `aud_${Date.now()}`,
          projectId,
          url: publicUrl,
          text,
          provider: 'Google Gemini',
          model: 'gemini-3.8-flash-lite-tts',
          createdAt: Date.now(),
        };
      }
    } catch (err: any) {
      console.warn('[AudioMediaService] Gemini TTS call error:', err?.message);
      if (err?.message?.includes('ACCOUNT_STATE_INVALID') || err?.message?.includes('deleted or disabled')) {
        throw new Error('AUTH_ERROR: La API Key de Google Gemini configurada está deshabilitada o su cuenta de servicio asociada no está activa (ACCOUNT_STATE_INVALID). Por favor introduce una clave activa en Configuración.');
      }
      throw new Error(`Error en síntesis de voz: ${err?.message || 'Fallo de servicio'}`);
    }

    throw new Error('No se pudo generar el archivo de audio con el servicio de voz configurado. Verifica tus credenciales.');
  }
}
