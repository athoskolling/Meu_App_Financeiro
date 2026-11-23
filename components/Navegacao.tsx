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

export function Navegacao({ atual }: { atual: string }) {
  return (
    <nav
      aria-label="Principal"
      className="flex flex-1 min-w-0 max-w-full items-center gap-x-7 overflow-x-auto"
    >
      {ITENS_NAVEGACAO.map(({ href, rotulo }) => {
        const ativo = estaAtivo(atual, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? 'page' : undefined}
            className={`inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap border-b-2 py-3 text-[15px] no-underline transition-colors ${
              ativo
                ? 'border-primaria font-semibold text-texto'
                : 'border-transparent font-medium text-texto-suave hover:text-texto'
            }`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
