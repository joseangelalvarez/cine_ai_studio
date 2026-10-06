import { execSync, spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const MODEL_DIR = path.join(os.homedir(), '.cineai', 'video-models');

async function detectAnimateDiff() {
  try {
    const result = execSync('python -m animatediff --version', { encoding: 'utf8', stdio: 'pipe' });
    return { installed: true, version: result.trim(), command: 'python -m animatediff' };
  } catch {
    return { installed: false, version: null, command: null };
  }
}

async function detectOllama() {
  try {
    const result = execSync('ollama --version', { encoding: 'utf8', stdio: 'pipe' });
    return { installed: true, version: result.trim(), command: 'ollama' };
  } catch {
    return { installed: false, version: null, command: null };
  }
}

async function detectWanAPI() {
  return {
    installed: false,
    version: null,
    note: 'Wan API requires credentials in environment or .env',
  };
}

async function detectLTXAPI() {
  return {
    installed: false,
    version: null,
    note: 'LTX API requires credentials in environment or .env',
  };
}

export async function detectWorkflows() {
  return {
    animatediff: await detectAnimateDiff(),
    ollama: await detectOllama(),
    wan: await detectWanAPI(),
    ltx: await detectLTXAPI(),
  };
}

async function generateWithAnimateDiff({ prompt, negativePrompt, width, height, steps, guidance, seed }) {
  const detected = await detectAnimateDiff();
  if (!detected.installed) {
    throw new Error('AnimateDiff is not installed. Install with: pip install animatediff-cli');
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-m', 'animatediff', 'generate',
      '--prompt', prompt,
      '--negative_prompt', negativePrompt || '',
      '--width', String(width || 768),
      '--height', String(height || 432),
      '--steps', String(steps || 20),
      '--guidance_scale', String(guidance || 7.5),
      '--seed', String(seed || Math.floor(Math.random() * 1000000)),
      '--output', path.join(MODEL_DIR, `output_${Date.now()}.mp4`),
    ];

    const proc = spawn('python', args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        const outputMatch = stdout.match(/saved to: (.+)/i);
        const outputPath = outputMatch ? outputMatch[1].trim() : null;
        resolve({ success: true, outputPath, stdout });
      } else {
        reject(new Error(`AnimateDiff process exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', reject);
  });
}

export async function generateVideo({ workflow, settings, prompt, negativePrompt }) {
  if (workflow === 'animatediff') {
    return generateWithAnimateDiff({
      prompt,
      negativePrompt,
      width: settings?.width || 768,
      height: settings?.height || 432,
      steps: settings?.steps || 20,
      guidance: settings?.guidance || 7.5,
      seed: settings?.seed,
    });
  }

  if (workflow === 'wan') {
    throw new Error('Wan API integration requires API credentials');
  }

  if (workflow === 'ltx') {
    throw new Error('LTX API integration requires API credentials');
  }

  throw new Error(`Unknown workflow: ${workflow}`);
}
