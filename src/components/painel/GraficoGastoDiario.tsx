import type { DiaGastoVM } from '../contratos/ui';

const CLASSE_COR_DIA: Record<DiaGastoVM['estado'], string> = {
  passado: 'bg-primaria',
  hoje: 'bg-texto',
  futuro: 'bg-barra-futuro',
};

export interface GraficoGastoDiarioProps {
  maiorGastoTexto: string;
  descricaoGraficoDiario: string;
  diasGasto: DiaGastoVM[];
}

export function GraficoGastoDiario({
  maiorGastoTexto,
  descricaoGraficoDiario,
  diasGasto,
}: GraficoGastoDiarioProps) {
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-titulo text-[24px] font-semibold text-texto">Gasto por dia</h2>
        <span className="text-[14px] text-texto-suave">{maiorGastoTexto}</span>
      </div>

      <div
        role="img"
        aria-label={descricaoGraficoDiario}
        className="mt-5 flex h-[120px] items-end gap-[3px] border-b-2 border-texto sm:gap-[5px]"
      >
        {diasGasto.map((dia) => (
          <div
            key={dia.dia}
            data-dia={dia.dia}
            style={{ height: `${dia.alturaPx}px` }}
            className={`min-w-0 flex-1 ${CLASSE_COR_DIA[dia.estado]}`}
          />
        ))}
      </div>

      {diasGasto.length > 0 ? (
        <div
          aria-hidden="true"
          className="mt-1.5 flex gap-[3px] text-[12px] text-texto-suave sm:gap-[5px]"
        >
          {diasGasto.map((dia) => (
            <div key={dia.dia} className="min-w-0 flex-1 whitespace-nowrap">
              {dia.rotuloEixo ?? ''}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
