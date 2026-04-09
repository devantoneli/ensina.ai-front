'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canSubmit = acceptedTerms && !isLoading;
  const isStudentSelected = role === 'student';
  const isAdminSelected = role === 'admin';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Digite um e-mail válido');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!acceptedTerms) {
      setError('Você precisa aceitar os termos de uso e política de privacidade');
      return;
    }

    setIsLoading(true);

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      password,
      role,
    };

    const registerEndpoint = '/api/auth/register';

    try {
      const response = await fetch(registerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let responseData: { id?: string | number; message?: string } | null = null;
      try {
        responseData = (await response.json()) as { id?: string | number; message?: string };
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        throw new Error(responseData?.message || `Erro ${response.status} ao criar conta.`);
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('registered_email', trimmedEmail);
        window.sessionStorage.setItem('last_login_email', trimmedEmail);
        window.sessionStorage.setItem('just_registered', '1');
        window.sessionStorage.setItem('last_register_status', String(response.status));
        if (responseData?.id !== undefined) {
          window.sessionStorage.setItem('last_registered_user_id', String(responseData.id));
        }
      }

      console.info('[register] usuário criado com sucesso', {
        status: response.status,
        email: trimmedEmail,
        id: responseData?.id,
      });

      router.push(
        `/login?registered=1&source=register&email=${encodeURIComponent(trimmedEmail)}`,
      );
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : 'Erro ao criar conta. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-page="register" className="min-h-screen flex items-center justify-center px-6 py-10 bg-[#f5e5dc]">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-20 items-center lg:items-start">
        {/* Lado Esquerdo - Apresentação */}
        <div className="hidden lg:flex flex-col gap-10 w-1/2 max-w-[520px]">
          <div>
            <Image
              src="/assets/cadastro/Container.svg"
              alt="Ícone Ensina Aí"
              width={64}
              height={64}
            />

            <h1 className="text-3xl font-medium mt-6 leading-tight bg-gradient-to-r from-[#5b9fc9] to-[#88c9a1] bg-clip-text text-transparent">
              Comece sua jornada no Ensina Aí
            </h1>

            <p className="text-[#6b7280] text-lg leading-7 mt-4">
              Transforme seu aprendizado de Português com inteligência artificial e método socrático
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {([
              'Chat interativo com IA especializada em Português',
              'Simulados personalizados e adaptados ao seu nível',
              'Acompanhamento detalhado do seu progresso',
              '100% gratuito e em conformidade com a LGPD',
            ]).map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[rgba(136,201,161,0.2)] flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 4" stroke="#88C9A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[#2d3748] text-base">{item}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/50 border border-white rounded-2xl p-6">
            <p className="text-[#6b7280] text-sm leading-5">
              &ldquo;O Ensina Aí revolucionou minha forma de estudar Português. O método socrático me fez realmente entender, não apenas decorar!&rdquo;
            </p>
            <p className="mt-4 text-sm">
              <span className="font-bold text-[#2d3748]">Ana Paula Silva</span>
              <span className="text-[#6b7280]"> · Estudante</span>
            </p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="w-full lg:w-1/2 lg:max-w-[420px]">
          <div className="w-full rounded-3xl bg-[#f8f8f8] px-10 py-10 shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium text-[#2d3748]">Criar sua conta</h2>
              <p className="text-[#6b7280] text-sm mt-2">Preencha seus dados para começar</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Erro */}
              {error && (
                <div className="bg-[#fef2f2] border border-[#ffc9c9] rounded-2xl px-4 py-3">
                  <p className="text-[#c10007] text-sm">{error}</p>
                </div>
              )}

              {/* Nome completo */}
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-[#2d3748]">
                  <Image src="/assets/cadastro/Container.svg" alt="" width={14} height={14} />
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  className="w-full px-3 py-3 bg-[rgba(245,229,220,0.3)] border border-[rgba(91,159,201,0.2)] rounded-2xl text-sm text-[#2d3748] placeholder:text-[#6b7280] focus:outline-none focus:border-[#5b9fc9] focus:ring-1 focus:ring-[#5b9fc9]"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-[#2d3748]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="#6b7280" strokeWidth="1.5" />
                    <path d="M1 6l7 4 7-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-3 bg-[rgba(245,229,220,0.3)] border border-[rgba(91,159,201,0.2)] rounded-2xl text-sm text-[#2d3748] placeholder:text-[#6b7280] focus:outline-none focus:border-[#5b9fc9] focus:ring-1 focus:ring-[#5b9fc9]"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-[#2d3748]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="#6b7280" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-3 bg-[rgba(245,229,220,0.3)] border border-[rgba(91,159,201,0.2)] rounded-2xl text-sm text-[#2d3748] placeholder:text-[#6b7280] focus:outline-none focus:border-[#5b9fc9] focus:ring-1 focus:ring-[#5b9fc9]"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              {/* Confirmar senha */}
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-[#2d3748]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="#6b7280" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full px-3 py-3 bg-[rgba(245,229,220,0.3)] border border-[rgba(91,159,201,0.2)] rounded-2xl text-sm text-[#2d3748] placeholder:text-[#6b7280] focus:outline-none focus:border-[#5b9fc9] focus:ring-1 focus:ring-[#5b9fc9]"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              {/* Escolha de perfil */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-[#2d3748]">Escolha seu perfil</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border text-sm font-medium transition-all ${
                      isStudentSelected
                        ? 'border-[#5b9fc9] bg-[rgba(91,159,201,0.12)]'
                        : 'border-[#d1d5db] bg-[#f3f4f6]'
                    }`}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={isStudentSelected ? 'text-[#5b9fc9]' : 'text-[#9ca3af]'
                      }
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className={isStudentSelected ? 'text-[#2d3748]' : 'text-[#6b7280]'}>Estudante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border text-sm font-medium transition-all ${
                      isAdminSelected
                        ? 'border-[#5b9fc9] bg-[rgba(91,159,201,0.12)]'
                        : 'border-[#d1d5db] bg-[#f3f4f6]'
                    }`}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={isAdminSelected ? 'text-[#5b9fc9]' : 'text-[#9ca3af]'
                      }
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9.5 12l2 2 3-3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className={isAdminSelected ? 'text-[#2d3748]' : 'text-[#6b7280]'}>Admin</span>
                  </button>
                </div>
              </div>

              {/* Termos */}
              <div className="bg-[rgba(245,229,220,0.3)] rounded-2xl px-4 py-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[rgba(91,159,201,0.2)] accent-[#5b9fc9] flex-shrink-0"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-[#2d3748] leading-6">
                    Li e aceito os{' '}
                    <button type="button" className="text-[#5b9fc9] font-medium hover:underline">
                      termos de uso
                    </button>
                    {' '}e{' '}
                    <button type="button" className="text-[#5b9fc9] font-medium hover:underline">
                      política de privacidade
                    </button>
                  </span>
                </label>
              </div>

              {/* Botão de cadastro */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 rounded-2xl text-white text-sm font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b9fc9] to-[#88c9a1] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Criando conta...' : (
                  <>
                    Criar minha conta
                    <span>→</span>
                  </>
                )}
              </button>

              {/* Link login */}
              <p className="text-center text-sm text-[#6b7280]">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-[#5b9fc9] font-medium hover:underline">
                  Fazer login
                </Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
