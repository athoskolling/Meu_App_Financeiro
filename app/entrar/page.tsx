import type { Metadata } from 'next';
import { Marca } from '../../components/marca';

export const metadata: Metadata = {
  title: 'Entrar no Meu Financeiro',
};

export default function Entrar() {
  return (
    <div className="flex min-h-screen flex-col px-5 py-8 sm:p-10">
      <div className="font-titulo flex items-center gap-2.5 text-[21px] font-bold tracking-[-0.01em]">
        <Marca />
      </div>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-wrap items-center justify-center gap-x-24 gap-y-12 py-10">
        <div className="max-w-[560px] flex-[1_1_420px]">
          <h1 className="font-titulo m-0 text-[44px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[68px]">
            Suas contas, conferidas.
          </h1>
          <p className="text-texto-2 mt-6 max-w-[46ch] text-[18px]">
            Santander, Nubank e Caju num só lugar. Cada saldo bate com o do banco, ou o app avisa
            que não bate.
          </p>
          <span className="font-titulo border-confere text-confere mt-7 inline-block -rotate-3 rounded-md border-2 px-4 py-1 text-[22px] font-bold">
            Confere
          </span>
        </div>

        <section
          aria-labelledby="entrar"
          className="bg-superficie border-borda max-w-[400px] flex-[1_1_320px] rounded-[14px] border p-8"
        >
          <h2 id="entrar" className="font-titulo m-0 text-[26px] font-semibold">
            Entrar
          </h2>
          {/* T2.4 liga o login */}
          <button
            type="button"
            className="bg-primaria mt-5 min-h-12 w-full cursor-pointer rounded-lg border-0 text-base font-semibold text-white"
          >
            Entrar com Google
          </button>
          <p className="text-texto-3 mt-[18px] mb-0 text-sm">
            Só o e-mail do dono do app tem acesso. Qualquer outra conta Google é recusada.
          </p>
        </section>
      </main>
    </div>
  );
}
