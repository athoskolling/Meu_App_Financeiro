// QA do T1.0a: caminhosConsiderados e arquivosNaoTs (tests/lint/domain-files.test.ts).
// Dados sintéticos. O teste de link real só roda se o SO permitir criar link simbólico
// (no Windows sem modo desenvolvedor isso dá EPERM, e o teste é pulado).
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { arquivosNaoTs, caminhosConsiderados } from '../lint/domain-files.test';

type EntradaFalsa = { caminho: string; isDirectory: () => boolean };

// Gerador com semente fixa (sem dependência nova).
function gerador(semente: number) {
  let estado = semente;
  return () => {
    estado = (estado * 1103515245 + 12345) & 0x7fffffff;
    return estado / 0x7fffffff;
  };
}

describe('QA T1.0a: caminhosConsiderados', () => {
  it('link simbólico (isFile e isDirectory falsos) entra na lista', () => {
    const entradas: EntradaFalsa[] = [{ caminho: 'domain/l.mjs', isDirectory: () => false }];
    expect(caminhosConsiderados(entradas)).toEqual(['domain/l.mjs']);
  });

  it('link para .mjs dentro de domain/ é pego por arquivosNaoTs (antes era ignorado pelo isFile)', () => {
    const entradas: EntradaFalsa[] = [
      { caminho: 'domain/a.ts', isDirectory: () => false },
      { caminho: 'domain/l.mjs', isDirectory: () => false },
    ];
    expect(arquivosNaoTs(caminhosConsiderados(entradas))).toEqual(['domain/l.mjs']);
  });

  it('diretório nunca entra, mesmo com nome que lembra arquivo', () => {
    const entradas: EntradaFalsa[] = [
      { caminho: 'domain/sub.mjs', isDirectory: () => true },
      { caminho: 'domain/x.ts', isDirectory: () => false },
    ];
    expect(caminhosConsiderados(entradas)).toEqual(['domain/x.ts']);
  });

  it('propriedade: saída = entradas sem diretório, na mesma ordem, sem duplicar nem inventar', () => {
    const rnd = gerador(2026);
    for (let rodada = 0; rodada < 50; rodada++) {
      const tamanho = Math.floor(rnd() * 12);
      const entradas: EntradaFalsa[] = [];
      for (let i = 0; i < tamanho; i++) {
        // Sorteia uma vez por entrada: isDirectory() precisa ser determinístico.
        const ehDir = rnd() < 0.4;
        entradas.push({ caminho: `domain/e${i}`, isDirectory: () => ehDir });
      }
      const esperado = entradas.filter((e) => !e.isDirectory()).map((e) => e.caminho);
      expect(caminhosConsiderados(entradas)).toEqual(esperado);
    }
  });

  it('lista vazia devolve lista vazia', () => {
    expect(caminhosConsiderados([])).toEqual([]);
  });
});

// Teste com link simbólico de verdade, se o SO permitir.
function linkPossivel(): boolean {
  const raizTmp = mkdtempSync(join(tmpdir(), 'qa-t1-0a-'));
  try {
    mkdirSync(join(raizTmp, 'probe'));
    symlinkSync(join(raizTmp, 'probe'), join(raizTmp, 'probe-link'), 'dir');
    return true;
  } catch {
    return false;
  } finally {
    rmSync(raizTmp, { recursive: true, force: true });
  }
}
const podeLink = linkPossivel();

describe.runIf(podeLink)('QA T1.0a: link simbólico real', () => {
  it('readdirSync recursivo: link para .mjs entra; diretório fica fora', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'qa-t1-0a-real-'));
    try {
      const dom = join(raiz, 'domain');
      mkdirSync(join(dom, 'sub'), { recursive: true });
      writeFileSync(join(dom, 'a.ts'), '');
      symlinkSync(join(dom, 'a.ts'), join(dom, 'l.mjs'), 'file');
      symlinkSync(join(dom, 'sub'), join(dom, 'dl'), 'dir');
      const todos = caminhosConsiderados(
        readdirSync(dom, { recursive: true, withFileTypes: true }).map((e) => ({
          caminho: relative(raiz, `${e.parentPath}/${e.name}`).replaceAll('\\', '/'),
          isDirectory: () => e.isDirectory(),
        })),
      );
      expect(todos.sort()).toEqual(['domain/a.ts', 'domain/dl', 'domain/l.mjs'].sort());
      expect(arquivosNaoTs(todos).sort()).toEqual(['domain/dl', 'domain/l.mjs'].sort());
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });
});
