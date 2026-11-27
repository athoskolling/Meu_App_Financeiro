import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Skills compartilhadas: cada skill em .agents/skills/ (Gemini, Antigravity) tem uma cópia
// idêntica em .claude/skills/ (Claude Code). Se uma equipe mudar só a sua cópia, este teste falha.
const GEMINI = '.agents/skills';
const CLAUDE = '.claude/skills';

function arquivos(pasta: string): string[] {
  return readdirSync(pasta, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name).slice(pasta.length + 1))
    .sort();
}

const compartilhadas = readdirSync(GEMINI, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

describe('skills compartilhadas entre Claude e Gemini', () => {
  it('há pelo menos uma skill compartilhada', () => {
    expect(compartilhadas.length).toBeGreaterThan(0);
  });

  it.each(compartilhadas)('%s: cópias idênticas em .claude/skills e .agents/skills', (skill) => {
    const daGemini = arquivos(join(GEMINI, skill));
    expect(arquivos(join(CLAUDE, skill))).toEqual(daGemini);
    expect(daGemini).toContain('SKILL.md');
    expect(daGemini).toContain('FONTE.md');
    for (const arquivo of daGemini) {
      expect(readFileSync(join(CLAUDE, skill, arquivo), 'utf8'), arquivo).toBe(
        readFileSync(join(GEMINI, skill, arquivo), 'utf8'),
      );
    }
  });
});
