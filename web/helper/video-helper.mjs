import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';
import os from 'node:os';
import { loadGeminiKey, saveGeminiKey, geminiVisualQA, splitPromptTerms, composePrompt, QA_BASE_NEGATIVES } from './visual-qa.mjs';
import { renderWithVeo, generateCharacterImageGemini } from './cloud-render.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, '.cineai');
const STATE_FILE = path.join(DATA_DIR, 'video-state.json');
const TOKEN_FILE = path.join(DATA_DIR, 'huggingface-token.txt');
const MODEL_DIR = path.join(DATA_DIR, 'video-models');

let generationProgress = {
  active: false,
  workflow: null,
  prompt: null,
  status: 'idle',
  percent: 0,
  startedAt: null,
  message: null,
  outputPath: null,
  // ── Visual QA (Plan v3.1) ──
  attempt: 0,
  maxAttempts: 0,
  qaStatus: 'disabled', // 'disabled' | 'pending' | 'approved' | 'rejected' | 'skipped'
  qaCriticism: '',
};

// Per-model download progress: { [modelId]: { percent, bytesDownloaded, totalBytes, status } }
const downloadProgress = new Map();

// Active server port (set when serve() starts)
let activePort = 8787;

const DEFAULT_STATE = {
  selectedWorkflow: 'animatediff',
  installedModels: [],
  lastUpdatedAt: null,
};

const DEFAULT_MODELS = [
  {
    id: 'Wan-AI/Wan2.2-T2V-A14B',
    provider: 'wan',
    name: 'Wan2.2 T2V A14B',
    sourceUrl: 'https://huggingface.co/Wan-AI/Wan2.2-T2V-A14B',
    requiresToken: true,
    estimatedSize: 'large',
  },
  {
    id: 'Wan-AI/Wan2.2-I2V-A14B',
    provider: 'wan',
    name: 'Wan2.2 I2V A14B',
    sourceUrl: 'https://huggingface.co/Wan-AI/Wan2.2-I2V-A14B',
    requiresToken: true,
    estimatedSize: 'large',
  },
  {
    id: 'Wan-AI/Wan2.2-Animate-14B',
    provider: 'wan',
    name: 'Wan2.2 Animate 14B',
    sourceUrl: 'https://huggingface.co/Wan-AI/Wan2.2-Animate-14B',
    requiresToken: true,
    estimatedSize: 'very-large',
  },
  {
    id: 'Lightricks/LTX-2.3',
    provider: 'ltx',
    name: 'LTX 2.3',
    sourceUrl: 'https://huggingface.co/Lightricks/LTX-2.3',
    requiresToken: true,
    estimatedSize: 'large',
  },
  {
    id: 'Lightricks/LTX-2.3-fp8',
    provider: 'ltx',
    name: 'LTX 2.3 FP8',
    sourceUrl: 'https://huggingface.co/Lightricks/LTX-2.3-fp8',
    requiresToken: true,
    estimatedSize: 'large',
  },
  {
    id: 'animatediff-local',
    provider: 'animatediff',
    name: 'AnimateDiff Local',
    sourceUrl: 'https://github.com/guoyww/AnimateDiff',
    requiresToken: false,
    estimatedSize: 'local',
  },
  {
    id: 'ollama-local',
    provider: 'ollama',
    name: 'Ollama Local',
    sourceUrl: 'https://ollama.com',
    requiresToken: false,
    estimatedSize: 'local',
  },
];

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(MODEL_DIR, { recursive: true });
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function loadState() {
  await ensureDataDir();
  return readJson(STATE_FILE, DEFAULT_STATE);
}

async function saveState(state) {
  await ensureDataDir();
  await writeJson(STATE_FILE, { ...DEFAULT_STATE, ...state, lastUpdatedAt: Date.now() });
}

async function saveToken(token) {
  await ensureDataDir();
  await fs.writeFile(TOKEN_FILE, token.trim(), 'utf8');
  return { saved: true };
}

async function loadToken() {
  try {
    const token = await fs.readFile(TOKEN_FILE, 'utf8');
    return token.trim();
  } catch {
    return '';
  }
}

