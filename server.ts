import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { ConfigManager } from './server/config';
import { LlmService } from './server/llm';
import { PromptCompiler } from './server/promptCompiler';
import { ImageMediaService } from './server/media/image';
import { AudioMediaService } from './server/media/audio';
import { MusicMediaService } from './server/media/music';
import { VideoMediaService } from './server/media/video';
import { JobsManager } from './server/jobs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Ensure public/output directory exists and mount static route
const outputDirPath = path.resolve(__dirname, 'public', 'output');
if (!fs.existsSync(outputDirPath)) {
  fs.mkdirSync(outputDirPath, { recursive: true });
}
app.use('/output', express.static(outputDirPath));

// ==========================================
// 1. API: Server Configuration & Provider Availability
// ==========================================
app.get('/api/config', (_req: Request, res: Response) => {
  try {
    const config = ConfigManager.loadConfig();
    const availability = ConfigManager.getAvailability();
    return res.json({
      success: true,
      config,
      availability,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error al obtener configuración' });
  }
});

// ==========================================
// 2. API: Real Multi-LLM Subagent Orchestration
// ==========================================
app.post('/api/orchestrate', async (req: Request, res: Response) => {
  try {
    const { project, subagent, prompt, accumulatedMemories, providerSettings } = req.body;

    if (!project || !subagent) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos (project, subagent)' });
    }

    // Resolve model and provider according to cineai.config.json matrix or user override
    const resolved = ConfigManager.resolveModelForAgent(subagent.key, subagent.tier || 'standard');
    const targetProvider = providerSettings?.textProvider || resolved.provider;
    const targetModel = providerSettings?.textModel || resolved.model;

    // Check availability
    const availability = ConfigManager.getAvailability();
    if (!availability.google && targetProvider === 'google' && !providerSettings?.geminiApiKey) {
      return res.status(503).json({
        code: 'NO_PROVIDER',
        error: 'Google Gemini no está configurado en el servidor (GEMINI_API_KEY ausente). Por favor introduce tu API Key en la configuración.',
      });
    }
    if (!availability.openai && targetProvider === 'openai' && !providerSettings?.openaiApiKey) {
      return res.status(503).json({
        code: 'NO_PROVIDER',
        error: 'OpenAI no está configurado en el servidor (OPENAI_API_KEY ausente). Por favor introduce tu API Key en la configuración.',
      });
    }
    if (!availability.anthropic && targetProvider === 'anthropic' && !providerSettings?.anthropicApiKey) {
      return res.status(503).json({
        code: 'NO_PROVIDER',
        error: 'Anthropic no está configurado en el servidor (ANTHROPIC_API_KEY ausente). Por favor introduce tu API Key en la configuración.',
      });
    }

    const memoriesText = Array.isArray(accumulatedMemories) && accumulatedMemories.length > 0
      ? accumulatedMemories.map((m: { title: string; content: string }) => `--- [${m.title}] ---\n${m.content}`).join('\n\n')
      : '(No hay entregables previos en la memoria. Comienza la fase de arranque de preproducción.)';

    const systemInstruction = `Eres un Agente Profesional de Cine en el rol de: ${subagent.name} (${subagent.role}).
Departamento: ${subagent.layer}.
Tus funciones asignadas son:
${(subagent.duties || []).map((d: string) => ` - ${d}`).join('\n')}

DATOS DE LA PRODUCCIÓN:
- Título: "${project.title}"
- Género: ${project.genre || 'Drama'}
- Estilo Visual: ${project.artStyle || 'Cinemático Ultra-Realista'}
- Premisa / Sinopsis: ${project.description || ''}
- Target: ${project.targetAudience || 'Audiencia General'}

MEMORIA COMPARTIDA DE PRODUCCIÓN:
${memoriesText}

DIRECTIVAS ESTRICTAS:
- Basa tu trabajo rigurosamente en la premisa "${project.description}".
- Redacta en ESPAÑOL con lenguaje técnico cinematográfico.
- CERO introducción conversacional o preámbulos.`;

    const userPrompt = prompt || subagent.suggestedPrompt || `Genera el entregable técnico oficial de producción para ${subagent.name} (${subagent.layer}) de la película "${project.title}".`;

    const userApiKey = targetProvider === 'google'
      ? providerSettings?.geminiApiKey
      : targetProvider === 'openai'
      ? providerSettings?.openaiApiKey
      : providerSettings?.anthropicApiKey;

    const result = await LlmService.generateText({
      provider: targetProvider,
      model: targetModel,
      systemInstruction,
      userPrompt,
      userApiKey,
    });

    return res.json({
      success: true,
      content: result.text,
      latencyMs: result.latencyMs,
      estimatedCost: result.costUsd,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error('[API /api/orchestrate] Error:', error?.message || error);
    const msg = error?.message || 'Error en la llamada al modelo LLM';
    if (msg.includes('NO_PROVIDER')) {
      return res.status(503).json({ code: 'NO_PROVIDER', error: msg });
    }
    if (
      msg.includes('AUTH_ERROR') ||
      msg.includes('ACCOUNT_STATE_INVALID') ||
      msg.includes('UNAUTHENTICATED') ||
      msg.includes('deleted or disabled')
    ) {
      return res.status(401).json({ code: 'AUTH_ERROR', error: msg });
    }
    if (msg.includes('QUOTA_ERROR') || msg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ code: 'QUOTA_ERROR', error: msg });
    }
    return res.status(500).json({ error: msg });
  }
});

// ==========================================
// 3. API: Prompt Compiler (Seedance 2.0 & Veo Video Specs)
// ==========================================
app.post('/api/prompts/compile', async (req: Request, res: Response) => {
  try {
    const { project, memories } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'Faltan parámetros del proyecto' });
    }

    const compiled = await PromptCompiler.compileFullPackage({
      projectId: Number(project.id) || 1,
      title: project.title || 'Proyecto Cinematográfico',
      genre: project.genre,
      artStyle: project.artStyle,
      synopsis: project.description,
      memories: memories || [],
    });

    return res.json({
      success: true,
      compiled,
    });
  } catch (err: any) {
    console.error('[API /api/prompts/compile] Error:', err);
    return res.status(500).json({ error: err?.message || 'Error al compilar prompts' });
  }
});

