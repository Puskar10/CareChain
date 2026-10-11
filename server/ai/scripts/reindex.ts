/**
 * Rebuilds / repairs the ChromaDB index from the authoritative CareChain store.
 *
 *   npm run ai:reindex                     # sync every patient (idempotent; unchanged records are skipped)
 *   npm run ai:reindex -- --patient <id>   # one patient only
 *   npm run ai:reindex -- --retry          # only replay the failed-index queue
 *   npm run ai:reindex -- --reset          # drop and recreate the collection first (e.g. after changing embedding model)
 *
 * Exit code: 0 on success, 1 if any record failed to index, 2 if AI is not configured.
 */
import 'dotenv/config';
import { getAIConfig, hasChroma, hasGemini } from '../config';
import { getIndexer } from '../indexer';

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const flag = (name: string) => args.includes(`--${name}`);
  const patientIdx = args.indexOf('--patient');
  const patientId = patientIdx >= 0 ? args[patientIdx + 1] : undefined;

  const config = getAIConfig();
  if (!hasGemini(config) || !hasChroma(config)) {
    console.error('Reindex needs GEMINI_API_KEY and CHROMA_URL (or CHROMA_API_KEY) to be set. See .env.example.');
    return 2;
  }
  const indexer = getIndexer();
  if (!indexer) return 2;

  if (flag('retry')) {
    const r = await indexer.retryFailed();
    console.log(`Retried ${r.attempted} queued job(s): ${r.succeeded} recovered, ${r.attempted - r.succeeded} still failing.`);
    return r.attempted === r.succeeded ? 0 : 1;
  }

  console.log(`Reindexing into collection "${config.collectionName}"${flag('reset') ? ' (reset)' : ''}…`);
  const report = patientId
    ? await indexer.reindexPatient(patientId)
    : await indexer.reindexAll({
        reset: flag('reset'),
        onProgress: (id, r) => console.log(`  patient ${id}: ${r.scanned} records, ${r.upserted} indexed, ${r.skippedUnchanged} unchanged, ${r.deletedStale} stale removed, ${r.failed} failed`),
      });

  console.log(`Done: ${report.scanned} records scanned, ${report.upserted} indexed, ${report.skippedUnchanged} unchanged, ${report.deletedStale} stale vectors removed, ${report.failed} failed.`);
  report.failures.slice(0, 20).forEach(f => console.error(`  FAILED ${f.id}: ${f.reason}`));
  return report.failed > 0 ? 1 : 0;
}

// Set the exit code instead of calling process.exit(): exiting with sockets still open can crash on Windows.
main().then(
  code => { process.exitCode = code; },
  err => {
    console.error('Reindex failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  },
);
