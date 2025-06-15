import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { replaceConsoleLog } from '@/lib/utils/logger';

// Initialize professional logging in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  replaceConsoleLog();
}

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Penny Wise - Análise Financeira com IA',
  description:
    'Plataforma inteligente para análise de mercado financeiro, chat com IA especializada e insights personalizados.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} ${inter.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
