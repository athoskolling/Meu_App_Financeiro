import Link from 'next/link';
import type { MovimentacaoRecenteVM } from '../contratos/ui';

const CLASSE_VALOR_MOVIMENTACAO: Record<MovimentacaoRecenteVM['tipo'], string> = {
  receita: 'text-confere',
  despesa: 'text-texto',
  fora_dos_gastos: 'text-texto-suave',
};

export function UltimasMovimentacoes({
  ultimasMovimentacoes,
}: {
  ultimasMovimentacoes: MovimentacaoRecenteVM[];
}) {
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-titulo text-[24px] font-semibold text-texto">Últimas movimentações</h2>
        <Link href="/transacoes" className="font-medium text-primaria hover:underline">
          Ver todas
        </Link>
      </div>

      {ultimasMovimentacoes.length === 0 ? (
        <p className="mt-3 text-texto-suave">Nenhuma movimentação registrada neste mês.</p>
      ) : (
        <ul className="mt-3 list-none p-0">
          {ultimasMovimentacoes.map((mov) => (
            <li
              key={mov.id}
              className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-borda py-3.5 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:gap-4"
            >
              <span className="text-[14px] whitespace-nowrap text-texto-suave">
                {mov.dataCurta}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-texto">{mov.descricao}</span>
                <span className="block text-[13px] text-texto-suave">{mov.metadados}</span>
                {mov.badge ? (
                  <span className="mt-1 inline-block rounded bg-primaria-fundo px-2 py-0.5 text-[12px] font-semibold text-primaria">
                    {mov.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={`text-right font-semibold whitespace-nowrap ${CLASSE_VALOR_MOVIMENTACAO[mov.tipo]}`}
              >
                {mov.valorFormatado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
