import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export interface GeneratedImageOutput {
  id: string;
  projectId: number;
  url: string;
  prompt: string;
  role: 'character' | 'environment' | 'storyboard';
  provider: string;
  model: string;
  createdAt: number;
}

export class ImageMediaService {
  private static ensureOutputDir(projectId: number, subfolder: string): string {
    const dir = path.resolve(process.cwd(), 'public', 'output', String(projectId), subfolder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public static async generate(params: {
    projectId: number;
    prompt: string;
    role?: 'character' | 'environment' | 'storyboard';
    style?: string;
    userApiKey?: string;
    provider?: string;
    model?: string;
    aspectRatio?: '16:9' | '1:1' | '3:4' | '9:16' | '4:3';
  }): Promise<GeneratedImageOutput> {
    const {
      projectId,
      prompt,
      role = 'character',
      style,
      userApiKey,
      provider = 'google',
      model,
      aspectRatio = role === 'environment' ? '16:9' : '3:4',
    } = params;

    const subfolder = role === 'environment' ? 'backgrounds' : 'characters';
    const outputDir = this.ensureOutputDir(projectId, subfolder);
    const fileName = `${role}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`;
    const filePath = path.join(outputDir, fileName);
    const publicUrl = `/output/${projectId}/${subfolder}/${fileName}`;

    const effectiveGeminiKey = (userApiKey || process.env.GEMINI_API_KEY || '').trim();
    const effectiveOpenAiKey = (userApiKey || process.env.OPENAI_API_KEY || '').trim();

    // 1. OpenAI DALL-E 3 if requested
    if (provider.toLowerCase() === 'openai' || provider.toLowerCase() === 'openai-dalle') {
      if (!effectiveOpenAiKey) {
        throw new Error('NO_API_KEY: Clave de OpenAI no configurada para generación de imágenes.');
      }
      const openai = new OpenAI({ apiKey: effectiveOpenAiKey });
      const imgRes = await openai.images.generate({
        model: model || 'dall-e-3',
        prompt: `${prompt}. Style: ${style || 'cinematic'}, high resolution, realistic textures`,
        response_format: 'b64_json',
        size: aspectRatio === '16:9' ? '1792x1024' : '1024x1024',
      });

      const b64 = imgRes.data?.[0]?.b64_json;
      if (!b64) throw new Error('OpenAI DALL-E no devolvió datos de imagen.');
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));

      return {
        id: `img_${Date.now()}`,
        projectId,
        url: publicUrl,
        prompt,
        role,
        provider: 'OpenAI',
        model: model || 'dall-e-3',
        createdAt: Date.now(),
      };
    }

    // 2. Google Gemini Vision Models (gemini-3.1-flash-lite-image or gemini-nano-banana-2.1)
    let usedModel = model || 'gemini-3.1-flash-lite-image';
    let imageBuffer: Buffer | null = null;
    let googleError: string | null = null;

    if (effectiveGeminiKey) {
      const ai = new GoogleGenAI({ apiKey: effectiveGeminiKey });
      const candidateVisionModels = [
        model && model !== 'imagen-3.0-generate-002' ? model : 'gemini-3.1-flash-lite-image',
        'gemini-nano-banana-2.1',
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      for (const m of candidateVisionModels) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: {
              parts: [{ text: `${prompt}. Cinematography, highly detailed film still, ${style || 'cinematic ultra-realistic'}` }],
            },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '3:4' ? '3:4' : '1:1',
              },
            },
          });

          for (const part of resp.candidates?.[0]?.content?.parts || []) {
            if ((part as any).inlineData?.data) {
              imageBuffer = Buffer.from((part as any).inlineData.data, 'base64');
              usedModel = m;
              break;
            }
          }
          if (imageBuffer) break;
        } catch (err: any) {
          googleError = err?.message || 'Error desconocido';
          console.warn(`[ImageMediaService] Google image model ${m} call:`, googleError);

          // If authentication error or disabled account, break candidate loop immediately
          if (
            googleError?.includes('ACCOUNT_STATE_INVALID') ||
            googleError?.includes('deleted or disabled') ||
            googleError?.includes('UNAUTHENTICATED')
          ) {
            break;
          }
        }
      }
    }

    // 3. Fallback to OpenAI if key is available and Google failed
    if (!imageBuffer && effectiveOpenAiKey) {
      try {
        console.info('[ImageMediaService] Trying OpenAI DALL-E fallback...');
        const openai = new OpenAI({ apiKey: effectiveOpenAiKey });
        const imgRes = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `${prompt}. Style: ${style || 'cinematic'}, high resolution, realistic textures`,
          response_format: 'b64_json',
          size: aspectRatio === '16:9' ? '1792x1024' : '1024x1024',
        });
        const b64 = imgRes.data?.[0]?.b64_json;
        if (b64) {
          imageBuffer = Buffer.from(b64, 'base64');
          usedModel = 'dall-e-3';
          provider = 'OpenAI';
        }
      } catch (dalleErr: any) {
        console.warn('[ImageMediaService] OpenAI DALL-E fallback failed:', dalleErr?.message);
      }
    }

    // 4. Fallback to Real GPU Diffusion via Flux / Pollinations AI
    // (Used when Google key has quota limit 0 on free tier or unauthenticated service account)
    if (!imageBuffer) {
      try {
        console.info('[ImageMediaService] Generating real concept frame via GPU Diffusion (Pollinations)...');
        const width = aspectRatio === '16:9' ? 1024 : aspectRatio === '3:4' ? 768 : 1024;
        const height = aspectRatio === '16:9' ? 576 : aspectRatio === '3:4' ? 1024 : 1024;
        const cleanPrompt = `${prompt}, cinematography, 35mm film still, ${style || 'cinematic realistic 8k'}`;
        const enhancedPrompt = encodeURIComponent(cleanPrompt);
        const pollUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=${width}&height=${height}&nologo=true`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const pollRes = await fetch(pollUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (pollRes.ok) {
          const arrayBuf = await pollRes.arrayBuffer();
          if (arrayBuf.byteLength > 1000) {
            imageBuffer = Buffer.from(arrayBuf);
            usedModel = 'flux-diffusion';
          }
        }
      } catch (pollErr: any) {
        console.warn('[ImageMediaService] Diffusion fallback failed:', pollErr?.message);
      }
    }

    if (!imageBuffer) {
      let finalMsg = 'No se pudo generar la imagen con los modelos disponibles.';
      if (googleError?.includes('ACCOUNT_STATE_INVALID') || googleError?.includes('deleted or disabled')) {
        finalMsg = 'La clave API de Google Gemini en el entorno está deshabilitada (ACCOUNT_STATE_INVALID). Por favor introduce una clave activa en la Configuración de Proveedores.';
      } else if (googleError?.includes('RESOURCE_EXHAUSTED') || googleError?.includes('limit: 0')) {
        finalMsg = 'Google requiere facturación habilitada para modelos de visión directa (limit: 0 en capa gratuita). Configura una clave con facturación o usa OpenAI.';
      }
      throw new Error(finalMsg);
    }

    fs.writeFileSync(filePath, imageBuffer);

    return {
      id: `img_${Date.now()}`,
      projectId,
      url: publicUrl,
      prompt,
      role,
      provider: usedModel.startsWith('flux') ? 'Flux Diffusion' : provider === 'OpenAI' ? 'OpenAI' : 'Google Gemini',
      model: usedModel,
      createdAt: Date.now(),
    };
  }
}
