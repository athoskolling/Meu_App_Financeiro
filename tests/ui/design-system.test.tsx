import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SeloConferencia } from '../../components/ui/SeloConferencia';
import { FaixaPrevia } from '../../components/ui/FaixaPrevia';
import { Navegacao } from '../../components/Navegacao';
import { NavegacaoMobile } from '../../components/NavegacaoMobile';
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

describe('SeloConferencia', () => {
  it.each([
    {
      estado: 'confere' as const,
      texto: 'Confere',
      classes: ['-rotate-3', 'border-confere', 'text-confere'],
    },
    {
      estado: 'verificar' as const,
      texto: 'Verificar',
      classes: ['-rotate-3', 'border-aviso', 'bg-aviso-fundo', 'text-aviso'],
    },
    {
      estado: 'nao_confere' as const,
      texto: 'Não confere',
      classes: ['-rotate-3', 'border-aviso', 'text-aviso'],
    },
    {
      estado: 'aguardando' as const,
      texto: 'Aguardando',
      classes: ['border-dashed', 'border-texto-suave', 'text-texto-medio'],
    },
  ])(
    'renderiza estado $estado com texto e tokens corretos sem hex',
    ({ estado, texto, classes }) => {
      const html = renderToStaticMarkup(<SeloConferencia estado={estado} />);

      expect(html).toContain(texto);
      expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      for (const classe of classes) {
        expect(html).toContain(classe);
      }
      if (estado === 'aguardando') {
        expect(html).not.toContain('-rotate-3');
      }
    },
  );
});

describe('FaixaPrevia', () => {
  it('renderiza role="status" com texto padrão de prévia fictícia e aceita children', () => {
    const html = renderToStaticMarkup(<FaixaPrevia />);
    expect(html).toContain('role="status"');
    expect(html).toContain(
      'Prévia visual com dados fictícios. As regras financeiras e conexões reais entram nas próximas etapas.',
    );

    const htmlComFilhos = renderToStaticMarkup(
      <FaixaPrevia>
        <a href="/importar/revisar?estado=confere">Saldo confere</a>
      </FaixaPrevia>,
    );
    expect(htmlComFilhos).toContain('Saldo confere');
  });
});

describe('Navegacao (T2.5b)', () => {
  it('não marca nenhum link com aria-current="page" quando atual=""', () => {
    const html = renderToStaticMarkup(<Navegacao atual="" />);
    const links = extrairLinks(html);

    expect(links).toHaveLength(4);
    expect(links.every((l) => l.ariaCurrent === null)).toBe(true);
  });

  it.each([
    { atual: '/', esperado: ['page', null, null, null] },
    { atual: '/transacoes/1', esperado: [null, 'page', null, null] },
    { atual: '/contasx', esperado: [null, null, null, null] },
    { atual: '/importar', esperado: [null, null, null, 'page'] },
  ])('mantém os casos originais da T2.5 para atual="$atual"', ({ atual, esperado }) => {
    const html = renderToStaticMarkup(<Navegacao atual={atual} />);
    const links = extrairLinks(html);

    expect(links.map((l) => l.ariaCurrent)).toEqual(esperado);
  });
});

describe('NavegacaoMobile', () => {
  it('marca apenas Importar em /importar/revisar com 4 links min-h-[56px] e indicador superior', () => {
    const html = renderToStaticMarkup(<NavegacaoMobile atual="/importar/revisar" />);
    const links = extrairLinks(html);

    expect(html).toContain('aria-label="Navegação principal mobile"');
    expect(links.map((l) => l.href)).toEqual(['/', '/transacoes', '/contas', '/importar']);
    expect(links.map((l) => l.ariaCurrent)).toEqual([null, null, null, 'page']);
    expect(links.every((l) => l.className.includes('min-h-[56px]'))).toBe(true);
    expect(links[3]?.className).toContain('shadow-[inset_0_3px_0_0_var(--color-primaria)]');
    expect(links[0]?.className).not.toContain('shadow-[inset_0_3px_0_0_var(--color-primaria)]');
  });
});

describe('Cabecalho (T2.5b)', () => {
  it('exibe Logo, status de sincronização e botão Sincronizar agora quando statusSincronizacao é passado', () => {
    const html = renderToStaticMarkup(
      <Cabecalho statusSincronizacao="Sincronizado hoje, 06:12" emPrevia />,
    );

    expect(html).toContain('Meu Financeiro');
    expect(html).toContain('Sincronizado hoje, 06:12');
    expect(html).toMatch(/<button\b[^>]*type="button"[^>]*>Sincronizar agora<\/button>/);
    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('title="Disponível após a integração com MeuPluggy (E3)"');
  });

  it('mantém compatibilidade sem statusSincronizacao (não exibe bloco de sincronização)', () => {
    const html = renderToStaticMarkup(<Cabecalho />);

    expect(html).toContain('Meu Financeiro');
    expect(html).not.toContain('Sincronizar');
    expect(html).not.toContain('Sincronizado');
  });
});
