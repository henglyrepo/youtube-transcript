export interface TranscriptSegment {
  text: string;
  start?: number;
  offset?: number;
  duration: number;
}

export function formatAsJson(transcript: TranscriptSegment[]): string {
  return JSON.stringify(transcript, null, 2);
}

export function formatAsPlainText(transcript: TranscriptSegment[]): string {
  return transcript.map((segment) => segment.text).join('\n');
}

export function formatAsSrt(transcript: TranscriptSegment[]): string {
  return transcript.map((segment, index) => {
    const startTime = segment.start ?? segment.offset ?? 0;
    const end = formatSrtTime(startTime + segment.duration);
    const start = formatSrtTime(startTime);
    return `${index + 1}
${start} --> ${end}
${segment.text}
`;
  }).join('\n');
}

export function formatAsVtt(transcript: TranscriptSegment[]): string {
  const segments = transcript.map((segment) => {
    const startTime = segment.start ?? segment.offset ?? 0;
    const start = formatVttTime(startTime);
    const end = formatVttTime(startTime + segment.duration);
    return `${start} --> ${end}\n${segment.text}\n`;
  }).join('\n');
  return `WEBVTT\n\n${segments}`;
}

export function formatAsHtml(transcript: TranscriptSegment[]): string {
  const segments = transcript.map((segment) => {
    const startTime = segment.start ?? segment.offset ?? 0;
    const minutes = Math.floor(startTime / 60);
    const seconds = Math.floor(startTime % 60);
    const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `<p><span class="timestamp">${timestamp}</span> ${escapeHtml(segment.text)}</p>`;
  }).join('\n');
  
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
    .timestamp { color: #666; font-size: 0.9em; }
    p { margin: 8px 0; }
  </style>
</head>
<body>
${segments}
</body>
</html>`;
}

function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVttTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getFileExtension(format: string): string {
  const extensions: Record<string, string> = {
    json: 'json',
    text: 'txt',
    srt: 'srt',
    vtt: 'vtt',
    html: 'html',
  };
  return extensions[format] || 'txt';
}

export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    json: 'application/json',
    text: 'text/plain',
    srt: 'application/x-subrip',
    vtt: 'text/vtt',
    html: 'text/html',
  };
  return mimeTypes[format] || 'text/plain';
}
