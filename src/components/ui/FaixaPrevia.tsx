import type { ReactNode } from 'react';

export function FaixaPrevia({ children }: { children?: ReactNode }) {
  return (
    <div
      role="status"
      className="border-b border-borda bg-superficie-sutil px-4 py-2 text-[13px] text-texto-medio sm:px-10"
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span>
          Prévia visual com dados fictícios. As regras financeiras e conexões reais entram nas
          próximas etapas.
        </span>
        {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
      </div>
    </div>
  );
}
