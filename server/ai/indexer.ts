import { db, type DbChange } from '../db';
import { getAIConfig, isIndexingEnabled } from './config';
import { createChromaStore, type VectorStore } from './chroma';
import { createGeminiEmbedder, type Embedder } from './embeddings';
import { createFileFailureQueue, type FailureQueue } from './failureQueue';
import {
  buildPatientRecords,
  buildRecord,
  dbRecordSource,
  makeRecordId,
  recordKindForChange,
  toVectorMetadata,
  type RecordSource,
} from './records';
import type { IndexReport, MedicalRecord, RecordKind, VectorRecord } from './types';
import { describeError, withTimeout } from './util';

export interface IndexerDeps {
  source: RecordSource;
  embedder: Embedder;
  store: VectorStore;
  queue: FailureQueue;
  timeoutMs: number;
}

const emptyReport = (): IndexReport => ({ scanned: 0, upserted: 0, skippedUnchanged: 0, deletedStale: 0, failed: 0, failures: [] });

/**
 * Keeps ChromaDB in step with the authoritative store.
 *
 * Index failures never propagate to the caller that saved the clinical record: they are logged
 * (ids only, never content) and queued for retry.
 */
export class Indexer {
  /** Operations run strictly one at a time so rapid writes to one record cannot race. */
  private chain: Promise<unknown> = Promise.resolve();

  constructor(private readonly deps: IndexerDeps) {}

  private serial<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task);
    this.chain = run.catch(() => undefined);
    return run;
  }

  private async embedAndUpsert(records: MedicalRecord[]): Promise<void> {
    if (records.length === 0) return;
    const { embedder, store, timeoutMs } = this.deps;
    const embeddings = await withTimeout(embedder.embedDocuments(records.map(r => r.text)), timeoutMs * 2, 'embedding');
    const vectors: VectorRecord[] = records.map((r, i) => ({
      id: r.id,
      embedding: embeddings[i],
      document: r.text,
      metadata: toVectorMetadata(r),
    }));
    await withTimeout(store.upsert(vectors), timeoutMs, 'vector upsert');
  }

  /** Applies the current authoritative state of one record to the index (upsert, or delete if it is gone). */
  syncRecord(kind: RecordKind, sourceId: string, patientId: string): Promise<void> {
    return this.serial(async () => {
      const record = buildRecord(this.deps.source, kind, sourceId, patientId);
      if (record) await this.embedAndUpsert([record]);
      else await withTimeout(this.deps.store.deleteByIds([makeRecordId(kind, sourceId)]), this.deps.timeoutMs, 'vector delete');
    });
  }

  /** Entry point for database change notifications. Never throws. */
  async handleChange(change: DbChange): Promise<void> {
    if (change.type === 'reset') {
      await this.reindexAll({ reset: true }).catch(err => console.error('[AI] Reindex after reset failed:', describeError(err)));
      return;
    }
    const kind = recordKindForChange(change.kind);
    try {
      await this.syncRecord(kind, change.id, change.patientId);
      this.deps.queue.remove(kind, change.id);
    } catch (err) {
      const reason = describeError(err);
      console.warn(`[AI] Index sync failed for ${makeRecordId(kind, change.id)} (queued for retry): ${reason}`);
      this.deps.queue.add({ kind, sourceId: change.id, patientId: change.patientId }, reason);
    }
  }

  /** Retries every queued failure. Returns how many succeeded. */
  async retryFailed(): Promise<{ attempted: number; succeeded: number }> {
    const jobs = this.deps.queue.list();
    let succeeded = 0;
    for (const job of jobs) {
      try {
        await this.syncRecord(job.kind, job.sourceId, job.patientId);
        this.deps.queue.remove(job.kind, job.sourceId);
        succeeded++;
      } catch (err) {
        this.deps.queue.add(job, describeError(err));
      }
    }
    return { attempted: jobs.length, succeeded };
  }

  /**
   * Makes the index for one patient match the authoritative store: embeds new or changed records,
   * leaves unchanged ones alone (no embedding cost), and removes vectors with no source record.
   * Idempotent: running it twice produces the same index.
   */
  reindexPatient(patientId: string): Promise<IndexReport> {
    return this.serial(async () => {
      const { source, store, timeoutMs } = this.deps;
      const report = emptyReport();
      const records = buildPatientRecords(source, patientId);
      report.scanned = records.length;

      const indexed = new Map((await withTimeout(store.listForPatient(patientId), timeoutMs, 'vector listing')).map(v => [v.id, v.contentHash]));
      const wanted = new Set(records.map(r => r.id));

      const changed = records.filter(r => indexed.get(r.id) !== toVectorMetadata(r).content_hash);
      report.skippedUnchanged = records.length - changed.length;

      // Small batches so one bad record cannot sink the whole run.
      for (let i = 0; i < changed.length; i += 25) {
        const batch = changed.slice(i, i + 25);
        try {
          await this.embedAndUpsert(batch);
          report.upserted += batch.length;
        } catch (err) {
          report.failed += batch.length;
          const reason = describeError(err);
          batch.forEach(r => {
            report.failures.push({ id: r.id, reason });
            this.deps.queue.add({ kind: r.kind, sourceId: r.sourceId, patientId }, reason);
          });
        }
      }

      const stale = [...indexed.keys()].filter(id => !wanted.has(id));
      if (stale.length > 0) {
        await withTimeout(store.deleteByIds(stale), timeoutMs, 'vector delete');
        report.deletedStale = stale.length;
      }
      return report;
    });
  }

  /** Reindexes every patient in the authoritative store. `reset` rebuilds the collection from scratch first. */
  async reindexAll(options: { reset?: boolean; onProgress?: (patientId: string, report: IndexReport) => void } = {}): Promise<IndexReport> {
    if (options.reset) await this.serial(() => this.deps.store.reset());
    const total = emptyReport();
    for (const patientId of this.deps.source.listPatientIds()) {
      const r = await this.reindexPatient(patientId);
      total.scanned += r.scanned;
      total.upserted += r.upserted;
      total.skippedUnchanged += r.skippedUnchanged;
      total.deletedStale += r.deletedStale;
      total.failed += r.failed;
      total.failures.push(...r.failures);
      options.onProgress?.(patientId, r);
    }
    return total;
  }
}

