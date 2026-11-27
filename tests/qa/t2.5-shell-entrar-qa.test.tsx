import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Navegacao } from '../../src/components/Navegacao';
import { Logo } from '../../src/components/Logo';
import { Cabecalho } from '../../src/components/Cabecalho';
import PaginaEntrar, { metadata as entrarMetadata } from '../../src/app/entrar/page';
import PaginaTransacoes, {
  metadata as transacoesMetadata,
} from '../../src/app/(app)/transacoes/page';
import PaginaContas, { metadata as contasMetadata } from '../../src/app/(app)/contas/page';
import PaginaImportar, { metadata as importarMetadata } from '../../src/app/(app)/importar/page';

function extrairLinks(html: string) {
  const matches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  return matches.map((match) => {
    const attrs = match[1] ?? '';
    const texto = (match[2] ?? '').replace(/<[^>]*>/g, '').trim();
    const hrefMatch = attrs.match(/href="([^"]*)"/);
    const ariaCurrentMatch = attrs.match(/aria-current="([^"]*)"/);
    return {
      href: hrefMatch?.[1] ?? null,
      ariaCurrent: ariaCurrentMatch?.[1] ?? null,
      texto,
    };
  });
}

describe('QA T2.5: Navegacao (bordas)', () => {
  it('não marca nenhum item quando atual=""', () => {
    const html = renderToStaticMarkup(<Navegacao atual="" />);
    const links = extrairLinks(html);
    expect(links).toHaveLength(4);
    expect(links.every((l) => l.ariaCurrent === null)).toBe(true);
  });

  it('marca Transações em /transacoes/ (barra final)', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/transacoes/" />);
    const links = extrairLinks(html);
    expect(links.map((l) => l.ariaCurrent)).toEqual([null, 'page', null, null]);
  });

  it('não marca Transações em /transacoes-novo', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/transacoes-novo" />);
    const links = extrairLinks(html);
    expect(links.every((l) => l.ariaCurrent === null)).toBe(true);
  });

  it('marca Contas em subrota profunda /contas/123/detalhe', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/contas/123/detalhe" />);
    const links = extrairLinks(html);
    expect(links.map((l) => l.ariaCurrent)).toEqual([null, null, 'page', null]);
  });

  it('não marca Contas em /contas-2', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/contas-2" />);
    const links = extrairLinks(html);
    expect(links.every((l) => l.ariaCurrent === null)).toBe(true);
  });

  it('marca Importar em /importar/revisar', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/importar/revisar" />);
    const links = extrairLinks(html);
    expect(links.map((l) => l.ariaCurrent)).toEqual([null, null, null, 'page']);
  });

  it('não marca Importar em /importar2', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/importar2" />);
    const links = extrairLinks(html);
    expect(links.every((l) => l.ariaCurrent === null)).toBe(true);
  });

  it('não marca nenhum item em /desconhecida', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/desconhecida" />);
    const links = extrairLinks(html);
    expect(links.every((l) => l.ariaCurrent === null)).toBe(true);
  });
});

describe('QA T2.5: PaginaEntrar (bordas e segurança)', () => {
  it('tem metadata.title correto', () => {
    expect(entrarMetadata.title).toBe('Entrar · Meu Financeiro');
  });

  it('mantém form method="post" e action="/api/auth/login" e não renderiza <header>', async () => {
    const html = renderToStaticMarkup(await PaginaEntrar({ searchParams: Promise.resolve({}) }));
    expect(html).toMatch(/<form\b[^>]*method="post"[^>]*>/i);
    expect(html).toMatch(/<form\b[^>]*action="\/api\/auth\/login"[^>]*>/i);
    expect(html).not.toMatch(/<header\b/i);
  });

  it.each([
    { rotulo: 'ausente', params: {} },
    { rotulo: 'vazio', params: { erro: '' } },
    { rotulo: 'toString (prototype)', params: { erro: 'toString' } },
    { rotulo: 'constructor (prototype)', params: { erro: 'constructor' } },
    { rotulo: '__proto__ (prototype)', params: { erro: '__proto__' } },
    { rotulo: 'RECUSADO (maiúsculas)', params: { erro: 'RECUSADO' } },
    { rotulo: 'recusado com espaço', params: { erro: 'recusado ' } },
    { rotulo: 'array ["recusado"]', params: { erro: ['recusado'] } },
    { rotulo: 'XSS payload', params: { erro: '"><img src=x onerror=alert(1)>' } },
  ])('não exibe role="alert" nem reflete valor quando erro=$rotulo', async ({ params }) => {
    const html = renderToStaticMarkup(
      await PaginaEntrar({
        searchParams: Promise.resolve(params),
      }),
    );

    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert(1)');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('toString');
    expect(html).not.toContain('__proto__');
  });
});

describe('QA T2.5: Páginas provisórias em (app)', () => {
  it.each([
    {
      nome: 'Transações',
      Componente: PaginaTransacoes,
      metadata: transacoesMetadata,
      tituloEsperado: 'Transações · Meu Financeiro',
    },
    {
      nome: 'Contas',
      Componente: PaginaContas,
      metadata: contasMetadata,
      tituloEsperado: 'Contas · Meu Financeiro',
    },
    {
      nome: 'Importar',
      Componente: PaginaImportar,
      metadata: importarMetadata,
      tituloEsperado: 'Importar · Meu Financeiro',
    },
  ])(
    '$nome tem h1 certo, "Em construção.", metadata.title e nenhum dígito no texto renderizado',
    ({ nome, Componente, metadata, tituloEsperado }) => {
      expect(metadata.title).toBe(tituloEsperado);

      const html = renderToStaticMarkup(<Componente />);
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      expect(h1Match?.[1]?.trim()).toBe(nome);
      expect(html).toContain('Em construção.');

      const textoPuro = html.replace(/<[^>]*>/g, ' ').trim();
      expect(textoPuro).not.toMatch(/\d/);
    },
  );
});

describe('QA T2.5: Logo e Cabecalho', () => {
  it('Logo renderiza SVG com aria-hidden="true" e texto "Meu Financeiro"', () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toMatch(/<svg\b[^>]*aria-hidden="true"[^>]*>/);
    expect(html).toContain('Meu Financeiro');
  });

  it('Cabecalho tem link para "/" com logo e não inclui itens de sincronização (T3.7)', () => {
    // Cabecalho usa NavegacaoAtual (usePathname). Testamos Logo + estrutura sem depender de router hook
    // mas também verificamos que Cabecalho renderiza sem "Sincronizar" / "Sincronizado" quando mockado ou inspecionado.
    const html = renderToStaticMarkup(<Cabecalho />);
    expect(html).toMatch(/<a\b[^>]*href="\/"[^>]*>[\s\S]*Meu Financeiro[\s\S]*<\/a>/);
    expect(html).not.toContain('Sincronizar');
    expect(html).not.toContain('Sincronizado');
  });
});
