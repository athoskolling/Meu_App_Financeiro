import Link from 'next/link';

const ITENS_NAVEGACAO = [
  { href: '/', rotulo: 'Painel' },
  { href: '/transacoes', rotulo: 'Transações' },
  { href: '/contas', rotulo: 'Contas' },
  { href: '/importar', rotulo: 'Importar' },
] as const;

function estaAtivo(atual: string, href: string): boolean {
  if (href === '/') {
    return atual === '/';
  }
  return atual === href || atual.startsWith(`${href}/`);
}

export function NavegacaoMobile({ atual }: { atual: string }) {
  return (
    <nav
      aria-label="Navegação principal mobile"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-borda bg-superficie sm:hidden"
    >
      {ITENS_NAVEGACAO.map(({ href, rotulo }) => {
        const ativo = estaAtivo(atual, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? 'page' : undefined}
            className={`flex min-h-[56px] flex-1 items-center justify-center text-[14px] no-underline transition-colors ${
              ativo
                ? 'font-semibold text-texto shadow-[inset_0_3px_0_0_var(--color-primaria)]'
                : 'font-medium text-texto-suave hover:text-texto'
            }`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
