import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const runsRoot = 'D:/Temp/zuoyou-dndweb-e2e-runs';
const e2eRoot = process.env.E2E_RUNTIME_ROOT ?? join(runsRoot, 'run-fallback');

export default function globalSetup() {
  mkdirSync(e2eRoot, { recursive: true });
  const expiry = Date.now() - 24 * 60 * 60 * 1000;
  for (const name of readdirSync(runsRoot)) {
    const candidate = join(runsRoot, name);
    if (candidate !== e2eRoot && statSync(candidate).mtimeMs < expiry) {
      rmSync(candidate, { recursive: true, force: true });
    }
  }
}
