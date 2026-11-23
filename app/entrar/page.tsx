import type { Metadata } from 'next';
import { Logo } from '../../components/Logo';

export const metadata: Metadata = {
  title: 'Entrar · Meu Financeiro',
};

const MENSAGENS_ERRO = new Map<string, string>([
  ['recusado', 'Essa conta Google não tem acesso a este app.'],
  ['falha', 'Não foi possível entrar. Tente de novo.'],
]);

interface PaginaEntrarProps {
  searchParams: Promise<{ erro?: string | string[] }>;
}

export default async function PaginaEntrar({ searchParams }: PaginaEntrarProps) {
  const { erro } = await searchParams;
  const codigoErro = typeof erro === 'string' ? erro : undefined;
  const mensagemErro = codigoErro ? MENSAGENS_ERRO.get(codigoErro) : undefined;

  return (
    <div className="box-border flex min-h-screen flex-col p-4 sm:p-10">
      <header>
        <Logo />
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-wrap items-center justify-center gap-x-24 gap-y-12 py-8 sm:py-10">
        <div className="min-w-0 flex-1 basis-[420px] max-w-[560px]">
          <h1 className="font-titulo text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] text-texto sm:text-[54px] lg:text-[68px]">
            Suas contas, conferidas.
          </h1>
          <p className="mt-6 max-w-[46ch] text-[18px] text-texto-medio">
            Santander, Nubank e Caju num só lugar. Cada saldo bate com o do banco, ou o app avisa
            que não bate.
          </p>
          <span className="mt-7 inline-block -rotate-3 rounded-[6px] border-2 border-confere px-4 py-1 font-titulo text-[22px] font-bold text-confere">
            Confere
          </span>
        </div>

        <section
          aria-labelledby="entrar"
          className="w-full min-w-0 flex-1 basis-[320px] max-w-[400px] rounded-[14px] border border-borda bg-superficie p-6 sm:p-8"
        >
          <h2 id="entrar" className="font-titulo text-[26px] font-semibold text-texto">
            Entrar
          </h2>

          {mensagemErro ? (
            <p
              role="alert"
              className="mt-5 rounded-[8px] border border-erro-borda bg-erro-fundo px-3.5 py-2.5 text-[14px] font-medium text-erro"
            >
              {mensagemErro}
            </p>
          ) : null}

          <form method="post" action="/api/auth/login" className="mt-5">
            <button
              type="submit"
              className="min-h-[48px] w-full cursor-pointer rounded-[8px] border-0 bg-primaria px-4 text-[16px] font-semibold text-superficie transition-opacity hover:opacity-95"
            >
              Entrar com Google
            </button>
          </form>

          <p className="mt-[18px] text-[14px] text-texto-suave">
            Só o e-mail do dono do app tem acesso. Qualquer outra conta Google é recusada.
          </p>
        </section>
      </main>
    </div>
  );
}
