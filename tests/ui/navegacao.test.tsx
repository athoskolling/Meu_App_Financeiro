import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Navegacao } from '../../components/Navegacao';

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

describe('Navegacao', () => {
  it('renderiza os 4 links na ordem e marca apenas / como atual quando atual="/"', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/" />);
    const links = extrairLinks(html);

    expect(links.map((l) => l.href)).toEqual(['/', '/transacoes', '/contas', '/importar']);
    expect(links.map((l) => l.texto)).toEqual(['Painel', 'Transações', 'Contas', 'Importar']);
    expect(links.map((l) => l.ariaCurrent)).toEqual(['page', null, null, null]);
  });

  it('marca apenas Transações como atual em subpágina /transacoes/abc', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/transacoes/abc" />);
    const links = extrairLinks(html);

    expect(links.map((l) => l.ariaCurrent)).toEqual([null, 'page', null, null]);
  });

  it('não marca nenhum link como atual quando atual="/contasx"', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/contasx" />);
    const links = extrairLinks(html);

    expect(links.every((l) => l.ariaCurrent === null)).toBe(true);
  });

  it('inclui nav com aria-label="Principal" e marca apenas Importar em /importar', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/importar" />);
    const links = extrairLinks(html);

    expect(html).toContain('<nav');
    expect(html).toContain('aria-label="Principal"');
    expect(links.map((l) => l.ariaCurrent)).toEqual([null, null, null, 'page']);
  });
});
