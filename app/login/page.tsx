'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import Link from 'next/link';
import Image from 'next/image';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      await authService.login({ email, password });
      // Redirecionar para dashboard do usuário
      router.push('/User');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mensagem de erro */}
              {error && (
                <div className="bg-[#fef2f2] border border-[#ffc9c9] rounded-2xl p-4">
                  <p className="text-[#c10007] text-sm">{error}</p>
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
                className="login-button login-gradient-button w-full py-3 rounded-2xl text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? 'Entrando...' : 'Entrar na plataforma'}
                {!isLoading && <span>→</span>}
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
