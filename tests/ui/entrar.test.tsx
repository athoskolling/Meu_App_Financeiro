import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PaginaEntrar from '../../app/entrar/page';

async function renderizarEntrar(erro?: string) {
  const elemento = await PaginaEntrar({
    searchParams: Promise.resolve(erro === undefined ? {} : { erro }),
  });
  return renderToStaticMarkup(elemento);
}

describe('PaginaEntrar', () => {
  it('renderiza formulário POST para /api/auth/login sem alerta quando não há erro', async () => {
    const html = await renderizarEntrar();

    expect(html).toMatch(
      /<form[^>]*method="post"[^>]*action="\/api\/auth\/login"|<form[^>]*action="\/api\/auth\/login"[^>]*method="post"/i,
    );
    expect(html).toMatch(
      /<button[^>]*type="submit"[^>]*>[\s\S]*Entrar com Google[\s\S]*<\/button>/,
    );
    expect(html).not.toContain('role="alert"');
  });

  it('exibe alerta fixo quando erro=recusado', async () => {
    const html = await renderizarEntrar('recusado');

    expect(html).toContain('role="alert"');
    expect(html).toContain('Essa conta Google não tem acesso a este app.');
  });

  it('exibe alerta fixo quando erro=falha', async () => {
    const html = await renderizarEntrar('falha');

    expect(html).toContain('role="alert"');
    expect(html).toContain('Não foi possível entrar. Tente de novo.');
  });

  it('ignora códigos desconhecidos e não reflete valor da URL no HTML', async () => {
    const html = await renderizarEntrar('<script>alert(1)</script>');

    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('alert(1)');
    expect(html).not.toContain('<script>');
  });

  it('exibe os textos principais do design', async () => {
    const html = await renderizarEntrar();

    expect(html).toContain('Suas contas, conferidas.');
    expect(html).toContain('Entrar');
    expect(html).toContain('Confere');
    expect(html).toContain(
      'Só o e-mail do dono do app tem acesso. Qualquer outra conta Google é recusada.',
    );
  });
});
