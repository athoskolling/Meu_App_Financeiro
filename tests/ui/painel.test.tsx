import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PaginaPainel, { metadata } from '../../app/(app)/page';
import { ResumoMes } from '../../components/painel/ResumoMes';
import { GraficoGastoDiario } from '../../components/painel/GraficoGastoDiario';
import { ListaCategorias } from '../../components/painel/ListaCategorias';
import { UltimasMovimentacoes } from '../../components/painel/UltimasMovimentacoes';
import { CardContasConferidas } from '../../components/painel/CardContasConferidas';
import { PAINEL_PREVIA } from '../../components/previa/painel';

describe('T4.3a: Tela Painel e componentes puros', () => {
  it('1. renderiza a página Painel com a fixture padrão de outubro/2026', () => {
    expect(metadata.title).toBe('Painel · Meu Financeiro');

    const html = renderToStaticMarkup(<PaginaPainel />);

    expect(html).toMatch(/<h1\b[^>]*>Outubro de 2026<\/h1>/);
    expect(html).toContain('Dia 14 de 31. Valores de todas as contas, já conferidos.');
    expect(html).toContain('Sobrou até agora');
    expect(html).toContain('R$ 1.325,48');
    expect(html).toContain('Entrou');
    expect(html).toContain('+R$ 3.200,00');
    expect(html).toContain('Saiu');
    expect(html).toContain('−R$ 1.874,52');
    expect(html).toMatch(/<a\b[^>]*href="\/contas"[^>]*>Ver caixinhas<\/a>/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('2. GraficoGastoDiario renderiza role="img", aria-label e 31 barras com tokens', () => {
    const html = renderToStaticMarkup(
      <GraficoGastoDiario
        maiorGastoTexto={PAINEL_PREVIA.maiorGastoTexto}
        descricaoGraficoDiario={PAINEL_PREVIA.descricaoGraficoDiario}
        diasGasto={PAINEL_PREVIA.diasGasto}
      />,
    );

    expect(html).toContain('Gasto por dia');
    expect(html).toContain('Maior gasto: dia 7, R$ 412,00');
    expect(html).toContain('role="img"');
    expect(html).toContain(`aria-label="${PAINEL_PREVIA.descricaoGraficoDiario}"`);

    const barras = [...html.matchAll(/data-dia="\d+"/g)];
    expect(barras).toHaveLength(31);
    expect(html).toContain('bg-primaria');
    expect(html).toContain('bg-texto');
    expect(html).toContain('bg-barra-futuro');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('>hoje<');
  });

  it('3. ListaCategorias renderiza as 6 categorias da fixture com valores formatados', () => {
    const html = renderToStaticMarkup(<ListaCategorias categorias={PAINEL_PREVIA.categorias} />);

    expect(html).toContain('Para onde foi');
    const itens = [...html.matchAll(/<li\b/g)];
    expect(itens).toHaveLength(6);

    for (const categoria of PAINEL_PREVIA.categorias) {
      expect(html).toContain(categoria.nome);
      expect(html).toContain(categoria.valorFormatado);
      expect(html).toContain(`width:${categoria.percentualLargura}%`);
    }
  });

  it('4. UltimasMovimentacoes renderiza link /transacoes e badge "Guardado, fora dos gastos"', () => {
    const html = renderToStaticMarkup(
      <UltimasMovimentacoes ultimasMovimentacoes={PAINEL_PREVIA.ultimasMovimentacoes} />,
    );

    expect(html).toContain('Últimas movimentações');
    expect(html).toMatch(/<a\b[^>]*href="\/transacoes"[^>]*>Ver todas<\/a>/);
    expect(html).toContain('Zaffari Supermercados');
    expect(html).toContain('Para a caixinha Viagem');
    expect(html).toContain('Guardado, fora dos gastos');
    expect(html).toContain('bg-primaria-fundo');
    expect(html).toContain('text-primaria');
    expect(html).toContain('text-texto-suave');
  });

  it('5. CardContasConferidas renderiza <aside>, selos Confere/Verificar e link /importar', () => {
    const html = renderToStaticMarkup(
      <CardContasConferidas
        contasConferidas={PAINEL_PREVIA.contasConferidas}
        pendencias={PAINEL_PREVIA.pendencias}
      />,
    );

    expect(html).toMatch(/<aside\b[^>]*aria-label="Conferência das contas"[^>]*>/);
    expect(html).toContain('Contas conferidas');
    expect(html).toContain('Confere');
    expect(html).toContain('Verificar');
    expect(html).toContain('Precisa de você');
    expect(html).toContain('href="/transacoes?conta=Nubank+conta"');
    expect(html).toContain('href="/importar"');
  });

  it('6. estado vazio (sem categorias, movimentações, contas ou pendências) renderiza sem quebrar', () => {
    const htmlResumo = renderToStaticMarkup(
      <ResumoMes
        vm={{
          ...PAINEL_PREVIA,
          podeVoltarMes: false,
          podeAvancarMes: false,
          notaCaixinhas: '',
        }}
      />,
    );
    const htmlGrafico = renderToStaticMarkup(
      <GraficoGastoDiario
        maiorGastoTexto="Nenhum gasto registrado"
        descricaoGraficoDiario="Nenhum gasto registrado neste mês."
        diasGasto={[]}
      />,
    );
    const htmlCategorias = renderToStaticMarkup(<ListaCategorias categorias={[]} />);
    const htmlMovimentacoes = renderToStaticMarkup(
      <UltimasMovimentacoes ultimasMovimentacoes={[]} />,
    );
    const htmlCard = renderToStaticMarkup(
      <CardContasConferidas contasConferidas={[]} pendencias={[]} />,
    );

    expect(htmlResumo).toContain('Outubro de 2026');
    expect(htmlGrafico).toContain('role="img"');
    expect(htmlCategorias).toContain('Nenhum gasto registrado neste mês.');
    expect(htmlMovimentacoes).toContain('Nenhuma movimentação registrada neste mês.');
    expect(htmlCard).toContain('Nenhuma conta cadastrada.');
    expect(htmlCard).toContain('Tudo em dia por aqui.');
  });
});
