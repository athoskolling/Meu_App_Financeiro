import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transações · Meu Financeiro',
};

export default function PaginaTransacoes() {
  return (
    <section>
      <h1 className="font-titulo text-3xl font-semibold tracking-[-0.02em] text-texto">
        Transações
      </h1>
      <p className="mt-2 text-texto-suave">Em construção.</p>
    </section>
  );
}
