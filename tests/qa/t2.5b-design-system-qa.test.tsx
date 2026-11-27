import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SeloConferencia } from '../../components/ui/SeloConferencia';
import { FaixaPrevia } from '../../components/ui/FaixaPrevia';
import { NavegacaoMobile } from '../../components/NavegacaoMobile';
import { Navegacao } from '../../components/Navegacao';
import { Cabecalho } from '../../components/Cabecalho';

function extrairLinks(html: string) {
  const matches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  return matches.map((match) => {
    const attrs = match[1] ?? '';
    const texto = (match[2] ?? '').replace(/<[^>]*>/g, '').trim();
    const hrefMatch = attrs.match(/href="([^"]*)"/);
    const ariaCurrentMatch = attrs.match(/aria-current="([^"]*)"/);
    const classMatch = attrs.match(/class="([^"]*)"/);
    return {
      href: hrefMatch?.[1] ?? null,
      ariaCurrent: ariaCurrentMatch?.[1] ?? null,
      className: classMatch?.[1] ?? '',
      texto,
    };
  });
}

describe('QA T2.5b: SeloConferencia (todos os 4 estados)', () => {
  it.each([
    {
      estado: 'confere' as const,
      texto: 'Confere',
      classesEsperadas: ['-rotate-3', 'border-confere', 'text-confere'],
      deveRotacionar: true,
    },
    {
      estado: 'verificar' as const,
      texto: 'Verificar',
      classesEsperadas: ['-rotate-3', 'border-aviso', 'bg-aviso-fundo', 'text-aviso'],
      deveRotacionar: true,
    },
    {
      estado: 'nao_confere' as const,
      texto: 'Não confere',
      classesEsperadas: ['-rotate-3', 'border-aviso', 'text-aviso'],
      deveRotacionar: true,
    },
    {
      estado: 'aguardando' as const,
      texto: 'Aguardando',
      classesEsperadas: ['border-dashed', 'border-texto-suave', 'text-texto-medio'],
      deveRotacionar: false,
    },
  ])(
    'renderiza estado "$estado" com texto exato "$texto", tokens esperados e sem cores hex',
    ({ estado, texto, classesEsperadas, deveRotacionar }) => {
      const html = renderToStaticMarkup(<SeloConferencia estado={estado} />);

      const textoLimpo = html.replace(/<[^>]*>/g, '').trim();
      expect(textoLimpo).toBe(texto);
      expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);

      for (const classe of classesEsperadas) {
        expect(html).toContain(classe);
      }

      if (deveRotacionar) {
        expect(html).toContain('-rotate-3');
        expect(html).not.toContain('border-dashed');
      } else {
        expect(html).not.toContain('-rotate-3');
        expect(html).toContain('border-dashed');
      }
    },
  );
});

describe('QA T2.5b: FaixaPrevia (com e sem children)', () => {
  it('renderiza role="status" e texto padrão sem children extras', () => {
    const html = renderToStaticMarkup(<FaixaPrevia />);

    expect(html).toContain('role="status"');
    expect(html).toContain(
      'Prévia visual com dados fictícios. As regras financeiras e conexões reais entram nas próximas etapas.',
    );
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('renderiza children opcionais mantendo role="status"', () => {
    const html = renderToStaticMarkup(
      <FaixaPrevia>
        <button type="button">Alternar estado</button>
      </FaixaPrevia>,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('Alternar estado');
  });
});

describe('QA T2.5b: NavegacaoMobile e Navegacao (bordas)', () => {
  it('NavegacaoMobile tem aria-label="Navegação principal mobile" e 4 links com min-h-[56px]', () => {
    const html = renderToStaticMarkup(<NavegacaoMobile atual="/" />);
    const links = extrairLinks(html);

    expect(html).toContain('aria-label="Navegação principal mobile"');
    expect(links).toHaveLength(4);
    expect(links.map((l) => l.href)).toEqual(['/', '/transacoes', '/contas', '/importar']);
    expect(links.every((l) => l.className.includes('min-h-[56px]'))).toBe(true);
    expect(links.map((l) => l.ariaCurrent)).toEqual(['page', null, null, null]);
  });

  it.each([
    { atual: '/', esperado: ['page', null, null, null] },
    { atual: '/transacoes/123', esperado: [null, 'page', null, null] },
    { atual: '/contasx', esperado: [null, null, null, null] },
    { atual: '/importar/revisar', esperado: [null, null, null, 'page'] },
    { atual: '', esperado: [null, null, null, null] },
  ])('NavegacaoMobile marca corretamente atual="$atual"', ({ atual, esperado }) => {
    const html = renderToStaticMarkup(<NavegacaoMobile atual={atual} />);
    const links = extrairLinks(html);

    expect(links.map((l) => l.ariaCurrent)).toEqual(esperado);
  });

  it('Navegacao desktop compensa recorte de foco (-m-1 p-1) e mantém alvos >= 44px', () => {
    const html = renderToStaticMarkup(<Navegacao atual="/" />);
    const links = extrairLinks(html);

    expect(html).toContain('aria-label="Principal"');
    expect(html).toContain('-m-1');
    expect(html).toContain('p-1');
    expect(links.every((l) => l.className.includes('min-h-[44px]'))).toBe(true);
  });
});

describe('QA T2.5b: Cabecalho (variações de sincronização e prévia)', () => {
  it('sem statusSincronizacao não renderiza área de sincronização nem botão', () => {
    const html = renderToStaticMarkup(<Cabecalho />);

    expect(html).toContain('Meu Financeiro');
    expect(html).not.toContain('Sincronizar agora');
    expect(html).not.toContain('<button');
  });

  it('com statusSincronizacao e emPrevia marca aria-disabled="true" no botão', () => {
    const html = renderToStaticMarkup(
      <Cabecalho statusSincronizacao="Sincronizado hoje, 06:12" emPrevia />,
    );

    expect(html).toContain('Sincronizado hoje, 06:12');
    expect(html).toMatch(/<button\b[^>]*type="button"[^>]*aria-disabled="true"[^>]*>/);
    expect(html).toContain('Sincronizar agora');
    expect(html).toContain('min-h-[44px]');
  });

  it('com statusSincronizacao sem emPrevia não define aria-disabled="true"', () => {
    const html = renderToStaticMarkup(<Cabecalho statusSincronizacao="Sincronizado hoje, 07:00" />);

    expect(html).toContain('Sincronizado hoje, 07:00');
    expect(html).toContain('Sincronizar agora');
    expect(html).not.toContain('aria-disabled="true"');
  });
});
