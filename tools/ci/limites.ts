// ADR-0025: cada branch só pode mexer nos arquivos da sua área.
// Roda no CI (job "limites", .github/workflows/limites.yml) sobre a lista de arquivos do PR.
// Só lê nomes de arquivo: não executa nada do código do PR.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export type Resultado =
  { ok: true; regra: string } | { ok: false; regra: string; motivo: string; foraDaArea: string[] };

/** Áreas de código da equipe Claude (ADR-0023, caminhos novos da ADR-0029). */
const AREA_CLAUDE = [
  'src/domain/',
  'src/application/',
  'src/infrastructure/',
  'src/app/api/',
  'src/middleware.ts',
  'src/proxy.ts', // nome do middleware no Next 16
  'src/instrumentation.ts',
  'drizzle/',
  'scripts/',
  'tests/domain/',
  'tests/application/',
  'tests/infrastructure/',
  'tests/integration/',
  'tests/fixtures/',
  'tests/lint/',
  // Caminhos antigos, válidos até o PR `estrutura/src-camadas` (ADR-0029, seção 4).
  'domain/',
  'lib/',
  'app/api/',
  'middleware.ts',
  'proxy.ts',
  'instrumentation.ts',
  'tests/lib/',
];

/** Rotas de API ficam com a equipe Claude, mesmo dentro de `app/`. */
const API = ['src/app/api/', 'app/api/'];

/** Áreas de código da equipe Gemini (ADR-0023, caminhos novos da ADR-0029). */
const AREA_GEMINI = [
  'src/app/',
  'src/components/',
  'src/styles/',
  'public/',
  'README.md',
  'tests/ui/',
  // Caminhos antigos, válidos até o PR `estrutura/src-camadas` (ADR-0029, seção 4).
  'app/',
  'components/',
  'styles/',
];

/**
 * ADR-0029, seção 5: mudanças de estrutura aprovadas. A branch `estrutura/{slug}` só vale
 * para os slugs desta lista, cada um ligado a uma ADR aceita. Só entra slug por branch `cto/`.
 */
const ESTRUTURAS_APROVADAS: ReadonlyMap<string, string> = new Map([['src-camadas', 'ADR-0029']]);

/** Do QA da equipe que fez a tarefa. */
const AREA_QA = ['tests/qa/'];

/** Código de qualquer equipe: proibido nas branches de processo (`cto/`, `claude/`). */
const AREAS_DE_CODIGO = [...AREA_CLAUDE, ...AREA_GEMINI, ...AREA_QA];

const ID_TAREFA = /^T\d+[a-z]?\.\d+[a-z]?$/;
const SLUG = /^[a-z0-9][a-z0-9._-]*$/;

function dentro(arquivo: string, area: readonly string[]): boolean {
  return area.some((p) => (p.endsWith('/') ? arquivo.startsWith(p) : arquivo === p));
}

function naAreaGemini(arquivo: string): boolean {
  return !dentro(arquivo, API) && dentro(arquivo, AREA_GEMINI);
}

/** O cartão da própria tarefa (o dev e o QA preenchem o relatório nele). */
function cartaoDaTarefa(arquivo: string, id: string): boolean {
  const m = /^docs\/tasks\/E[0-9a-z]+\/(.+)\.md$/.exec(arquivo);
  return m?.[1] === id;
}

export function verificarLimites(branch: string, arquivos: readonly string[]): Resultado {
  const equipe = /^equipe-(claude|gemini)\/(.+)$/.exec(branch);
  if (equipe) {
    const [, nome, id] = equipe as unknown as [string, 'claude' | 'gemini', string];
    const regra = `equipe-${nome}/T{id}`;
    if (!ID_TAREFA.test(id)) {
      return {
        ok: false,
        regra,
        motivo: `"${id}" não é um id de tarefa (ex.: T1.3, T2.10a, T1b.2).`,
        foraDaArea: [],
      };
    }
    // ADR-0026: equipe-gemini também pode tocar AREA_CLAUDE no modo unificado Gemini,
    // mantendo equipe-claude intacta e continuando a barrar configs, deps, ADRs e outros cartões.
    const naArea = (a: string) =>
      dentro(a, AREA_QA) ||
      cartaoDaTarefa(a, id) ||
      (nome === 'claude' ? dentro(a, AREA_CLAUDE) : naAreaGemini(a) || dentro(a, AREA_CLAUDE));
    const fora = arquivos.filter((a) => !naArea(a));
    return fora.length === 0
      ? { ok: true, regra }
      : {
          ok: false,
          regra,
          motivo: `a branch da equipe ${nome} mexeu fora da área dela.`,
          foraDaArea: fora,
        };
  }

  const estrutura = /^estrutura\/(.+)$/.exec(branch);
  if (estrutura) {
    const slug = estrutura[1] ?? '';
    const adr = ESTRUTURAS_APROVADAS.get(slug);
    return adr
      ? { ok: true, regra: `estrutura/{slug} (${adr})` }
      : {
          ok: false,
          regra: 'estrutura/{slug}',
          motivo: `"${slug}" não é uma mudança de estrutura aprovada: registre a ADR e o slug em ESTRUTURAS_APROVADAS por uma branch cto/.`,
          foraDaArea: [],
        };
  }

  const processo = /^(cto|claude)\/(.+)$/.exec(branch);
  if (processo) {
    const regra = `${processo[1]}/{assunto}`;
    if (!SLUG.test(processo[2] ?? '')) {
      return { ok: false, regra, motivo: 'nome de branch inválido.', foraDaArea: [] };
    }
    const fora = arquivos.filter((a) => dentro(a, AREAS_DE_CODIGO));
    return fora.length === 0
      ? { ok: true, regra }
      : {
          ok: false,
          regra,
          motivo: 'branch de processo (cto/, claude/) não mexe em código: abra um cartão.',
          foraDaArea: fora,
        };
  }

  return {
    ok: false,
    regra: 'nenhuma',
    motivo:
      'nome de branch fora do padrão. Use equipe-claude/T{id}, equipe-gemini/T{id}, cto/{assunto} ou estrutura/{slug}.',
    foraDaArea: [],
  };
}

function main(): void {
  const branch = process.env.HEAD_REF ?? '';
  const base = process.env.BASE_SHA ?? 'origin/main';
  const head = process.env.HEAD_SHA ?? 'HEAD';
  const saida = execFileSync('git', ['diff', '--name-only', '--no-renames', `${base}...${head}`], {
    encoding: 'utf8',
  });
  const arquivos = saida.split('\n').filter((l) => l.length > 0);
  const r = verificarLimites(branch, arquivos);
  if (r.ok) {
    console.log(`limites: OK (${arquivos.length} arquivos, regra ${r.regra})`);
    return;
  }
  console.error(`limites: FALHOU (regra ${r.regra}): ${r.motivo}`);
  for (const a of r.foraDaArea) console.error(`  fora da área: ${a}`);
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
