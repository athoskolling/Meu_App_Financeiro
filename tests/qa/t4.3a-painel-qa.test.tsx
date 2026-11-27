import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PaginaPainel, { metadata } from '../../app/(app)/page';
import { ResumoMes } from '../../components/painel/ResumoMes';
import { GraficoGastoDiario } from '../../components/painel/GraficoGastoDiario';
import { ListaCategorias } from '../../components/painel/ListaCategorias';
import { UltimasMovimentacoes } from '../../components/painel/UltimasMovimentacoes';
import { CardContasConferidas } from '../../components/painel/CardContasConferidas';
import { PAINEL_PREVIA } from '../../components/previa/painel';
import type { DiaGastoVM } from '../../components/contratos/ui';

function extrairBotaoPorAriaLabel(html: string, ariaLabel: string): string {
  const regex = new RegExp(`<button\\b[^>]*aria-label="${ariaLabel}"[^>]*>`, 'i');
  const match = html.match(regex);
  return match?.[0] ?? '';
}

describe('QA T4.3a: ResumoMes (bordas de navegação e valores)', () => {
  it('aplica aria-label, dimensões 44x44 e estados disabled conforme podeVoltarMes/podeAvancarMes', () => {
    const htmlAmbosDesabilitados = renderToStaticMarkup(
      <ResumoMes
        vm={{
          ...PAINEL_PREVIA,
          podeVoltarMes: false,
          podeAvancarMes: false,
        }}
      />,
    );

    const btnAnteriorOff = extrairBotaoPorAriaLabel(htmlAmbosDesabilitados, 'Mês anterior');
    const btnProximoOff = extrairBotaoPorAriaLabel(htmlAmbosDesabilitados, 'Próximo mês');

    expect(btnAnteriorOff).toContain('w-[44px]');
    expect(btnAnteriorOff).toContain('h-[44px]');
    expect(btnAnteriorOff).toMatch(/\bdisabled(?:="")?/);
    expect(btnProximoOff).toContain('w-[44px]');
    expect(btnProximoOff).toContain('h-[44px]');
    expect(btnProximoOff).toMatch(/\bdisabled(?:="")?/);

    const htmlAmbosHabilitados = renderToStaticMarkup(
      <ResumoMes
        vm={{
          ...PAINEL_PREVIA,
          podeVoltarMes: true,
          podeAvancarMes: true,
        }}
      />,
    );

    const btnAnteriorOn = extrairBotaoPorAriaLabel(htmlAmbosHabilitados, 'Mês anterior');
    const btnProximoOn = extrairBotaoPorAriaLabel(htmlAmbosHabilitados, 'Próximo mês');

    expect(btnAnteriorOn).not.toMatch(/\bdisabled\b/);
    expect(btnProximoOn).not.toMatch(/\bdisabled\b/);
  });

  it('renderiza valores zero e negativos exatamente como vêm no ViewModel e oculta nota de caixinhas quando vazia', () => {
    const html = renderToStaticMarkup(
      <ResumoMes
        vm={{
          ...PAINEL_PREVIA,
          mesTitulo: 'Fevereiro de 2024',
          sobrouFormatado: '−R$ 0,01',
          entrouFormatado: 'R$ 0,00',
          saiuFormatado: '−R$ 0,01',
          notaCaixinhas: '',
        }}
      />,
    );

    expect(html).toContain('Fevereiro de 2024');
    expect(html).toContain('−R$ 0,01');
    expect(html).toContain('R$ 0,00');
    expect(html).not.toContain('Ver caixinhas');
  });
});

describe('QA T4.3a: GraficoGastoDiario (31 barras, tokens e bordas de calendário)', () => {
  it('renderiza exatamente 31 barras na prévia: 1 bg-texto (hoje), 13 bg-primaria e 17 bg-barra-futuro', () => {
    const html = renderToStaticMarkup(
      <GraficoGastoDiario
        maiorGastoTexto={PAINEL_PREVIA.maiorGastoTexto}
        descricaoGraficoDiario={PAINEL_PREVIA.descricaoGraficoDiario}
        diasGasto={PAINEL_PREVIA.diasGasto}
      />,
    );

    const barras = [...html.matchAll(/<div\b[^>]*data-dia="\d+"[^>]*>/g)].map((m) => m[0]);
    expect(barras).toHaveLength(31);

    const hoje = barras.filter((b) => /\bbg-texto\b/.test(b));
    const passadas = barras.filter((b) => /\bbg-primaria\b/.test(b));
    const futuras = barras.filter((b) => /\bbg-barra-futuro\b/.test(b));

    expect(hoje).toHaveLength(1);
    expect(hoje[0]).toContain('data-dia="14"');
    expect(passadas).toHaveLength(13);
    expect(futuras).toHaveLength(17);
  });

  it('suporta mês de 29 dias (ano bissexto) e lista vazia sem quebrar', () => {
    const fevBissexto: DiaGastoVM[] = Array.from({ length: 29 }, (_, idx) => ({
      dia: idx + 1,
      alturaPx: idx === 28 ? 42 : 3,
      estado: idx === 28 ? 'hoje' : 'passado',
      rotuloEixo: idx === 28 ? '29' : undefined,
    }));

    const htmlBissexto = renderToStaticMarkup(
      <GraficoGastoDiario
        maiorGastoTexto="Maior gasto: dia 29, R$ 150,00"
        descricaoGraficoDiario="Gasto por dia em fevereiro bissexto."
        diasGasto={fevBissexto}
      />,
    );

    expect([...htmlBissexto.matchAll(/data-dia="\d+"/g)]).toHaveLength(29);
    expect(htmlBissexto).toContain('height:42px');
    expect(htmlBissexto).toContain('>29<');

    const htmlVazio = renderToStaticMarkup(
      <GraficoGastoDiario
        maiorGastoTexto="Sem gastos"
        descricaoGraficoDiario="Nenhum gasto registrado."
        diasGasto={[]}
      />,
    );

    expect(htmlVazio).toContain('role="img"');
    expect([...htmlVazio.matchAll(/data-dia="\d+"/g)]).toHaveLength(0);
    expect(htmlVazio).not.toContain('aria-hidden="true"');
  });
});

