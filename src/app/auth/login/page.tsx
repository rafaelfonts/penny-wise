import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            Penny Wise
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sua plataforma de análise financeira com IA
          </p>
        </div>

        <AuthForm mode="login" />

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/"
            className="transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
