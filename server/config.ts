import fs from 'fs';
import path from 'path';

export interface ProviderAvailability {
  google: boolean;
  openai: boolean;
  anthropic: boolean;
}

export interface CineAiConfig {
  llm: {
    premium: { provider: string; model: string };
    standard: { provider: string; model: string };
    economic: { provider: string; model: string };
    agentOverrides?: Record<string, { provider: string; model: string }>;
  };
  image: {
    characters: { provider: string; model: string };
    backgrounds: { provider: string; model: string };
    storyboard?: { provider: string; model: string; enabled?: boolean };
  };
  music: {
    provider: string;
    model: string;
  };
  audio: {
    provider: string;
    model: string;
    voice?: string;
  };
  video: {
    primary: { provider: string; model: string; maxShots?: number };
    exportCompiler: {
      engine: string;
      aspectRatio: string;
      motionStrength: string;
      multiShotSupported?: boolean;
    };
  };
}

const DEFAULT_CONFIG: CineAiConfig = {
  llm: {
    premium: { provider: 'google', model: 'gemini-3.1-pro-preview' },
    standard: { provider: 'google', model: 'gemini-3.8-flash' },
    economic: { provider: 'google', model: 'gemini-3.8-flash' },
    agentOverrides: {
      SHOWRUNNER: { provider: 'google', model: 'gemini-3.8-flash' },
      GUIONISTA: { provider: 'google', model: 'gemini-3.8-flash' },
      DIRECTOR_ARTE: { provider: 'google', model: 'gemini-3.8-flash' },
    },
  },
  image: {
    characters: { provider: 'google', model: 'imagen-3.0-generate-002' },
    backgrounds: { provider: 'google', model: 'imagen-3.0-generate-002' },
    storyboard: { provider: 'google', model: 'imagen-3.0-generate-002', enabled: true },
  },
  music: {
    provider: 'google',
    model: 'lyria-3-clip-preview',
  },
  audio: {
    provider: 'google',
    model: 'gemini-3.8-flash-lite-tts',
    voice: 'Aoede',
  },
  video: {
    primary: { provider: 'google', model: 'veo-3.1-generate-preview', maxShots: 2 },
    exportCompiler: {
      engine: 'seedance-2.0',
      aspectRatio: '2.39:1',
      motionStrength: 'cinematic',
      multiShotSupported: true,
    },
  },
};

export class ConfigManager {
  private static configPath = path.resolve(process.cwd(), 'cineai.config.json');

  public static loadConfig(): CineAiConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[ConfigManager] Error reading cineai.config.json, using defaults:', err);
    }
    return DEFAULT_CONFIG;
  }

  public static getAvailability(): ProviderAvailability {
    return {
      google: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
      openai: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0),
    };
  }

  public static resolveModelForAgent(subagentKey: string, tier: 'premium' | 'standard' | 'economic' = 'standard'): { provider: string; model: string } {
    const config = this.loadConfig();
    if (config.llm.agentOverrides && config.llm.agentOverrides[subagentKey]) {
      return config.llm.agentOverrides[subagentKey];
    }
    return config.llm[tier] || config.llm.standard;
  }
}
