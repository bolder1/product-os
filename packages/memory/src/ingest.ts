/**
 * Product Memory — ingest
 * Accepts a raw file buffer + kind, returns ordered chunks ready for embedding.
 * Chunking strategy: ~800-token windows with 80-token overlap (approx char lengths).
 */

export type IngestKind = 'pdf' | 'docx' | 'md' | 'txt' | 'image' | 'other'

export interface IngestChunk {
  ordinal: number
  text: string
  tokenCount: number
  sourcePage?: number
}

const CHUNK_CHARS = 3200 // ~800 tokens
const OVERLAP_CHARS = 320 // ~80 tokens

async function extractText(buf: Buffer, kind: IngestKind, filename: string): Promise<{ text: string; pageMap?: number[] }> {
  if (kind === 'pdf') {
    try {
      const pdfParse = ((await import('pdf-parse')) as unknown as { default: (b: Buffer) => Promise<{ text: string; numpages: number }> }).default
      const res = await pdfParse(buf)
      return { text: res.text }
    } catch (e) {
      console.warn('[memory] pdf-parse failed for', filename, e)
      return { text: buf.toString('utf8') }
    }
  }
  if (kind === 'docx') {
    try {
      const mammoth = await import('mammoth')
      const res = await mammoth.extractRawText({ buffer: buf })
      return { text: res.value }
    } catch (e) {
      console.warn('[memory] mammoth failed for', filename, e)
      return { text: '' }
    }
  }
  if (kind === 'md' || kind === 'txt') {
    return { text: buf.toString('utf8') }
  }
  return { text: '' } // images / other — no text extraction yet
}

function chunkText(raw: string): IngestChunk[] {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return []
  const chunks: IngestChunk[] = []
  let ordinal = 0
  for (let i = 0; i < text.length; i += CHUNK_CHARS - OVERLAP_CHARS) {
    const slice = text.slice(i, i + CHUNK_CHARS)
    if (!slice.trim()) continue
    chunks.push({
      ordinal: ordinal++,
      text: slice,
      tokenCount: Math.ceil(slice.length / 4),
    })
    if (i + CHUNK_CHARS >= text.length) break
  }
  return chunks
}

export async function ingestFile(args: {
  buffer: Buffer
  kind: IngestKind
  filename: string
}): Promise<IngestChunk[]> {
  const { text } = await extractText(args.buffer, args.kind, args.filename)
  return chunkText(text)
}
