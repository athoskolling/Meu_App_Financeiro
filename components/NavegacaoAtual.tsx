'use client';

import { usePathname } from 'next/navigation';
import { Navegacao } from './Navegacao';
import { NavegacaoMobile } from './NavegacaoMobile';

export function NavegacaoAtual({ variante = 'desktop' }: { variante?: 'desktop' | 'mobile' }) {
  const pathname = usePathname();
  const atual = pathname ?? '';

  if (variante === 'mobile') {
    return <NavegacaoMobile atual={atual} />;
  }

  return <Navegacao atual={atual} />;
}
