import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

describe('development workspace contract resolution', () => {
  it('resolves @guild/contracts to source so API watch sees schema changes', () => {
    const repositoryRoot = resolve(import.meta.dirname, '../../..');
    const configPath = resolve(repositoryRoot, 'apps/api/tsconfig.dev.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
    const resolution = ts.resolveModuleName(
      '@guild/contracts',
      resolve(repositoryRoot, 'apps/api/src/app.ts'),
      parsed.options,
      ts.sys,
    ).resolvedModule;

    expect(resolution?.resolvedFileName.replaceAll('\\', '/')).toBe(
      resolve(repositoryRoot, 'packages/contracts/src/index.ts').replaceAll('\\', '/'),
    );
  });
});