// ==========================================
// 4. API: Real Image Generation (Characters & Environments)
// ==========================================
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { projectId, prompt, role, style, provider, model, apiKey, geminiApiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Se requiere prompt para generar imagen' });
    }

    const userKey = apiKey || geminiApiKey;
    const generated = await ImageMediaService.generate({
      projectId: Number(projectId) || 1,
      prompt,
      role: role || 'character',
      style,
      provider,
      model,
      userApiKey: userKey,
    });

    return res.json({
      success: true,
      image: generated,
    });
  } catch (err: any) {
    console.error('[API /api/generate-image] Error:', err?.message || err);
    const msg = err?.message || 'Error al generar imagen';
    if (
      msg.includes('AUTH_ERROR') ||
      msg.includes('ACCOUNT_STATE_INVALID') ||
      msg.includes('UNAUTHENTICATED') ||
      msg.includes('NO_API_KEY')
    ) {
      return res.status(401).json({ code: 'AUTH_ERROR', error: msg });
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('limit: 0') || msg.includes('cuota')) {
      return res.status(429).json({ code: 'QUOTA_ERROR', error: msg });
    }
    return res.status(500).json({ error: msg });
  }
});

// ==========================================
// 5. API: Real Audio Generation (TTS Voices & Foley)
// ==========================================
app.post('/api/generate-audio', async (req: Request, res: Response) => {
  try {
    const { projectId, text, voice, provider, apiKey } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Se requiere texto para síntesis de audio' });
    }

    const generated = await AudioMediaService.generateTts({
      projectId: Number(projectId) || 1,
      text,
      voice,
      provider,
      userApiKey: apiKey,
    });

    return res.json({
      success: true,
      audio: generated,
    });
  } catch (err: any) {
    console.error('[API /api/generate-audio] Error:', err);
    return res.status(500).json({ error: err?.message || 'Error al sintetizar audio' });
  }
});

// ==========================================
// 6. API: Real Music Generation (Lyria)
// ==========================================
app.post('/api/generate-music', async (req: Request, res: Response) => {
  try {
    const { projectId, prompt, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Se requiere prompt para la banda sonora' });
    }

    const generated = await MusicMediaService.generateMusic({
      projectId: Number(projectId) || 1,
      prompt,
      userApiKey: apiKey,
    });

    return res.json({
      success: true,
      music: generated,
    });
  } catch (err: any) {
    console.error('[API /api/generate-music] Error:', err);
    return res.status(500).json({ error: err?.message || 'Error al generar música' });
  }
});

// ==========================================
// 7. API: Real Video Jobs (Google Veo)
// ==========================================
app.post('/api/video/start', async (req: Request, res: Response) => {
  try {
    const { projectId, title, prompt, durationSec, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Se requiere prompt de video' });
    }

    const job = await VideoMediaService.startVeoJob({
      projectId: Number(projectId) || 1,
      title: title || 'Toma de Video',
      prompt,
      durationSec: durationSec || 4,
      userApiKey: apiKey,
    });

    return res.json({
      success: true,
      job,
    });
  } catch (err: any) {
    console.error('[API /api/video/start] Error:', err);
    return res.status(500).json({ error: err?.message || 'Error al iniciar job de video' });
  }
});

app.get('/api/video/status/:jobId', (req: Request, res: Response) => {
  const job = JobsManager.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job no encontrado' });
  }
  return res.json({ success: true, job });
});

app.get('/api/jobs', (req: Request, res: Response) => {
  const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
  if (projectId) {
    return res.json({ success: true, jobs: JobsManager.getJobsForProject(projectId) });
  }
  return res.json({ success: true, jobs: JobsManager.getAllJobs() });
});

// ==========================================
// 8. API: Health Check
// ==========================================
app.get('/api/health', (_req: Request, res: Response) => {
  const availability = ConfigManager.getAvailability();
  res.json({
    status: 'ok',
    availability,
    service: 'Cine AI Studio Backend Real',
    timestamp: Date.now(),
  });
});

// ==========================================
// 9. Mounting Vite in Dev / Static Dist in Prod
// ==========================================
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 Cine AI Studio dev server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
