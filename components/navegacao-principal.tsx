'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const itens = [
  { href: '/', rotulo: 'Painel' },
  { href: '/transacoes', rotulo: 'Transações' },
  { href: '/contas', rotulo: 'Contas' },
  { href: '/enviar', rotulo: 'Enviar print' },
];

export function NavegacaoPrincipal() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="-m-1 flex w-[calc(100%+0.5rem)] gap-x-4 overflow-x-auto p-1 sm:w-auto sm:flex-1 sm:gap-x-6"
    >
      {itens.map((item) => {
        const ativo = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? 'page' : undefined}
            className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center px-1 whitespace-nowrap border-b-2 no-underline ${
              ativo
                ? 'border-primaria text-texto font-semibold'
                : 'text-texto-3 border-transparent font-medium'
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
