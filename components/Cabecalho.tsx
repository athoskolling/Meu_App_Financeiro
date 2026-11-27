import Link from 'next/link';
import { Logo } from './Logo';
import { NavegacaoAtual } from './NavegacaoAtual';

export function Cabecalho() {
  return (
    <header className="flex flex-wrap items-center gap-x-10 gap-y-1 border-b border-borda px-4 py-3.5 sm:px-10">
      <Link href="/" className="inline-flex min-h-[44px] shrink-0 items-center no-underline">
        <Logo />
      </Link>
      <NavegacaoAtual />
    </header>
  );
}
