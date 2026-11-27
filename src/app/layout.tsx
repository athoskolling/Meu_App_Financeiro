import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-bricolage',
});

const ibmPlex = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
});

export const metadata: Metadata = {
  title: 'Meu Financeiro',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${ibmPlex.variable}`}>
      <body className="min-h-screen bg-fundo text-texto font-texto text-[15px] leading-normal antialiased">
        {children}
      </body>
    </html>
  );
}
