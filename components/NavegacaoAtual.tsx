'use client';

import { usePathname } from 'next/navigation';
import { Navegacao } from './Navegacao';

export function NavegacaoAtual() {
  const pathname = usePathname();
  return <Navegacao atual={pathname ?? '/'} />;
}