async function listModels() {
  const state = await loadState();
  const installedFiles = await fs.readdir(MODEL_DIR, { withFileTypes: true }).catch(() => []);
  const installedNames = new Set(installedFiles.filter((file) => file.isDirectory()).map((file) => file.name));
  const tokenAvailable = Boolean(await loadToken());

  return DEFAULT_MODELS.map((model) => ({
    ...model,
    installed: installedNames.has(safeName(model.id)) || state.installedModels.some((item) => item.modelId === model.id && item.installed),
    localPath: installedNames.has(safeName(model.id)) ? path.join(MODEL_DIR, safeName(model.id)) : state.installedModels.find((item) => item.modelId === model.id)?.localPath ?? null,
    tokenAvailable,
  }));
}

async function downloadModel({ modelId, label }) {
  await ensureDataDir();
  const token = await loadToken();
  const model = DEFAULT_MODELS.find((item) => item.id === modelId || item.name === modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);
  if (model.requiresToken && !token) {
    throw new Error('Hugging Face token is required before downloading this model');
  }

  const folder = path.join(MODEL_DIR, safeName(model.id));
  await fs.mkdir(folder, { recursive: true });

  let downloadInfo = null;
  let manifest = {
    id: model.id,
    name: model.name,
    label: label ?? model.name,
    sourceUrl: model.sourceUrl,
    provider: model.provider,
    downloadedAt: Date.now(),
    simulated: false,
    files: [],
  };

  try {
    if (model.requiresToken) {
      const result = await downloadHuggingFaceModel(model.id, token, folder);
      manifest.files = result.filesDownloaded;
      manifest.size = result.totalSize;
      downloadInfo = result;
    } else {
      await fs.writeFile(path.join(folder, 'model.txt'), 'Local model placeholder\n', 'utf8');
      manifest.files = ['model.txt'];
    }
  } catch (error) {
    manifest.error = error instanceof Error ? error.message : String(error);
    console.error(`[${modelId}] Download failed:`, manifest.error);
  }

  await fs.writeFile(path.join(folder, 'README.md'), `# ${model.name}\n\nLocal model installation for Cine AI Studio.\nDownloaded: ${new Date().toISOString()}\n`, 'utf8');
  await fs.writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const state = await loadState();
  const nextInstalled = state.installedModels.filter((item) => item.modelId !== model.id);
  nextInstalled.push({
    modelId: model.id,
    provider: model.provider,
    installed: !manifest.error,
    version: 'latest',
    localPath: folder,
    downloadedAt: Date.now(),
  });
  await saveState({ ...state, installedModels: nextInstalled });

  return {
    ok: !manifest.error,
    modelId: model.id,
    localPath: folder,
    ...downloadInfo,
  };
}

