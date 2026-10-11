import fs from 'fs';
import path from 'path';
import type { RecordKind } from './types';

/**
 * Durable list of index operations that failed (ChromaDB or the embedder was unavailable).
 * The clinical record is already saved by the time an entry is queued; retrying only repairs the
 * search index. On retry the current state of the authoritative store is re-read, so a queued
 * `upsert` for a record that has since been deleted simply removes its vector.
 */
export interface QueuedIndexJob {
  kind: RecordKind;
  sourceId: string;
  patientId: string;
  attempts: number;
  lastError: string;
  queuedAt: string;
}

export interface FailureQueue {
  add(job: Pick<QueuedIndexJob, 'kind' | 'sourceId' | 'patientId'>, error: string): void;
  remove(kind: RecordKind, sourceId: string): void;
  list(): QueuedIndexJob[];
  size(): number;
}

const keyOf = (kind: RecordKind, sourceId: string) => `${kind}:${sourceId}`;

export function createFileFailureQueue(file = path.join(process.cwd(), 'server', 'data', 'ai-index-queue.json')): FailureQueue {
  const load = (): Record<string, QueuedIndexJob> => {
    try {
      return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    } catch {
      return {};
    }
  };
  const save = (jobs: Record<string, QueuedIndexJob>) => {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(jobs, null, 2), 'utf8');
    } catch (err) {
      console.error('[AI] Could not persist the index retry queue:', err instanceof Error ? err.message : err);
    }
  };

  return {
    add(job, error) {
      const jobs = load();
      const key = keyOf(job.kind, job.sourceId);
      jobs[key] = {
        ...job,
        attempts: (jobs[key]?.attempts ?? 0) + 1,
        lastError: error,
        queuedAt: jobs[key]?.queuedAt ?? new Date().toISOString(),
      };
      save(jobs);
    },
    remove(kind, sourceId) {
      const jobs = load();
      if (delete jobs[keyOf(kind, sourceId)]) save(jobs);
    },
    list: () => Object.values(load()),
    size: () => Object.keys(load()).length,
  };
}

export function createMemoryFailureQueue(): FailureQueue {
  const jobs = new Map<string, QueuedIndexJob>();
  return {
    add(job, error) {
      const key = keyOf(job.kind, job.sourceId);
      const prev = jobs.get(key);
      jobs.set(key, { ...job, attempts: (prev?.attempts ?? 0) + 1, lastError: error, queuedAt: prev?.queuedAt ?? new Date().toISOString() });
    },
    remove: (kind, sourceId) => void jobs.delete(keyOf(kind, sourceId)),
    list: () => [...jobs.values()],
    size: () => jobs.size,
  };
}
