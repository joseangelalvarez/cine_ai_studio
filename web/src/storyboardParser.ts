export interface ParsedShot {
  index: number;
  title: string;
  description: string;
  duration?: string;
  camera?: string;
}

const SHOT_HEADING = /^(?:toma|shot|escena|scene|plano|take)\s*[#\-]?\s*(\d+)[:\.\s]/i;
const NUMBERED_ITEM = /^(\d+)[.\)]\s+(.+)/;

export function parseStoryboardShots(content: string): ParsedShot[] {
  if (!content || content.trim().length < 20) return [];

  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const shots: ParsedShot[] = [];
  let current: ParsedShot | null = null;

  const flush = () => {
    if (current && current.description.trim()) shots.push(current);
  };

  for (const line of lines) {
    const shotMatch = SHOT_HEADING.exec(line);
    const numMatch = NUMBERED_ITEM.exec(line);
    const isMdHeading = /^#{1,3}\s+/.test(line);

    if (shotMatch || (isMdHeading && /toma|shot|escena|plano/i.test(line))) {
      flush();
      const num = shotMatch ? parseInt(shotMatch[1], 10) : shots.length + 1;
      const rest = shotMatch ? line.slice(shotMatch[0].length).trim() : line.replace(/^#+\s*/, '');
      current = { index: num, title: rest || `Toma ${num}`, description: '' };
      continue;
    }

    if (numMatch && !current) {
      flush();
      const num = parseInt(numMatch[1], 10);
      const rest = numMatch[2].trim();
      current = { index: num, title: rest, description: '' };
      continue;
    }

    if (current) {
      const lower = line.toLowerCase();
      if (lower.startsWith('duración:') || lower.startsWith('duration:')) {
        current.duration = line.split(':').slice(1).join(':').trim();
      } else if (lower.startsWith('cámara:') || lower.startsWith('camera:')) {
        current.camera = line.split(':').slice(1).join(':').trim();
      } else {
        current.description += (current.description ? ' ' : '') + line;
      }
    }
  }

  flush();

  // If we couldn't detect structured shots, chop into paragraphs of ~2 sentences each
  if (shots.length === 0) {
    const sentences = content.match(/[^.!?]+[.!?]+/g) ?? [];
    const chunkSize = 2;
    for (let i = 0; i < sentences.length && shots.length < 10; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join(' ').trim();
      if (chunk.length > 15) {
        shots.push({ index: shots.length + 1, title: `Toma ${shots.length + 1}`, description: chunk });
      }
    }
  }

  return shots.slice(0, 20);
}
