import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel · Meu Financeiro',
};

export default function PaginaPainel() {
  return (
    <section>
      <h1 className="font-titulo text-3xl font-semibold tracking-[-0.02em] text-texto">Painel</h1>
      <p className="mt-2 text-texto-suave">Em construção.</p>
    </section>
  );
}
