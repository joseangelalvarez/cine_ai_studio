import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { JobsManager, AsyncJob } from '../jobs';

export class VideoMediaService {
  private static ensureOutputDir(projectId: number): string {
    const dir = path.resolve(process.cwd(), 'public', 'output', String(projectId), 'video');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public static async startVeoJob(params: {
    projectId: number;
    title: string;
    prompt: string;
    durationSec?: number;
    userApiKey?: string;
  }): Promise<AsyncJob> {
    const { projectId, title, prompt, durationSec = 4, userApiKey } = params;
    const geminiKey = (userApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!geminiKey) {
      throw new Error('NO_API_KEY: Clave de Google Gemini no configurada para render de video con Veo.');
    }

    const jobId = `job_veo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const outputDir = this.ensureOutputDir(projectId);
    const fileName = `clip_${jobId}.mp4`;
    const filePath = path.join(outputDir, fileName);
    const publicUrl = `/output/${projectId}/video/${fileName}`;

    const job: AsyncJob = {
      id: jobId,
      projectId,
      type: 'video',
      title,
      prompt,
      status: 'PROCESSING',
      progressPercent: 20,
      provider: 'Google Veo',
      model: 'veo-3.1-generate-preview',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    JobsManager.saveJob(job);

    // Asynchronous execution via Google GenAI SDK
    (async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        // Attempt generateVideos if supported by the model & key
        if ((ai.models as any).generateVideos) {
          const operation = await (ai.models as any).generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt,
            config: {
              durationSeconds: durationSec,
              aspectRatio: '16:9',
            },
          });

          // If operation is already done or has video bytes
          let videoBytes = operation?.generatedVideos?.[0]?.video?.videoBytes;
          if (!videoBytes && operation?.done) {
            videoBytes = operation?.response?.generatedVideos?.[0]?.video?.videoBytes;
          }

          if (videoBytes) {
            fs.writeFileSync(filePath, Buffer.from(videoBytes, 'base64'));
            JobsManager.updateJob(jobId, {
              status: 'COMPLETED',
              progressPercent: 100,
              outputUrl: publicUrl,
            });
            return;
          }
        }

        // If Veo is not enabled on this key or requires specific cloud quota
        JobsManager.updateJob(jobId, {
          status: 'FAILED',
          progressPercent: 0,
          error: 'VEO_QUOTA_REQUIRED: El modelo Google Veo requiere una clave con facturación activa y cuota para Veo 3.1. Por norma estricta de Cine AI Studio, no se suministra un video falso.',
        });
      } catch (err: any) {
        console.error(`[VideoMediaService] Veo job ${jobId} failed:`, err);
        const errMsg = err?.message || 'Fallo de servicio';
        let friendlyErr = `Error al procesar video en Google Veo: ${errMsg}`;
        if (errMsg.includes('ACCOUNT_STATE_INVALID') || errMsg.includes('deleted or disabled')) {
          friendlyErr = 'AUTH_ERROR: La clave API de Google Gemini está deshabilitada o su cuenta de servicio asociada no está activa (ACCOUNT_STATE_INVALID). Configura tu clave activa en la Configuración de Proveedores.';
        }
        JobsManager.updateJob(jobId, {
          status: 'FAILED',
          progressPercent: 0,
          error: friendlyErr,
        });
      }
    })();

    return job;
  }
}