let singleton: Indexer | null | undefined;

/** The production indexer, or null when Gemini or ChromaDB is not configured. */
export function getIndexer(): Indexer | null {
  if (singleton !== undefined) return singleton;
  const config = getAIConfig();
  if (!isIndexingEnabled(config)) {
    singleton = null;
    return singleton;
  }
  const embedder = createGeminiEmbedder();
  singleton = new Indexer({
    source: dbRecordSource,
    embedder,
    store: createChromaStore(embedder.signature),
    queue: createFileFailureQueue(),
    timeoutMs: config.requestTimeoutMs,
  });
  return singleton;
}

/** Wires the indexer to database writes and starts periodic retry of failed jobs. Safe to call once at server start. */
export function startAIIndexing(): void {
  const indexer = getIndexer();
  if (!indexer) {
    console.log('[AI] Indexing disabled (set GEMINI_API_KEY and CHROMA_URL to enable). Clinical records are unaffected.');
    return;
  }
  db.onChange(change => {
    void indexer.handleChange(change);
  });
  const retry = () => void indexer.retryFailed().then(r => {
    if (r.attempted > 0) console.log(`[AI] Index retry: ${r.succeeded}/${r.attempted} recovered`);
  }).catch(() => undefined);
  setTimeout(retry, 5_000).unref();
  setInterval(retry, 5 * 60_000).unref();
  console.log('[AI] Indexing enabled: record changes are mirrored to ChromaDB.');
}
