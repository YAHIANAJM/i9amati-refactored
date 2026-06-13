// RAG Retriever — Wraps the BM25 index and formats context for the LLM

import { BM25Index, Chunk } from './chunks'

export interface RetrievedContext {
  text: string
  source: string
  sourceTitle: string
}

class KnowledgeRetriever {
  private index: BM25Index

  constructor() {
    this.index = new BM25Index()
    console.log('[IQAMATI Chatbot] Knowledge base initialized')
  }

  retrieve(query: string, topK = 5): RetrievedContext[] {
    const chunks = this.index.search(query, topK)
    return chunks.map(chunk => ({
      text: chunk.text,
      source: chunk.source,
      sourceTitle: chunk.sourceTitle,
    }))
  }

  formatContext(contexts: RetrievedContext[]): string {
    if (contexts.length === 0) {
      return 'No specific information found in the knowledge base for this query.'
    }

    return contexts
      .map((ctx) => `[Source: ${ctx.sourceTitle}]\n${ctx.text}`)
      .join('\n\n---\n\n')
  }
}

// Singleton instance — initialized once when the module is first imported
let _retriever: KnowledgeRetriever | null = null

export function getRetriever(): KnowledgeRetriever {
  if (!_retriever) {
    _retriever = new KnowledgeRetriever()
  }
  return _retriever
}
