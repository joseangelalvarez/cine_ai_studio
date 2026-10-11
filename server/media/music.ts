import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface GeneratedMusicOutput {
  id: string;
  projectId: number;
  url: string;
  prompt: string;
  provider: string;
  model: string;
  createdAt: number;
}

export class MusicMediaService {
  private static ensureOutputDir(projectId: number): string {
    const dir = path.resolve(process.cwd(), 'public', 'output', String(projectId), 'music');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public static async generateMusic(params: {
    projectId: number;
    prompt: string;
    userApiKey?: string;
  }): Promise<GeneratedMusicOutput> {
    const { projectId, prompt, userApiKey } = params;
    const geminiKey = (userApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!geminiKey) {
      throw new Error('NO_API_KEY: Clave de Google Gemini no configurada para generación musical.');
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const outputDir = this.ensureOutputDir(projectId);
    const fileName = `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.mp3`;
    const filePath = path.join(outputDir, fileName);
    const publicUrl = `/output/${projectId}/music/${fileName}`;

    try {
      const response = await ai.models.generateContent({
        model: 'lyria-3-clip-preview',
        contents: prompt,
      });

      let audioBytes: string | null = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if ((part as any).inlineData?.data) {
          audioBytes = (part as any).inlineData.data;
          break;
        }
      }

      if (audioBytes) {
        fs.writeFileSync(filePath, Buffer.from(audioBytes, 'base64'));
        return {
          id: `mus_${Date.now()}`,
          projectId,
          url: publicUrl,
          prompt,
          provider: 'Google Lyria',
          model: 'lyria-3-clip-preview',
          createdAt: Date.now(),
        };
      }
    } catch (err: any) {
      console.warn('[MusicMediaService] Lyria call error:', err?.message);
      throw new Error(`MUSIC_UNAVAILABLE: El modelo Lyria (lyria-3-clip-preview) requiere acceso específico a la API de Google DeepMind (${err?.message || 'sin cuota'}). Por norma estricta del estudio, no se generará audio simulado.`);
    }

    throw new Error('MUSIC_UNAVAILABLE: La API de Lyria no devolvió datos binarios de audio para la banda sonora.');
  }
}