async function setWorkflow(workflow) {
  const state = await loadState();
  await saveState({ ...state, selectedWorkflow: workflow });
  return { ok: true, workflow };
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

async function fetchHuggingFaceAPI(endpoint, token) {
  const headers = { 'Authorization': `Bearer ${token}` };
  const response = await fetch(`https://huggingface.co/api/${endpoint}`, { headers });
  if (!response.ok) throw new Error(`HF API ${response.status}: ${await response.text()}`);
  return response.json();
}

async function validateHuggingFaceToken(token) {
  if (!token) return { valid: false, error: 'No token' };
  try {
    await fetchHuggingFaceAPI('whoami', token);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function getModelInfo(modelId, token) {
  if (!token) throw new Error('Token required for this model');
  try {
    const data = await fetchHuggingFaceAPI(`models/${modelId}`, token);
    return {
      id: modelId,
      name: data.modelId ?? modelId,
      url: data.url ?? `https://huggingface.co/${modelId}`,
      private: data.private ?? false,
      disabled: data.disabled ?? false,
      files: data.siblings?.map((f) => ({ name: f.rfilename, size: f.size })) ?? [],
    };
  } catch (err) {
    throw new Error(`Cannot access model: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function downloadFile(url, targetPath, modelId = '') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  
  const totalSize = parseInt(response.headers.get('content-length') ?? '0', 10);
  let downloadedSize = 0;

  if (modelId) {
    downloadProgress.set(modelId, { status: 'downloading', percent: 0, bytesDownloaded: 0, totalBytes: totalSize });
  }

  const reader = response.body?.getReader?.();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    await fs.writeFile(targetPath, Buffer.from(buffer));
    if (modelId) downloadProgress.set(modelId, { status: 'done', percent: 100, bytesDownloaded: buffer.byteLength, totalBytes: buffer.byteLength });
    return { size: buffer.byteLength, name: path.basename(url) };
  }

  const stream = createWriteStream(targetPath);
  let done = false;
  while (!done) {
    const { done: chunkDone, value: chunk } = await reader.read();
    if (chunk) {
      downloadedSize += chunk.length;
      const percent = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
      if (modelId) downloadProgress.set(modelId, { status: 'downloading', percent, bytesDownloaded: downloadedSize, totalBytes: totalSize });
      if (totalSize > 0) process.stdout.write(`\r[${modelId}] Downloading: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(1)}/${(totalSize / 1024 / 1024).toFixed(1)} MB)`);
      stream.write(chunk);
    }
    done = chunkDone;
  }
  stream.end();
  process.stdout.write('\n');
  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      if (modelId) downloadProgress.set(modelId, { status: 'done', percent: 100, bytesDownloaded: downloadedSize, totalBytes: totalSize });
      resolve({ size: downloadedSize, name: path.basename(url) });
    });
    stream.on('error', (err) => {
      if (modelId) downloadProgress.set(modelId, { status: 'error', percent: 0, bytesDownloaded: downloadedSize, totalBytes: totalSize });
      reject(err);
    });
  });
}

async function downloadHuggingFaceModel(modelId, token, folder) {
  const modelInfo = await getModelInfo(modelId, token);
  const files = modelInfo.files ?? [];
  
  if (files.length === 0) {
    throw new Error(`Model has no files or is private/restricted`);
  }

  const priorityExtensions = ['safetensors', 'bin', 'pt', 'pth', 'gguf', 'onnx'];
  const filesToDownload = files
    .filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return priorityExtensions.includes(ext ?? '');
    })
    .sort((a, b) => {
      const aExt = priorityExtensions.indexOf(a.name.split('.').pop()?.toLowerCase() ?? '');
      const bExt = priorityExtensions.indexOf(b.name.split('.').pop()?.toLowerCase() ?? '');
      return aExt - bExt;
    })
    .slice(0, 3);

  if (filesToDownload.length === 0) {
    throw new Error(`No supported model files found in ${modelId}`);
  }

  const totalSize = filesToDownload.reduce((sum, f) => sum + (f.size ?? 0), 0);
  console.log(`[${modelId}] Starting download: ${filesToDownload.length} files (${(totalSize / 1024 / 1024).toFixed(1)} MB)`);

  for (const file of filesToDownload) {
    const fileUrl = `https://huggingface.co/${modelId}/resolve/main/${file.name}?download=true`;
    const targetPath = path.join(folder, file.name);
    await downloadFile(fileUrl, targetPath, modelId);
  }

  return {
    modelId,
    name: modelInfo.name,
    filesDownloaded: filesToDownload.map((f) => f.name),
    totalSize,
  };
}

async function detectAnimateDiff() {
  try {
    execSync('python -m animatediff --version', { encoding: 'utf8', stdio: 'pipe' });
    return { installed: true, version: 'installed', command: 'python -m animatediff' };
  } catch {
    return { installed: false, version: null, command: null };
  }
}

async function detectOllama() {
  try {
    execSync('ollama --version', { encoding: 'utf8', stdio: 'pipe' });
    return { installed: true, version: 'installed', command: 'ollama' };
  } catch {
    return { installed: false, version: null, command: null };
  }
}

async function detectFfmpeg() {
  try {
    execSync('ffmpeg -version', { encoding: 'utf8', stdio: 'pipe' });
    return { installed: true };
  } catch {
    return { installed: false };
  }
}

async function assembleShots({ outputPaths, outputFile }) {
  const ffmpeg = await detectFfmpeg();
  if (!ffmpeg.installed) {
    throw new Error('ffmpeg not found. Install from https://ffmpeg.org/download.html');
  }
  if (!outputPaths?.length) throw new Error('No shots provided');

  // Resolve local disk paths from /output/ URLs
  const diskPaths = outputPaths.map((p) => {
    if (p.startsWith('http://127.0.0.1')) {
      const rel = new URL(p).pathname.replace(/^\/output\//, '');
      return path.join(MODEL_DIR, decodeURIComponent(rel));
    }
    return p;
  });

  const concatDir = path.join(DATA_DIR, 'assembly');
  await fs.mkdir(concatDir, { recursive: true });
  const listFile = path.join(concatDir, `concat_${Date.now()}.txt`);
  const listContent = diskPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  await fs.writeFile(listFile, listContent, 'utf8');

  const finalOutput = outputFile ?? path.join(concatDir, `final_${Date.now()}.mp4`);

  await new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c', 'copy', '-y', finalOutput,
    ], { stdio: 'pipe' });
    proc.stderr.on('data', (d) => process.stderr.write(d.toString()));
    proc.on('close', (code) => code === 0 ? resolve(finalOutput) : reject(new Error(`ffmpeg exited ${code}`)));
    proc.on('error', reject);
  });

  await fs.unlink(listFile).catch(() => {});
  const rel = path.relative(MODEL_DIR, finalOutput).replace(/\\/g, '/');
  return { ok: true, outputPath: `http://127.0.0.1:${activePort}/output/${rel}`, diskPath: finalOutput };
}

