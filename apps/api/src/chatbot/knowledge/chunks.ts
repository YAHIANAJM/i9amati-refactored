// BM25-style document chunking and search for RAG retrieval

import { DocumentSource, ALL_DOCUMENTS } from './documents'

export interface Chunk {
  text: string
  source: string
  sourceTitle: string
  index: number
}

interface TermFrequency {
  [term: string]: number
}

interface ChunkIndex {
  chunk: Chunk
  tf: TermFrequency
  length: number
}

// ─── Chunking ─────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
}

export function chunkDocument(doc: DocumentSource, chunkSize = 800, overlap = 150): Chunk[] {
  const chunks: Chunk[] = []
  const text = doc.content.trim()
  let start = 0
  let index = 0

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)

    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
      const breakPoint = Math.max(lastPeriod, lastNewline)
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1
      }
    }

    chunks.push({
      text: text.slice(start, end).trim(),
      source: doc.id,
      sourceTitle: doc.title,
      index: index++,
    })

    if (end >= text.length) break
    start = end - overlap
  }

  return chunks
}

// ─── BM25 Index ───────────────────────────────────────────

function computeTF(tokens: string[]): TermFrequency {
  const tf: TermFrequency = {}
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1
  }
  return tf
}

export class BM25Index {
  private index: ChunkIndex[] = []
  private idf: Record<string, number> = {}
  private avgDL = 0
  private k1 = 1.5
  private b = 0.75

  constructor() {
    this.buildIndex()
  }

  private buildIndex() {
    const allChunks: Chunk[] = []
    for (const doc of ALL_DOCUMENTS) {
      allChunks.push(...chunkDocument(doc))
    }

    // Build term frequency index for each chunk
    this.index = allChunks.map(chunk => {
      const tokens = tokenize(chunk.text)
      return {
        chunk,
        tf: computeTF(tokens),
        length: tokens.length,
      }
    })

    // Compute average document length
    if (this.index.length > 0) {
      this.avgDL = this.index.reduce((sum, d) => sum + d.length, 0) / this.index.length
    }

    // Compute IDF for all terms
    const N = this.index.length
    const df: Record<string, number> = {}
    for (const doc of this.index) {
      for (const term of Object.keys(doc.tf)) {
        df[term] = (df[term] || 0) + 1
      }
    }
    for (const term of Object.keys(df)) {
      this.idf[term] = Math.log((N - df[term] + 0.5) / (df[term] + 0.5) + 1)
    }
  }

  search(query: string, topK = 5): Chunk[] {
    const queryTokens = tokenize(query)
    const scores: { chunk: Chunk; score: number }[] = []

    for (const doc of this.index) {
      let score = 0
      for (const term of queryTokens) {
        const tf = doc.tf[term] || 0
        const idf = this.idf[term] || 0
        const numerator = tf * (this.k1 + 1)
        const denominator = tf + this.k1 * (1 - this.b + this.b * (doc.length / this.avgDL))
        score += idf * (numerator / denominator)
      }
      if (score > 0) {
        scores.push({ chunk: doc.chunk, score })
      }
    }

    scores.sort((a, b) => b.score - a.score)
    return scores.slice(0, topK).map(s => s.chunk)
  }
}
