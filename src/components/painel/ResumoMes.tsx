import Link from 'next/link';
import type { ResumoPainelVM } from '../contratos/ui';

export function ResumoMes({ vm }: { vm: ResumoPainelVM }) {
  return (
    <section aria-label="Resumo do mês">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="font-titulo text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] text-texto sm:text-[56px]">
          {vm.mesTitulo}
        </h1>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Mês anterior"
            disabled={!vm.podeVoltarMes}
            className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-borda text-texto transition-colors ${
              vm.podeVoltarMes
                ? 'cursor-pointer bg-superficie hover:bg-superficie-sutil'
                : 'cursor-not-allowed bg-transparent opacity-45'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M11 3 5 9l6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            disabled={!vm.podeAvancarMes}
            className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-borda text-texto transition-colors ${
              vm.podeAvancarMes
                ? 'cursor-pointer bg-superficie hover:bg-superficie-sutil'
                : 'cursor-not-allowed bg-transparent opacity-45'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="m7 3 6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <p className="mt-1.5 text-texto-suave">{vm.subtitulo}</p>

      <div className="mt-9 flex flex-wrap items-end gap-x-10 gap-y-5 sm:gap-x-14">
        <div className="min-w-0">
          <div className="text-[14px] text-texto-suave">Sobrou até agora</div>
          <div className="font-titulo text-[38px] font-semibold leading-[1.1] tracking-[-0.02em] text-texto sm:text-[52px]">
            {vm.sobrouFormatado}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[14px] text-texto-suave">Entrou</div>
          <div className="font-titulo text-[26px] font-semibold leading-[1.2] text-confere sm:text-[30px]">
            {vm.entrouFormatado}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[14px] text-texto-suave">Saiu</div>
          <div className="font-titulo text-[26px] font-semibold leading-[1.2] text-texto sm:text-[30px]">
            {vm.saiuFormatado}
          </div>
        </div>
      </div>

      {vm.notaCaixinhas ? (
        <p className="mt-[18px] max-w-[62ch] text-texto">
          {vm.notaCaixinhas}{' '}
          <Link href={vm.hrefCaixinhas} className="font-medium text-primaria hover:underline">
            Ver caixinhas
          </Link>
        </p>
      ) : null}
    </section>
  );
}
