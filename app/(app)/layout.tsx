import type { ReactNode } from 'react';
import { Cabecalho } from '../../components/Cabecalho';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Cabecalho />
      <main className="mx-auto w-full max-w-[1200px] p-4 sm:p-10">{children}</main>
    </div>
  );
}
