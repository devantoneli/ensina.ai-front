'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className = '' }: SidebarProps) {
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
    <aside className={`h-full ${className}`}>
      {/* Ícone do livro */}
      <div>
        <Image
          src="/assets/cadastro/Container.svg"
          alt="Ícone Ensina AI"
          width={64}
          height={64}
        />

        {/* Título com gradiente */}
        <h1 className="text-3xl font-medium mt-6 leading-tight bg-gradient-to-r from-[#5b9fc9] to-[#88c9a1] bg-clip-text text-transparent">
          Comece sua jornada no Ensina AI
        </h1>

        {/* Descrição */}
        <p className="text-[#6b7280] text-lg leading-7 mt-4">
          Transforme seu aprendizado de Português com inteligência artificial e método socrático
        </p>
      </div>

      {/* Lista de benefícios */}
      <div className="flex flex-col gap-4">
        {[
          'Chat interativo com IA especializada em Português',
          'Simulados personalizados e adaptados ao seu nível',
          'Acompanhamento detalhado do seu progresso',
          '100% gratuito e em conformidade com a LGPD',
        ].map((item) => (
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

      {/* Depoimento */}
      <div className="bg-white/50 border border-white rounded-2xl p-6">
        <p className="text-[#6b7280] text-sm leading-5">
          &ldquo;O Ensina AI revolucionou minha forma de estudar Português. O método socrático me fez realmente entender, não apenas decorar!&rdquo;
        </p>
        <p className="mt-4 text-sm">
          <span className="font-bold text-[#2d3748]">Ana Paula Silva</span>
          <span className="text-[#6b7280]"> · Estudante</span>
        </p>
      </div>
    </aside>
  );
}