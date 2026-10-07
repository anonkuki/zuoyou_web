import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/stargate.css'), 'utf8');

describe('stargate card wall layout', () => {
  it('uses an equal-width staggered 2-3-2 desktop grid', () => {
    expect(css).toContain('grid-template-columns: repeat(6, minmax(0, 1fr));');
    expect(css).toContain('". a a b b ."');
    expect(css).toContain('"c c D D d d"');
    expect(css).toContain('". e e f f ."');
  });

  it('keeps the center card footer compact', () => {
    expect(css).toMatch(/\.sg-doc-caption\s*\{[^}]*height:\s*140px;[^}]*min-height:\s*0;/s);
    expect(css).toMatch(/\.sg-doctor-form\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;/s);
  });

  it('forms mirrored triangles around the center card on narrow screens', () => {
    expect(css).toMatch(/@media \(max-width:\s*760px\)[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/);
    expect(css).toContain('". a a ."');
    expect(css).toContain('"b b c c"');
    expect(css).toContain('"D D D D"');
    expect(css).toContain('"d d e e"');
    expect(css).toContain('". f f ."');
  });
});
