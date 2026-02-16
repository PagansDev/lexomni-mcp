export type Chunk = {
  chunkIndex: number;
  text: string;
  lineStart?: number;
  lineEnd?: number;
};

export function chunkMarkdownByLines(
  text: string,
  linesPerChunk = 200,
): Chunk[] {
  const lines = text.split(/\r?\n/);
  const chunks: Chunk[] = [];
  let idx = 0;
  for (let i = 0; i < lines.length; i += linesPerChunk) {
    const slice = lines.slice(i, i + linesPerChunk);
    chunks.push({
      chunkIndex: idx++,
      text: slice.join('\n'),
      lineStart: i + 1,
      lineEnd: Math.min(i + linesPerChunk, lines.length),
    });
  }
  return chunks;
}

export function chunkTextByChars(text: string, charsPerChunk = 6000): Chunk[] {
  const chunks: Chunk[] = [];
  let idx = 0;
  for (let i = 0; i < text.length; i += charsPerChunk) {
    chunks.push({
      chunkIndex: idx++,
      text: text.slice(i, i + charsPerChunk),
    });
  }
  return chunks;
}