describe('QA T4.3a: ListaCategorias (larguras, valores e estado vazio)', () => {
  it('exibe mensagem limpa quando a lista de categorias está vazia', () => {
    const html = renderToStaticMarkup(<ListaCategorias categorias={[]} />);
    expect(html).toContain('Para onde foi');
    expect(html).toContain('Nenhum gasto registrado neste mês.');
    expect(html).not.toContain('<ul');
  });

  it('aplica exatamente os valores formatados e percentuais de largura recebidos (incluindo 0% e decimais)', () => {
    const html = renderToStaticMarkup(
      <ListaCategorias
        categorias={[
          { nome: 'Moradia', percentualLargura: 100, valorFormatado: 'R$ 2.500,00' },
          { nome: 'Centavos', percentualLargura: 0.4, valorFormatado: 'R$ 0,99' },
          { nome: 'Zerada', percentualLargura: 0, valorFormatado: 'R$ 0,00' },
        ]}
      />,
    );

    expect(html).toContain('width:100%');
    expect(html).toContain('R$ 2.500,00');
    expect(html).toContain('width:0.4%');
    expect(html).toContain('R$ 0,99');
    expect(html).toContain('width:0%');
    expect(html).toContain('R$ 0,00');
  });
});

describe('QA T4.3a: UltimasMovimentacoes (cores por tipo e estado vazio)', () => {
  it('aplica text-confere para receita, text-texto para despesa e text-texto-suave para fora_dos_gastos', () => {
    const html = renderToStaticMarkup(
      <UltimasMovimentacoes
        ultimasMovimentacoes={[
          {
            id: 'r1',
            dataCurta: '1 out',
            descricao: 'Salário',
            metadados: 'Santander',
            valorFormatado: '+R$ 3.200,00',
            tipo: 'receita',
          },
          {
            id: 'd1',
            dataCurta: '2 out',
            descricao: 'Mercado',
            metadados: 'Nubank cartão',
            valorFormatado: '−R$ 50,00',
            tipo: 'despesa',
          },
          {
            id: 'f1',
            dataCurta: '3 out',
            descricao: 'Caixinha',
            metadados: 'Nubank conta',
            valorFormatado: '−R$ 400,00',
            tipo: 'fora_dos_gastos',
            badge: 'Guardado, fora dos gastos',
          },
        ]}
      />,
    );

    expect(html).toMatch(/text-confere[^>]*>\+R\$ 3\.200,00</);
    expect(html).toMatch(/text-texto[^>]*>−R\$ 50,00</);
    expect(html).toMatch(/text-texto-suave[^>]*>−R\$ 400,00</);
    expect(html).toContain('Guardado, fora dos gastos');
  });

  it('exibe estado vazio limpo mantendo o link /transacoes', () => {
    const html = renderToStaticMarkup(<UltimasMovimentacoes ultimasMovimentacoes={[]} />);
    expect(html).toContain('Nenhuma movimentação registrada neste mês.');
    expect(html).toMatch(/<a\b[^>]*href="\/transacoes"[^>]*>Ver todas<\/a>/);
    expect(html).not.toContain('<ul');
  });
});

describe('QA T4.3a: CardContasConferidas (pendências aviso/neutro e estados vazios)', () => {
  it('renderiza pendências aviso e neutro com estilos e links corretos', () => {
    const html = renderToStaticMarkup(
      <CardContasConferidas
        contasConferidas={[
          {
            id: 'c1',
            nome: 'Santander',
            tipo: 'Conta corrente',
            saldoFormatado: 'R$ 0,00',
            estadoSelo: 'nao_confere',
            nota: 'Diferença',
          },
          {
            id: 'c2',
            nome: 'Caju',
            tipo: 'Benefício',
            saldoFormatado: 'R$ 100,00',
            estadoSelo: 'aguardando',
            nota: 'Aguardando print',
          },
        ]}
        pendencias={PAINEL_PREVIA.pendencias}
      />,
    );

    expect(html).toContain('Não confere');
    expect(html).toContain('Aguardando');
    expect(html).toContain('bg-aviso-fundo');
    expect(html).toContain('text-aviso-texto');
    expect(html).toContain('bg-superficie-sutil');
    expect(html).toContain('href="/transacoes?conta=Nubank+conta"');
    expect(html).toContain('href="/importar"');
  });

  it('renderiza estado limpo sem contas e sem pendências', () => {
    const html = renderToStaticMarkup(
      <CardContasConferidas contasConferidas={[]} pendencias={[]} />,
    );

    expect(html).toContain('Nenhuma conta cadastrada.');
    expect(html).toContain('Tudo em dia por aqui.');
    expect(html).not.toContain('<ul');
  });
});

describe('QA T4.3a: PaginaPainel (metadata, links e ausência de hex)', () => {
  it('expõe metadata.title e todos os links esperados sem cores hex literais', () => {
    expect(metadata.title).toBe('Painel · Meu Financeiro');

    const html = renderToStaticMarkup(<PaginaPainel />);

    expect(html).toContain('href="/contas"');
    expect(html).toContain('href="/transacoes"');
    expect(html).toContain('href="/transacoes?conta=Nubank+conta"');
    expect(html).toContain('href="/importar"');
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
