import type { Metadata } from 'next';
import { CardContasConferidas } from '../../components/painel/CardContasConferidas';
import { GraficoGastoDiario } from '../../components/painel/GraficoGastoDiario';
import { ListaCategorias } from '../../components/painel/ListaCategorias';
import { ResumoMes } from '../../components/painel/ResumoMes';
import { UltimasMovimentacoes } from '../../components/painel/UltimasMovimentacoes';
import { PAINEL_PREVIA } from '../../components/previa/painel';

export const metadata: Metadata = {
  title: 'Painel · Meu Financeiro',
};

export default function PaginaPainel() {
  const vm = PAINEL_PREVIA;

  return (
    <div className="flex flex-wrap gap-12">
      <div className="min-w-0 flex-[999_1_620px]">
        <ResumoMes vm={vm} />
        <GraficoGastoDiario
          maiorGastoTexto={vm.maiorGastoTexto}
          descricaoGraficoDiario={vm.descricaoGraficoDiario}
          diasGasto={vm.diasGasto}
        />
        <ListaCategorias categorias={vm.categorias} />
        <UltimasMovimentacoes ultimasMovimentacoes={vm.ultimasMovimentacoes} />
      </div>

      <CardContasConferidas contasConferidas={vm.contasConferidas} pendencias={vm.pendencias} />
    </div>
  );
}
