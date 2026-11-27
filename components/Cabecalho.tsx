import Link from 'next/link';
import { Logo } from './Logo';
import { NavegacaoAtual } from './NavegacaoAtual';

export interface CabecalhoProps {
  statusSincronizacao?: string;
  emPrevia?: boolean;
}

export function Cabecalho({ statusSincronizacao, emPrevia = false }: CabecalhoProps = {}) {
  return (
    <header className="flex flex-wrap items-center gap-x-10 gap-y-2 border-b border-borda px-4 py-3.5 sm:px-10">
      <Link href="/" className="inline-flex min-h-[44px] shrink-0 items-center no-underline">
        <Logo />
      </Link>
      <div className="hidden sm:flex sm:min-w-0 sm:flex-1">
        <NavegacaoAtual />
      </div>
      {statusSincronizacao ? (
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
          <span className="text-[13px] text-texto-suave">{statusSincronizacao}</span>
          <button
            type="button"
            aria-disabled={emPrevia ? 'true' : undefined}
            title={emPrevia ? 'Disponível após a integração com MeuPluggy (E3)' : undefined}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border-[1.5px] border-primaria bg-transparent px-[18px] text-[14px] font-semibold text-primaria"
          >
            Sincronizar agora
          </button>
        </div>
      ) : null}
    </header>
  );
}
