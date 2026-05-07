'use client';

import axios from 'axios';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './login.css';

function extractApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const obj = data as {
    message?: string;
    detail?: Array<{ msg?: string }> | string;
  };

  if (obj.message) return obj.message;
  if (Array.isArray(obj.detail) && obj.detail.length) {
    return obj.detail.map((d) => d?.msg).filter(Boolean).join(' | ') || fallback;
  }
  if (typeof obj.detail === 'string') return obj.detail;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    const emailFromStorage =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem('last_login_email') ||
          window.sessionStorage.getItem('registered_email')
        : null;

    if (emailFromQuery) setEmail(emailFromQuery);
    else if (emailFromStorage) setEmail(emailFromStorage);

    if (searchParams.get('registered') === '1') {
      setSuccess('Conta criada com sucesso. Faça login para continuar.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(extractApiError(data, `Erro ${response.status} ao entrar.`));
      }

      const parsed = (data ?? {}) as { access_token?: string; token?: string; user_data?: unknown };
      const token = parsed.access_token || parsed.token;
      
      let redirectPath = '/chat';

      if (typeof window !== 'undefined' && token) {
        window.localStorage.setItem('access_token', token);
        window.localStorage.setItem('auth_token', token);
        
        try {
          // Import dynamic to avoid Next.js SSR issues if needed, or use fetch
          const { authService } = await import('@/services/authService');
          const userData = await authService.getMe();
          
          if (userData && userData.role === 'admin') {
            redirectPath = '/admin';
          }
        } catch (err) {
          console.error("Falha ao buscar dados do usuário após login", err);
        }
      }

      router.push(redirectPath);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Falha ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Lado Esquerdo - Apresentação */}
      <div className="login-left-panel hidden lg:flex lg:w-1/2">
        <div className="flex flex-col h-full w-full px-16 py-12">

          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <Image 
              src="/assets/login/8449060e38dcb948c8eccbc3c8aaac60f16a99f0.png" 
              alt="Logo Ensina Aí" 
              width={55} 
              height={47}
              className="object-contain"
            />
            <div>
              <h1 className="text-white text-3xl font-medium">Ensina Aí</h1>
              <p className="text-white/80 text-sm">Aprenda Português com IA</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-8 max-w-md mt-16">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Image src="/assets/login/Icon.svg" alt="Ícone Método Socrático" width={24} height={24} />
              </div>
              <div>
                <h3 className="text-white text-xl font-medium mb-2">Método Socrático</h3>
                <p className="text-white/90 text-sm">
                  Aprenda através de perguntas que estimulam o pensamento crítico e a compreensão profunda da língua portuguesa.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Image src="/assets/login/Icon(1).svg" alt="Ícone Chat Inteligente" width={24} height={24} />
              </div>
              <div>
                <h3 className="text-white text-xl font-medium mb-2">Chat Inteligente</h3>
                <p className="text-white/90 text-sm">
                  IA personalizada que se adapta ao seu nível de conhecimento e estilo de aprendizagem.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Image src="/assets/login/Icon(2).svg" alt="Ícone Progresso" width={24} height={24} />
              </div>
              <div>
                <h3 className="text-white text-xl font-medium mb-2">Acompanhe seu Progresso</h3>
                <p className="text-white/90 text-sm">
                  Simulados personalizados e métricas detalhadas do seu desempenho em gramática, ortografia e interpretação.
                </p>
              </div>
            </div>
          </div>

          {/* Spacer — empurra checks + ilustração para o rodapé */}
          <div className="flex-1" />

          {/* Checks centralizados acima da ilustração */}
          <div className="flex justify-center gap-8 text-white text-sm mb-6">
            <span>✓ Mais de 1.000 exercícios</span>
            <span>✓ Certificado de conclusão</span>
            <span>✓ 100% focado em Português</span>
          </div>

          {/* Ilustração do estudante */}
          <div className="flex justify-center">
            <Image 
              src="/assets/login/8eb5be0a5b355820f4a4f8a1d1209b2e70ffef5c.png" 
              alt="Estudante aprendendo" 
              width={534} 
              height={372}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Card de Login */}
          <div className="bg-white rounded-2xl shadow-xl p-10 space-y-8">
            {/* Ícone e Título */}
            <div className="text-center space-y-4">
              <div className="login-gradient-icon w-16 h-16 mx-auto rounded-2xl flex items-center justify-center">
                <Image 
                  src="/assets/login/Icon(3).svg" 
                  alt="Ícone Login" 
                  width={32} 
                  height={32}
                />
              </div>
              <h2 className="text-2xl font-medium text-[#2d3748]">Bem-vindo de volta!</h2>
              <p className="text-[#6b7280]">Entre para continuar sua jornada</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Mensagem de erro */}
              {error && (
                <div className="bg-[#fef2f2] border border-[#ffc9c9] rounded-2xl px-4 py-3">
                  <p className="text-[#c10007] text-sm">{error}</p>
                </div>
              )}

              {/* Mensagem de sucesso */}
              {success && (
                <div className="bg-[#ecfdf3] border border-[#9ee6b8] rounded-2xl px-4 py-3">
                  <p className="text-[#0f7a35] text-sm">{success}</p>
                </div>
              )}

              {/* Campo Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-[#2d3748]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="login-input w-full px-3 py-3 bg-[rgba(245,229,220,0.3)] border border-[rgba(91,159,201,0.2)] rounded-2xl text-sm text-[#2d3748] placeholder:text-[#6b7280] focus:outline-none focus:border-[#5b9fc9] focus:ring-1 focus:ring-[#5b9fc9]"
                  disabled={isLoading}
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-[#2d3748]">
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-[#5b9fc9] hover:text-[#4a8fb0] transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input w-full px-3 py-3 bg-[rgba(245,229,220,0.3)] border border-[rgba(91,159,201,0.2)] rounded-2xl text-sm text-[#2d3748] placeholder:text-[#6b7280] focus:outline-none focus:border-[#5b9fc9] focus:ring-1 focus:ring-[#5b9fc9]"
                  disabled={isLoading}
                />
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl text-white text-sm font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b9fc9] to-[#88c9a1] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Entrando...' : 'Entrar na plataforma'}
              </button>
            </form>

            {/* Divisor e Registro */}
            <div className="pt-6 border-t border-[rgba(91,159,201,0.2)] space-y-3">
              <p className="text-center text-sm text-[#6b7280]">
                Ainda não tem uma conta?
              </p>
              <Link
                href="/register"
                className="login-link block w-full py-3 bg-[#f5e5dc] border border-[#5b9fc9] rounded-2xl text-[#5b9fc9] text-sm font-medium text-center hover:bg-[#ead9cd] transition-colors"
              >
                Criar conta gratuita
              </Link>
            </div>
          </div>

          {/* Texto LGPD */}
          <p className="text-center text-sm text-[#6b7280]">
            🔒 Seus dados estão seguros e protegidos pela LGPD
          </p>
        </div>
      </div>
    </div>
  );
}
