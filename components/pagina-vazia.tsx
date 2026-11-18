import type { ReactNode } from 'react';

export function PaginaVazia({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-10 sm:py-10">
      <h1 className="font-titulo m-0 text-[40px] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[56px]">
        {titulo}
      </h1>
      <p className="text-texto-3 mt-4 max-w-[62ch]">{children}</p>
    </main>
  );
}
