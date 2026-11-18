import Link from 'next/link';
import type { ReactNode } from 'react';
import { Marca } from '../../components/marca';
import { NavegacaoPrincipal } from '../../components/navegacao-principal';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-borda flex flex-wrap items-center gap-x-10 gap-y-1 border-b px-5 py-3 sm:px-10">
        <Link
          href="/"
          className="font-titulo text-texto flex min-h-11 items-center gap-2.5 text-[21px] font-bold tracking-[-0.01em] no-underline"
        >
          <Marca />
        </Link>
        <NavegacaoPrincipal />
      </header>
      {children}
    </>
  );
}
