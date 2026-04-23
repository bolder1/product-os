/**
 * Product Memory — embedding provider
 * Uses OpenAI text-embedding-3-small (1536 dims) when OPENAI_API_KEY is set.
 * Falls back to a deterministic mock embedding in dev so the pipeline never
 * breaks without creds. The mock is NOT semantically useful — only for wiring.
 */

const DIMS = 1536

function hashToFloat(s: string, seed: number): number {
  let h = seed
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 2000) / 1000 - 1
}

function mockEmbed(text: string): number[] {
  const out = new Array<number>(DIMS)
  for (let i = 0; i < DIMS; i++) out[i] = hashToFloat(text, i + 1) * 0.1
  return out
}

async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY not set')
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  })
  if (!res.ok) throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { data: Array<{ embedding: number[] }> }
  return json.data.map((d) => d.embedding)
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []
  if (process.env.OPENAI_API_KEY) {
    try {
      return await openaiEmbed(texts)
    } catch (e) {
      console.warn('[memory/embed] OpenAI failed, falling back to mock:', e)
    }
  }
  return texts.map(mockEmbed)
}

export const EMBEDDING_DIMS = DIMS
