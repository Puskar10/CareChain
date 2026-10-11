import { GoogleGenAI } from '@google/genai';
import { getAIConfig } from './config';

/** Text → vector. Implemented by Gemini in production; substitutable in tests. */
export interface Embedder {
  /** Identifies the embedding space; stored on the collection so mismatches are detected. */
  readonly signature: string;
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

const BATCH_SIZE = 50;

function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
  return norm > 0 ? vector.map(x => x / norm) : vector;
}

let cachedClient: { key: string; client: GoogleGenAI } | undefined;

/** One shared Gemini client per API key (server-side only; the key never reaches the browser). */
export function getGeminiClient(): GoogleGenAI {
  const { geminiApiKey } = getAIConfig();
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not configured');
  if (!cachedClient || cachedClient.key !== geminiApiKey) {
    cachedClient = { key: geminiApiKey, client: new GoogleGenAI({ apiKey: geminiApiKey }) };
  }
  return cachedClient.client;
}

export function createGeminiEmbedder(): Embedder {
  const config = getAIConfig();
  const { embeddingModel: model, embeddingDimensions: dimensions, requestTimeoutMs } = config;

  const embed = async (texts: string[], taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY') => {
    const response = await getGeminiClient().models.embedContent({
      model,
      contents: texts,
      config: { taskType, outputDimensionality: dimensions, httpOptions: { timeout: requestTimeoutMs } },
    });
    const vectors = (response.embeddings ?? []).map(e => e.values ?? []);
    if (vectors.length !== texts.length || vectors.some(v => v.length === 0)) {
      throw new Error('Embedding response did not match the request');
    }
    // Reduced-dimension Gemini embeddings are not unit length; normalise for cosine similarity.
    return vectors.map(l2Normalize);
  };

  return {
    signature: `${model}@${dimensions}`,
    async embedDocuments(texts) {
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        out.push(...(await embed(texts.slice(i, i + BATCH_SIZE), 'RETRIEVAL_DOCUMENT')));
      }
      return out;
    },
    async embedQuery(text) {
      return (await embed([text], 'RETRIEVAL_QUERY'))[0];
    },
  };
}
