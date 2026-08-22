// Dev launcher for @guild/web: guarantees the Fastify API is running before Vite starts.
// The Kimi Work preview card (and `npm run dev` inside apps/web) only starts this package,
// so we spawn `tsx watch src/server.ts` from @guild/api ourselves when the configured API port is idle.
// Any CLI args (e.g. --port/--host injected by the preview runtime) are forwarded to Vite.
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const apiRoot = resolve(webRoot, '..', 'api');
const apiPort = process.env.API_PORT ?? '3100';
const API_HEALTH = `http://127.0.0.1:${apiPort}/api/health`;

async function apiIsUp() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(API_HEALTH, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

const children = [];
function shutdown(code = 0) {
  for (const child of children.splice(0)) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch { /* already gone */ }
  }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

if (await apiIsUp()) {
  console.log(`[dev-with-api] API already listening on ${apiPort}, reusing it.`);
} else {
  console.log('[dev-with-api] API not detected, spawning @guild/api with live workspace contracts…');
  const tsxCli = resolve(apiRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const api = spawn(process.execPath, [tsxCli, 'watch', '--tsconfig', 'tsconfig.dev.json', 'src/server.ts'], {
    cwd: apiRoot,
    env: { ...process.env, PORT: apiPort },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  api.on('exit', (code) => {
    console.error(`[dev-with-api] API process exited with code ${code}`);
    shutdown(code ?? 1);
  });
  children.push(api);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await apiIsUp()) break;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
}

const viteCli = resolve(webRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(process.execPath, [viteCli, ...process.argv.slice(2)], {
  cwd: webRoot,
  stdio: ['ignore', 'inherit', 'inherit'],
});
children.push(vite);
vite.on('exit', (code) => shutdown(code ?? 0));
