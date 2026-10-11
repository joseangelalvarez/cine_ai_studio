import { LlmService } from './llm';

export interface CompiledPromptPackage {
  title: string;
  projectId: number;
  imagePrompt: string;
  seedanceVideoPrompt: string;
  veoVideoPrompt: string;
  audioPrompt: string;
  musicPrompt: string;
  characterTokens: string[];
  cameraSpecs: {
    lens: string;
    aspectRatio: string;
    motion: string;
    fps: string;
  };
}

export class PromptCompiler {
  public static cleanDirectives(content?: string, maxLength = 280): string {
    if (!content) return '';
    let text = content
      .replace(/\[\s*(?:PERSONAJE|ENTORNO|FONDO|ARTE|COLOR|FOTOGRAF[IÍ]A|C[AÁ]MARA|ENTREGABLE)[^\]]*\]\s*:?/gi, ' ')
      .replace(/\*{0,2}(?:ROL|PROYECTO|DEPARTAMENTO|ENTREGABLE|FORMATO|SISTEMA)\*{0,2}\s*:[^\n*•|—–-]+/gi, ' ')
      .replace(/^[=\-_*#]{2,}.*$/gm, ' ')
      .trim();

    if (text.length > maxLength) {
      const slice = text.substring(0, maxLength);
      const lastPeriod = slice.lastIndexOf('.');
      if (lastPeriod > maxLength * 0.5) return slice.substring(0, lastPeriod + 1).trim();
      return slice.trim() + '...';
    }
    return text;
  }

  public static async compileFullPackage(params: {
    projectId: number;
    title: string;
    genre?: string;
    artStyle?: string;
    synopsis?: string;
    memories: Array<{ key: string; title: string; content: string }>;
  }): Promise<CompiledPromptPackage> {
    const { projectId, title, genre = 'Drama', artStyle = 'Cinematográfico Ultra-Realista', synopsis = '', memories } = params;

    const charMem = memories.find((m) => m.key === 'CHARACTER_DESIGNER')?.content || '';
    const envMem = memories.find((m) => m.key === 'PRODUCTION_DESIGNER')?.content || '';
    const artMem = memories.find((m) => m.key === 'DIRECTOR_ARTE')?.content || '';
    const dopMem = memories.find((m) => m.key === 'DOP')?.content || '';
    const scriptMem = memories.find((m) => m.key === 'GUIONISTA')?.content || '';
    const soundMem = memories.find((m) => m.key === 'SOUND_DESIGNER')?.content || '';
    const musicMem = memories.find((m) => m.key === 'COMPOSER')?.content || '';

    const cleanChar = this.cleanDirectives(charMem, 320);
    const cleanEnv = this.cleanDirectives(envMem, 320);
    const cleanArt = this.cleanDirectives(artMem, 240);
    const cleanDop = this.cleanDirectives(dopMem, 240);
    const cleanScript = this.cleanDirectives(scriptMem, 320);
    const cleanSound = this.cleanDirectives(soundMem, 240);
    const cleanMusic = this.cleanDirectives(musicMem, 240);

    // Baseline deterministic prompts
    const imagePrompt = `Retrato cinematográfico fotorrealista para "${title}". Sujeto: ${cleanChar || 'Protagonista de la historia con vestuario de producción detallado'}. Entorno y fondo: ${cleanEnv || 'Escenario principal cinematográfico con bokeh suave'}. Estilo e iluminación: ${cleanArt || artStyle}. Óptica: ${cleanDop || 'Lente anamórfica 85mm T1.4, iluminación volumétrica, 8k movie still'}.`;

    // ByteDance Seedance 2.0 specialized prompt format: multi-shot continuity, camera syntax, 2.39:1 anamorphic ratio
    const seedanceVideoPrompt = `[ByteDance Seedance 2.0 Cinematic Script]
Shot 1 (Establishing / 4s): Wide cinematic angle 2.39:1. [Camera: Slow Forward Dolly with 180-degree shutter, 24fps]. ${cleanEnv || synopsis}. Volumetric lighting beams, high-detail texture fidelity.
Shot 2 (Character Motion / 4s): Medium close-up on character. [Camera: Subtle Steadicam Orbit]. ${cleanChar || 'Lead character expressing intense emotional resolve'}. Natural physical dynamics of clothing and hair, photorealistic skin shaders.
Style & Lighting: ${cleanArt || artStyle}. Master grading ACEScc Rec.709. Continuity token: #${title.replace(/\s+/g, '_')}_01.`;

    // Google Veo prompt format
    const veoVideoPrompt = `Cinematic 24fps camera motion for "${title}". Smooth anamorphic tracking shot through ${cleanEnv || 'the cinematic architecture'}. ${cleanChar ? `Featuring ${cleanChar}.` : ''} High-contrast volumetric lighting, 2.39:1 widescreen scope, photorealistic motion physics.`;

    const audioPrompt = `Foley diegético inmersivo y texturas de sala para "${title}". ${cleanSound || 'Pasos sobre suelo texturizado, fricción de telas, resonancia natural de espacio acústico'}. Alta fidelidad 48kHz sin distorsión.`;

    const musicPrompt = `Banda sonora cinematográfica para "${title}". ${cleanMusic || 'Leitmotif orquestal con violonchelo solista y sintetizadores analógicos cálidos a 72 BPM'}.`;

    return {
      title,
      projectId,
      imagePrompt,
      seedanceVideoPrompt,
      veoVideoPrompt,
      audioPrompt,
      musicPrompt,
      characterTokens: cleanChar ? ['#Protagonist', '#KeyCostume', '#Anamorphic85mm'] : ['#Protagonist'],
      cameraSpecs: {
        lens: cleanDop || '85mm Anamorphic T1.4',
        aspectRatio: '2.39:1',
        motion: 'Slow Forward Dolly & Steadicam Orbit',
        fps: '24.00 fps',
      },
    };
  }
}