async function detectWorkflows() {
  return {
    animatediff: await detectAnimateDiff(),
    ollama: await detectOllama(),
    ffmpeg: await detectFfmpeg(),
    wan: { installed: false, note: 'Requires API credentials' },
    ltx: { installed: false, note: 'Requires API credentials' },
  };
}

// C9. Renderizador compartido de AnimateDiff (unifica la lógica que antes vivía inline en el handler).
async function renderAnimatediffClip({ prompt, negativePrompt, settings, onStep }) {
  const outputDir = path.join(MODEL_DIR, `output_${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'video.mp4');

  await fs.writeFile(path.join(outputDir, 'metadata.json'), JSON.stringify({
    prompt,
    workflow: 'animatediff',
    generatedAt: new Date().toISOString(),
    settings: settings || {},
  }, null, 2), 'utf8');

  await new Promise((resolve, reject) => {
    const args = [
      '-m', 'animatediff', 'generate',
      '--prompt', prompt,
      '--n_prompt', negativePrompt || 'blurry, low quality',
      '--W', String(settings?.width || 768),
      '--H', String(settings?.height || 432),
      '--steps', String(settings?.steps || 20),
      '--guidance_scale', String(settings?.guidance || 7.5),
      '--seed', String(settings?.seed ?? Math.floor(Math.random() * 999999)),
      '--save_path', outputDir,
    ];
    console.log(`[AnimateDiff] spawn: python ${args.join(' ')}`);
    const proc = spawn('python', args, { stdio: 'pipe' });

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      const stepMatch = text.match(/(\d+)\/(\d+)/);
      if (stepMatch && onStep) {
        onStep(parseInt(stepMatch[1], 10) / parseInt(stepMatch[2], 10), `Paso ${stepMatch[1]}/${stepMatch[2]}...`);
      }
    });

    proc.stderr.on('data', (chunk) => process.stderr.write(chunk.toString()));

    proc.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`AnimateDiff exited with code ${code}`));
    });

    proc.on('error', reject);
  });

  return outputPath;
}

function clipUrl(diskPath) {
  const rel = path.relative(MODEL_DIR, diskPath).replace(/\\/g, '/');
  return `http://127.0.0.1:${activePort}/output/${rel}`;
}

// Acepta ruta absoluta, relativa a MODEL_DIR o URL http://127.0.0.1:PORT/output/...
function resolveClipDiskPath(value) {
  if (!value) return null;
  if (value.startsWith('http://127.0.0.1') || value.startsWith('http://localhost')) {
    const rel = new URL(value).pathname.replace(/^\/output\//, '');
    return path.join(MODEL_DIR, decodeURIComponent(rel));
  }
  if (path.isAbsolute(value)) return value;
  return path.join(MODEL_DIR, value);
}

// F8/F10/F13/F16 + bucle de reintentos (maxAttempts configurable, salida segura ante fallo del juez).
async function runGenerationPipeline({ workflow, prompt, negativePrompt, settings, qa, model }) {
  const useQa = Boolean(qa?.enabled);
  const maxAttempts = useQa ? Math.max(1, Math.min(Number(qa.maxAttempts) || 3, 5)) : 1;
  const isCloudVideo = workflow === 'veo' || workflow === 'omni-flash';

  generationProgress = {
    active: true,
    workflow,
    prompt,
    status: 'starting',
    percent: 0,
    startedAt: Date.now(),
    message: 'Iniciando generación...',
    outputPath: null,
    attempt: 0,
    maxAttempts,
    qaStatus: useQa ? 'pending' : 'disabled',
    qaCriticism: '',
  };

  try {
    if (workflow !== 'animatediff' && !isCloudVideo) {
      throw new Error(`Workflow ${workflow} not implemented`);
    }
    if (!isCloudVideo) {
      const detected = await detectAnimateDiff();
      if (!detected.installed) throw new Error('AnimateDiff not installed');
    }

    // C3: la key de Gemini se carga si hay QA o si el motor cloud la necesita.
    const apiKey = (useQa || isCloudVideo) ? await loadGeminiKey() : null;

    const negativeTerms = new Set(splitPromptTerms(negativePrompt || settings?.negativePrompt || 'blurry, low quality'));
    for (const term of QA_BASE_NEGATIVES) negativeTerms.add(term);

    const refinements = [];
    let currentPrompt = prompt;
    let attempts = 0;
    let qaApproved = null; // F8 tri-estado: true | false | null (sin auditar/omitido)
    let lastCriticism = 'Ninguno';
    let finalDiskPath = null;

    while (attempts < maxAttempts && qaApproved !== true) {
      attempts++;

      // El render ocupa el rango 10–80% repartido entre los intentos.
      const renderBase = 10 + Math.round(((attempts - 1) / maxAttempts) * 70);
      const renderEnd = 10 + Math.round((attempts / maxAttempts) * 70);
      const span = Math.max(renderEnd - renderBase, 5);

      generationProgress = {
        ...generationProgress,
        attempt: attempts,
        status: 'generating',
        percent: renderBase,
        message: `Renderizando intento ${attempts}/${maxAttempts}...`,
      };

      try {
        if (isCloudVideo) {
          const result = await renderWithVeo(apiKey, {
            model: model || 'veo-3.1-generate-preview',
            prompt: currentPrompt,
            negativePrompt: [...negativeTerms].join(', '),
            onProgress: (pct, message) => {
              generationProgress = {
                ...generationProgress,
                percent: Math.min(renderBase + Math.round((pct / 100) * span), renderEnd),
                message: `Intento ${attempts}/${maxAttempts} · ${message}`,
              };
            },
          });
          finalDiskPath = result.diskPath;
        } else {
          finalDiskPath = await renderAnimatediffClip({
            prompt: currentPrompt,
            negativePrompt: [...negativeTerms].join(', '),
            settings,
            onStep: (fraction, message) => {
              generationProgress = {
                ...generationProgress,
                percent: Math.min(renderBase + Math.round(fraction * span), renderEnd),
                message: `Intento ${attempts}/${maxAttempts} · ${message}`,
              };
            },
          });
        }
      } catch (error) {
        // M5: distinguir fallo de render (reintenta) de fallo de QA (degrada).
        const msg = error instanceof Error ? error.message : String(error);
        lastCriticism = `Fallo de render en intento ${attempts}: ${msg}`;
        console.error(`[PIPELINE] ${lastCriticism}`);
        if (attempts >= maxAttempts) throw new Error(lastCriticism);
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }

      if (!useQa) break; // QA deshabilitado: un solo pase.

      generationProgress = {
        ...generationProgress,
        status: 'auditing',
        percent: Math.min(renderEnd + 5, 92),
        message: `Auditando consistencia visual (intento ${attempts}/${maxAttempts})...`,
        qaStatus: 'pending',
      };

      try {
        const audit = await geminiVisualQA(apiKey, finalDiskPath, prompt, qa);

        if (audit === null) {
          // C8: bloqueo de seguridad → omitir sin falso rechazo.
          qaApproved = null;
          lastCriticism = 'QA omitido: respuesta bloqueada por políticas de seguridad del juez.';
          generationProgress = { ...generationProgress, qaStatus: 'skipped', qaCriticism: lastCriticism };
          break;
        }

        if (audit.approved) {
          qaApproved = true;
          lastCriticism = 'Aprobado por el Control de Calidad Visual.';
          generationProgress = { ...generationProgress, qaStatus: 'approved', qaCriticism: lastCriticism };
          break;
        }

        qaApproved = false;
        lastCriticism = audit.criticism;
        generationProgress = { ...generationProgress, qaStatus: 'rejected', qaCriticism: lastCriticism };
        console.warn(`[PIPELINE] Intento ${attempts} rechazado: ${audit.criticism}`);

        // M5: no fusionar si ya no quedan intentos.
        if (attempts < maxAttempts) {
          if (audit.suggestedPromptRefinement) refinements.push(audit.suggestedPromptRefinement);
          for (const term of audit.suggestedNegativeTerms) negativeTerms.add(term.toLowerCase());
          currentPrompt = composePrompt(prompt, refinements);
        }
      } catch (error) {
        // Salida segura (idea original del usuario): conservar el último render y degradar a skipped.
        const msg = error instanceof Error ? error.message : String(error);
        qaApproved = null;
        lastCriticism = `QA interrumpido: ${msg}`;
        generationProgress = { ...generationProgress, qaStatus: 'skipped', qaCriticism: lastCriticism };
        console.error('[PIPELINE] Error en el subagente de QA:', msg);
        break;
      }
    }

    if (!finalDiskPath) throw new Error(lastCriticism || 'La generación no produjo ningún clip');

    // F16: trazabilidad junto al clip.
    await fs.writeFile(path.join(path.dirname(finalDiskPath), 'qa.json'), JSON.stringify({
      promptOriginal: prompt,
      promptFinalUtilizado: currentPrompt,
      negativePromptFinal: [...negativeTerms].join(', '),
      intentosTotales: attempts,
      estadoAprobacion: qaApproved, // true | false | null (sin auditar/omitido)
      criticaFinal: lastCriticism,
      juez: useQa ? { proveedor: 'gemini', modelo: qa.model || 'gemini-3.8-flash' } : null,
      timestamp: new Date().toISOString(),
    }, null, 2), 'utf8');

    generationProgress = {
      ...generationProgress,
      active: false,
      status: 'completed',
      percent: 100,
      message: qaApproved === true
        ? 'Video aprobado por Control de Calidad Visual'
        : qaApproved === false
          ? `Video conservado con observaciones tras ${attempts} intento(s): ${lastCriticism}`
          : 'Video generado (sin auditoría)',
      outputPath: clipUrl(finalDiskPath),
      qaCriticism: lastCriticism,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    generationProgress = {
      ...generationProgress,
      active: false,
      status: 'error',
      percent: 0,
      message: msg,
      qaCriticism: generationProgress.qaCriticism || msg,
    };
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const input = args[0] ? JSON.parse(args[0]) : {};

  switch (command) {
    case 'list-models':
      return console.log(JSON.stringify(await listModels(), null, 2));
    case 'download-model':
      return console.log(JSON.stringify(await downloadModel(input), null, 2));
    case 'save-token':
      return console.log(JSON.stringify(await saveToken(input.token ?? ''), null, 2));
    case 'load-token':
      return console.log(JSON.stringify({ token: await loadToken() }, null, 2));
    case 'set-workflow':
      return console.log(JSON.stringify(await setWorkflow(input.workflow ?? 'animatediff'), null, 2));
    case 'state':
      return console.log(JSON.stringify(await loadState(), null, 2));
    case 'validate-token':
      return console.log(JSON.stringify(await validateHuggingFaceToken(input.token ?? await loadToken()), null, 2));
    case 'model-info':
      return console.log(JSON.stringify(await getModelInfo(input.modelId ?? '', input.token ?? await loadToken()), null, 2));
    case 'serve':
      return serve();
    case 'save-gemini-key':
      return console.log(JSON.stringify(await saveGeminiKey(input.key ?? ''), null, 2));
    case 'qa-visual': {
      // Smoke test del juez: node helper/video-helper.mjs qa-visual '{"videoPath":"C:/.../video.mp4","prompt":"..."}'
      const apiKey = await loadGeminiKey();
      const audit = await geminiVisualQA(apiKey, input.videoPath ?? '', input.prompt ?? '', input);
      return console.log(JSON.stringify({ skipped: audit === null, ...(audit ?? { approved: null, criticism: 'QA no disponible' }) }, null, 2));
    }
    default:
      console.error('Usage: node helper/video-helper.mjs <list-models|download-model|save-token|load-token|set-workflow|state|validate-token|model-info|save-gemini-key|qa-visual|serve> [json]');
      process.exitCode = 1;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function serve() {
  const envPort = Number(process.env.CINEAI_VIDEO_HELPER_PORT ?? '');
  const cliPort = Number(process.argv[3] ?? '');
  const port = Number.isFinite(envPort) && envPort > 0
    ? envPort
    : Number.isFinite(cliPort) && cliPort > 0
      ? cliPort
      : 8787;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
      }

      if (req.method === 'GET' && url.pathname === '/health') {
        sendJson(res, 200, { ok: true, service: 'cineai-video-helper', port });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/state') {
        sendJson(res, 200, await loadState());
        return;
      }

      if (req.method === 'GET' && url.pathname === '/models') {
        sendJson(res, 200, await listModels());
        return;
      }

      if (req.method === 'GET' && url.pathname === '/token') {
        sendJson(res, 200, { token: await loadToken() });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/token') {
        const body = await readRequestBody(req);
        sendJson(res, 200, await saveToken(body.token ?? ''));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/workflow') {
        const body = await readRequestBody(req);
        sendJson(res, 200, await setWorkflow(body.workflow ?? 'animatediff'));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/download') {
        const body = await readRequestBody(req);
        sendJson(res, 200, await downloadModel(body));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/validate-token') {
        const token = await loadToken();
        sendJson(res, 200, await validateHuggingFaceToken(token));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/model-info') {
        const body = await readRequestBody(req);
        const token = await loadToken();
        try {
          sendJson(res, 200, await getModelInfo(body.modelId ?? '', token));
        } catch (error) {
          sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === 'GET' && url.pathname === '/workflows/detect') {
        sendJson(res, 200, await detectWorkflows());
        return;
      }

      if (req.method === 'POST' && url.pathname === '/workflows/assemble') {
        const body = await readRequestBody(req);
        try {
          const result = await assembleShots(body);
          sendJson(res, 200, result);
        } catch (error) {
          sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      if (req.method === 'GET' && url.pathname === '/workflows/progress') {
        sendJson(res, 200, generationProgress);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/workflows/generate') {
        const body = await readRequestBody(req);
        const { workflow, prompt, negativePrompt, settings, qa, model } = body;

        if (!workflow || !prompt) {
          sendJson(res, 400, { ok: false, error: 'Missing workflow or prompt' });
          return;
        }

        if (generationProgress.active) {
          sendJson(res, 409, { ok: false, error: 'Generation already in progress' });
          return;
        }

        // F13: el pipeline completo (render + QA loop) corre aquí y publica su estado
        // en generationProgress, observable vía GET /workflows/progress.
        void runGenerationPipeline({ workflow, prompt, negativePrompt, settings, qa, model });

        sendJson(res, 202, { ok: true, message: 'Generation started', progressUrl: '/workflows/progress' });
        return;
      }

      // Re-auditar un clip ya generado con el juez de QA visual (sin regenerar).
      if (req.method === 'POST' && url.pathname === '/qa/analyze') {
        const body = await readRequestBody(req);
        try {
          const diskPath = resolveClipDiskPath(body.videoPath ?? '');
          if (!diskPath) throw new Error('videoPath requerido (ruta de disco, relativa a .cineai/video-models, o URL /output/)');
          const apiKey = await loadGeminiKey();
          const audit = await geminiVisualQA(apiKey, diskPath, body.prompt ?? '', body);
          sendJson(res, 200, { ok: true, skipped: audit === null, ...(audit ?? { approved: null, criticism: 'QA no disponible' }) });
        } catch (error) {
          sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      // Generar imagen de personaje (rol characterRender: Nano Banana operativo;
      // GLM-Image y GPT-Image quedan como 501 pendientes de verificación de endpoint).
      if (req.method === 'POST' && url.pathname === '/images/generate') {
        const body = await readRequestBody(req);
        try {
          const provider = body.provider ?? 'nano-banana';
          if (provider === 'nano-banana' || provider === 'gemini') {
            const apiKey = await loadGeminiKey();
            const result = await generateCharacterImageGemini(apiKey, { model: body.model, prompt: body.prompt ?? '' });
            const rel = path.relative(MODEL_DIR, result.diskPath).replace(/\\/g, '/');
            sendJson(res, 200, { ok: true, imageUrl: `http://127.0.0.1:${activePort}/output/${rel}`, diskPath: result.diskPath });
          } else {
            sendJson(res, 501, { ok: false, error: `Motor de imagen '${provider}' pendiente de implementación (solo Nano Banana operativo).` });
          }
        } catch (error) {
          sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
        return;
      }

      // Serve generated video files
      if (req.method === 'GET' && url.pathname.startsWith('/output/')) {
        const relPath = decodeURIComponent(url.pathname.slice('/output/'.length));
        const filePath = path.resolve(MODEL_DIR, relPath);
        // Security: must stay within MODEL_DIR
        if (!filePath.startsWith(path.resolve(MODEL_DIR))) {
          sendJson(res, 403, { ok: false, error: 'Forbidden' });
          return;
        }
        try {
          const stat = await fs.stat(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const mime = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : 'application/octet-stream';
          res.writeHead(200, {
            'Content-Type': mime,
            'Content-Length': stat.size,
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes',
          });
          const { createReadStream } = await import('node:fs');
          createReadStream(filePath).pipe(res);
        } catch {
          sendJson(res, 404, { ok: false, error: 'File not found' });
        }
        return;
      }

      // Download progress per model
      if (req.method === 'GET' && url.pathname.startsWith('/download/progress/')) {
        const modelId = decodeURIComponent(url.pathname.slice('/download/progress/'.length));
        const prog = downloadProgress.get(modelId) ?? { status: 'idle', percent: 0, bytesDownloaded: 0, totalBytes: 0 };
        sendJson(res, 200, { modelId, ...prog });
        return;
      }

      // All download progress
      if (req.method === 'GET' && url.pathname === '/download/progress') {
        const all = {};
        for (const [k, v] of downloadProgress.entries()) all[k] = v;
        sendJson(res, 200, all);
        return;
      }

      sendJson(res, 404, { ok: false, error: 'Not found' });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  const startServer = (listenPort) => {
    server.listen(listenPort, '127.0.0.1', () => {
      activePort = listenPort;
      console.log(JSON.stringify({ ok: true, service: 'cineai-video-helper', port: listenPort }, null, 2));
    });
  };

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE' && port < 8899) {
      const nextPort = port + 1;
      console.log(JSON.stringify({ ok: false, warning: `Port ${port} busy, retrying on ${nextPort}` }, null, 2));
      startServer(nextPort);
      return;
    }
    throw error;
  });

  startServer(port);
}

await main();