import Link from 'next/link';
import type { ContaConferidaVM, PendenciaPainelVM } from '../contratos/ui';
import { SeloConferencia } from '../ui/SeloConferencia';

export interface CardContasConferidasProps {
  contasConferidas: ContaConferidaVM[];
  pendencias: PendenciaPainelVM[];
}

export function CardContasConferidas({ contasConferidas, pendencias }: CardContasConferidasProps) {
  return (
    <aside
      aria-label="Conferência das contas"
      className="w-full max-w-[420px] flex-[1_1_320px] self-start rounded-[14px] border border-borda bg-superficie p-6 sm:p-7"
    >
      <h2 className="font-titulo text-[24px] font-semibold text-texto">Contas conferidas</h2>
      <p className="mt-1 text-[14px] text-texto-suave">
        A soma dos lançamentos precisa bater com o saldo do banco.
      </p>

      {contasConferidas.length === 0 ? (
        <p className="mt-4 border-t border-borda pt-4 text-[14px] text-texto-suave">
          Nenhuma conta cadastrada.
        </p>
      ) : (
        <ul className="mt-4 list-none p-0">
          {contasConferidas.map((conta) => (
            <li key={conta.id} className="border-t border-borda py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-texto">{conta.nome}</div>
                  <div className="text-[13px] text-texto-suave">{conta.tipo}</div>
                </div>
                <SeloConferencia estado={conta.estadoSelo} />
              </div>
              <div className="mt-1.5 font-titulo text-[24px] font-semibold text-texto">
                {conta.saldoFormatado}
              </div>
              <div className="text-[13px] text-texto-suave">{conta.nota}</div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3 border-t-2 border-texto pt-5 font-titulo text-[19px] font-semibold text-texto">
        Precisa de você
      </h3>

      {pendencias.length === 0 ? (
        <p className="mt-2 text-[14px] text-texto-suave">Tudo em dia por aqui.</p>
      ) : (
        <ul className="mt-2 flex list-none flex-col gap-2.5 p-0">
          {pendencias.map((pendencia) => {
            const isAviso = pendencia.destaque === 'aviso';
            return (
              <li
                key={pendencia.id}
                className={
                  isAviso
                    ? 'rounded-lg bg-aviso-fundo px-3.5 py-3 text-aviso-texto'
                    : 'rounded-lg border border-borda bg-superficie-sutil px-3.5 py-3 text-texto'
                }
              >
                <p className="m-0">{pendencia.mensagem}</p>
                <Link
                  href={pendencia.href}
                  className={`mt-0.5 block font-semibold hover:underline ${
                    isAviso ? 'text-aviso-texto' : 'text-primaria'
                  }`}
                >
                  {pendencia.rotuloLink}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
