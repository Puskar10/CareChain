/**
 * AI configuration. Everything is read lazily from process.env so that dotenv (which the
 * server loads after its imports are evaluated) is always honoured, and so tests can override it.
 */

const DEFAULT_GENERATION_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';

export interface AIConfig {
  geminiApiKey: string | undefined;
  generationModel: string;
  embeddingModel: string;
  /** Output size requested from the embedding model. Fixed per collection. */
  embeddingDimensions: number;
  chromaUrl: string | undefined;
  chromaApiKey: string | undefined;
  chromaTenant: string | undefined;
  chromaDatabase: string | undefined;
  collectionName: string;
  adminToken: string | undefined;
  /** Hard cap on one Gemini / embedding request. */
  requestTimeoutMs: number;
}

export function getAIConfig(env: NodeJS.ProcessEnv = process.env): AIConfig {
  const dims = Number.parseInt(env.GEMINI_EMBEDDING_DIMENSIONS || '', 10);
  const timeout = Number.parseInt(env.AI_REQUEST_TIMEOUT_MS || '', 10);
  return {
    geminiApiKey: env.GEMINI_API_KEY?.trim() || undefined,
    generationModel: env.GEMINI_MODEL?.trim() || DEFAULT_GENERATION_MODEL,
    embeddingModel: env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL,
    embeddingDimensions: Number.isFinite(dims) && dims > 0 ? dims : 768,
    chromaUrl: env.CHROMA_URL?.trim() || undefined,
    chromaApiKey: env.CHROMA_API_KEY?.trim() || undefined,
    chromaTenant: env.CHROMA_TENANT?.trim() || undefined,
    chromaDatabase: env.CHROMA_DATABASE?.trim() || undefined,
    collectionName: env.CHROMA_COLLECTION?.trim() || 'carechain_medical_records',
    adminToken: env.AI_ADMIN_TOKEN?.trim() || undefined,
    requestTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 30_000,
  };
}

export const hasGemini = (c: AIConfig = getAIConfig()) => Boolean(c.geminiApiKey);
export const hasChroma = (c: AIConfig = getAIConfig()) => Boolean(c.chromaUrl || c.chromaApiKey);
/** The vector index is only maintained when both an embedder and a vector store are configured. */
export const isIndexingEnabled = (c: AIConfig = getAIConfig()) => hasGemini(c) && hasChroma(c);
