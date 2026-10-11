import { ChromaClient, CloudClient, type Collection } from 'chromadb';
import { getAIConfig } from './config';
import type { VectorMetadata, VectorRecord } from './types';

/**
 * Thin wrapper over ChromaDB. It is only a derived search index: every read result must be
 * re-verified against the authoritative store by the caller, and every query is scoped to a
 * single patient via the `patient_id` metadata filter.
 */
export interface VectorStore {
  upsert(records: VectorRecord[]): Promise<void>;
  deleteByIds(ids: string[]): Promise<void>;
  /** All indexed IDs and content hashes for one patient (used to find stale / unchanged vectors). */
  listForPatient(patientId: string): Promise<{ id: string; contentHash: string }[]>;
  /** Nearest vectors for a patient, best first. */
  query(patientId: string, embedding: number[], limit: number): Promise<{ id: string; distance: number }[]>;
  /** Drops and recreates the collection (used by `ai:reindex --reset`). */
  reset(): Promise<void>;
}

function parseUrl(raw: string) {
  const url = new URL(raw.includes('://') ? raw : `http://${raw}`);
  const ssl = url.protocol === 'https:';
  return { host: url.hostname, port: url.port ? Number(url.port) : ssl ? 443 : 8000, ssl };
}

function createClient(): ChromaClient {
  const c = getAIConfig();
  const isCloud = Boolean(c.chromaApiKey) && (!c.chromaUrl || /trychroma\.com$/i.test(parseUrl(c.chromaUrl).host));
  if (isCloud) {
    return new CloudClient({ apiKey: c.chromaApiKey, tenant: c.chromaTenant, database: c.chromaDatabase });
  }
  const { host, port, ssl } = parseUrl(c.chromaUrl || 'http://localhost:8000');
  return new ChromaClient({
    host,
    port,
    ssl,
    tenant: c.chromaTenant,
    database: c.chromaDatabase,
    headers: c.chromaApiKey ? { 'x-chroma-token': c.chromaApiKey } : undefined,
  });
}

const BATCH = 100;

export function createChromaStore(embeddingSignature: string): VectorStore {
  const { collectionName } = getAIConfig();
  let client: ChromaClient | undefined;
  let collection: Collection | undefined;

  const getCollection = async (): Promise<Collection> => {
    if (collection) return collection;
    client ??= createClient();
    const col = await client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: null,
      configuration: { hnsw: { space: 'cosine' } },
      metadata: { embedding: embeddingSignature, purpose: 'carechain patient record search index' },
    });
    const existing = (col.metadata as Record<string, unknown> | null | undefined)?.embedding;
    if (typeof existing === 'string' && existing !== embeddingSignature) {
      throw new Error(`Collection "${collectionName}" was built with embedding "${existing}", not "${embeddingSignature}". Run \`npm run ai:reindex -- --reset\`.`);
    }
    collection = col;
    return col;
  };

  /**
   * Runs `fn` against the collection. If the collection was dropped and recreated behind our back
   * (e.g. `npm run ai:reindex -- --reset` while the server is running), the cached handle is stale:
   * re-resolve it once and retry. Every operation here is idempotent, so a retry is safe.
   */
  const withCollection = async <T>(fn: (col: Collection) => Promise<T>): Promise<T> => {
    try {
      return await fn(await getCollection());
    } catch (err) {
      if (!/could not be found|does not exist|not found/i.test(err instanceof Error ? err.message : String(err))) throw err;
      collection = undefined;
      return fn(await getCollection());
    }
  };

  return {
    upsert: records => withCollection(async col => {
      for (let i = 0; i < records.length; i += BATCH) {
        const chunk = records.slice(i, i + BATCH);
        await col.upsert({
          ids: chunk.map(r => r.id),
          embeddings: chunk.map(r => r.embedding),
          documents: chunk.map(r => r.document),
          metadatas: chunk.map(r => r.metadata),
        });
      }
    }),

    deleteByIds: ids => withCollection(async col => {
      for (let i = 0; i < ids.length; i += BATCH) await col.delete({ ids: ids.slice(i, i + BATCH) });
    }),

    listForPatient: patientId => withCollection(async col => {
      const out: { id: string; contentHash: string }[] = [];
      for (let offset = 0; ; offset += 500) {
        const page = await col.get({ where: { patient_id: patientId }, include: ['metadatas'], limit: 500, offset });
        page.ids.forEach((id, i) => {
          const meta = page.metadatas[i] as Partial<VectorMetadata> | null;
          out.push({ id, contentHash: meta?.content_hash ?? '' });
        });
        if (page.ids.length < 500) break;
      }
      return out;
    }),

    query: (patientId, embedding, limit) => withCollection(async col => {
      const res = await col.query({
        queryEmbeddings: [embedding],
        nResults: limit,
        where: { patient_id: patientId },
        include: ['distances'],
      });
      const ids = res.ids[0] ?? [];
      const distances = res.distances?.[0] ?? [];
      return ids.map((id, i) => ({ id, distance: distances[i] ?? Number.NaN }));
    }),

    async reset() {
      client ??= createClient();
      try {
        await client.deleteCollection({ name: collectionName });
      } catch {
        /* collection may not exist yet */
      }
      collection = undefined;
      await getCollection();
    },
  };
}
