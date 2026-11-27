import type { ReactNode } from 'react';
import { Cabecalho } from '../../components/Cabecalho';
import { NavegacaoAtual } from '../../components/NavegacaoAtual';
import { FaixaPrevia } from '../../components/ui/FaixaPrevia';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Cabecalho statusSincronizacao="Sincronizado hoje, 06:12" emPrevia />
      <FaixaPrevia />
      <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-24 sm:px-10 sm:py-10">
        {children}
      </main>
      <NavegacaoAtual variante="mobile" />
    </div>
  );
}
