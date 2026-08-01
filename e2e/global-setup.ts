import { mkdirSync, rmSync } from 'node:fs';

const e2eRoot = 'D:/Temp/zuoyou-dndweb-e2e-runtime';

export default function globalSetup() {
  rmSync(e2eRoot, { recursive: true, force: true });
  mkdirSync(e2eRoot, { recursive: true });
}
