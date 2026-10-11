/**
 * Import this FIRST in every test file. server/db.ts reads and writes ./server/data/store.json relative
 * to the working directory when it is first imported, so run tests from a throwaway directory:
 * they must never read or modify the developer's real data.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'carechain-ai-test-'));
process.chdir(dir);
process.env.JWT_SECRET = 'test-secret';
