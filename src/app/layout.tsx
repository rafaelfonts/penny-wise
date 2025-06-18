import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { replaceConsoleLog } from '@/lib/utils/logger';
import { checkApiAvailability } from '@/lib/utils/env-validation';

// Initialize professional logging in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  replaceConsoleLog();
}

// Check API availability at startup
const apiStatus = checkApiAvailability();
if (apiStatus.hasIssues && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ API Configuration Issues Detected:');
  apiStatus.issues.forEach(issue => console.warn(`  - ${issue}`));
  console.warn('  Check your .env.local file for missing API keys');
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
  keywords: ['análise financeira', 'IA', 'mercado', 'investimentos', 'chat', 'bolsa'],
  authors: [{ name: 'Penny Wise Team' }],
  openGraph: {
    title: 'Penny Wise - Análise Financeira com IA',
    description: 'Plataforma inteligente para análise de mercado financeiro',
    type: 'website',
  },
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
  },
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
