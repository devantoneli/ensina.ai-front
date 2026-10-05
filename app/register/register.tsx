'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const canSubmit = acceptedTerms && !isLoading;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password || !confirmPassword) {
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
      phone: trimmedPhone,
      password,
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
        const now = new Date().toISOString();
        const userData = {
          id: String(responseData?.id ?? `register-${Date.now()}`),
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          role: 'student' as const,
          created_at: now,
          updated_at: now,
        };

        window.sessionStorage.setItem('registered_email', trimmedEmail);
        window.sessionStorage.setItem('last_login_email', trimmedEmail);
        window.sessionStorage.setItem('just_registered', '1');
        window.sessionStorage.setItem('last_register_status', String(response.status));
        if (responseData?.id !== undefined) {
          window.sessionStorage.setItem('last_registered_user_id', String(responseData.id));
        }

        window.localStorage.setItem('user_data', JSON.stringify(userData));
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
    <>
    <div data-page="register" className="min-h-screen flex items-center justify-center px-6 py-10 bg-[#f5e5dc]">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-20 items-center lg:items-start">
        {/* Lado Esquerdo - Apresentação */}
        <div className="hidden lg:flex flex-col gap-10 w-1/2 max-w-[520px]">
          <div>
            <Image
              src="/assets/cadastro/Container.svg"
              alt="Ícone Ensina AI"
              width={80}
              height={80}
            />

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mt-6 leading-tight bg-gradient-to-r from-[#5b9fc9] to-[#88c9a1] bg-clip-text text-transparent">
              Comece sua jornada no Ensina AI
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
              &ldquo;O Ensina AI revolucionou minha forma de estudar Português. O método socrático me fez realmente entender, não apenas decorar!&rdquo;
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

              {/* Telefone */}
              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-[#2d3748]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 2.5h2l1 3-1.3.8a8.5 8.5 0 0 0 3.4 3.4l.8-1.3 3 1v2c0 .6-.4 1.1-1 1.1C7 12.5 3.5 9 3.5 4c0-.6.5-1.5.5-1.5Z" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-3 bg-[rgba(245,229,220,0.3)] border border-[rgba(91,159,201,0.2)] rounded-2xl text-sm text-[#2d3748] placeholder:text-[#6b7280] focus:outline-none focus:border-[#5b9fc9] focus:ring-1 focus:ring-[#5b9fc9]"
                  disabled={isLoading}
                  autoComplete="tel"
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
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#5b9fc9] font-medium hover:underline">
                      termos de uso
                    </button>
                    {' '}e{' '}
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#5b9fc9] font-medium hover:underline">
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

      {/* Modal de Termos de Uso */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-medium text-[#2d3748]">Termos de Uso</h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-[#4a5568] text-sm leading-relaxed space-y-4">
              <p>
                <strong>1. Aceitação dos Termos</strong><br/>
                Ao acessar e utilizar o Ensina AI, você concorda com estes Termos de Uso. O Ensina AI é uma plataforma de cunho estritamente acadêmico, desenvolvida como Trabalho de Conclusão de Curso (TCC). Nosso objetivo é fornecer suporte ao estudo de Língua Portuguesa para o ENEM, utilizando ferramentas de Inteligência Artificial para mediação pedagógica.
              </p>
              
              <p>
                <strong>2. Responsabilidades do Usuário</strong><br/>
                Você é responsável por manter a confidencialidade das credenciais de acesso da sua conta e por todas as atividades que nela ocorram. O uso da plataforma deve ser restrito a fins educacionais e de estudo.
              </p>

              <p>
                <strong>3. Natureza das Respostas da Inteligência Artificial</strong><br/>
                O Ensina AI utiliza modelos de linguagem (IA) para fornecer dicas e explicações. Embora o sistema faça consultas a fontes validadas, as respostas são geradas automaticamente e podem, ocasionalmente, apresentar imprecisões ("alucinações"). Recomendamos sempre verificar as informações em fontes oficiais. O sistema foi projetado para auxiliar o raciocínio, não para substituir o aprendizado ativo.
              </p>

              <p>
                <strong>4. Disponibilidade do Sistema</strong><br/>
                Por se tratar de um projeto acadêmico sem fins lucrativos, o sistema pode apresentar instabilidades temporárias ou ser descontinuado ao final do ciclo de avaliação institucional, sem aviso prévio ou garantia de disponibilidade de longo prazo.
              </p>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2.5 rounded-xl text-[#6b7280] font-medium hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Política de Privacidade (LGPD) */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-medium text-[#2d3748]">Política de Privacidade (LGPD)</h3>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-[#4a5568] text-sm leading-relaxed space-y-4">
              <p>
                <strong>1. Coleta e Tratamento de Dados</strong><br/>
                Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), informamos que coletamos apenas os dados essenciais para o funcionamento do sistema: nome, e-mail e telefone (para fins de recuperação e autenticação em dois fatores). Os dados de desempenho em simulados e interações no chat são coletados exclusivamente para gerar indicadores de aprendizagem para o próprio usuário e para a avaliação do projeto de pesquisa. Não comercializamos suas informações sob nenhuma hipótese.
              </p>

              <p>
                <strong>2. Proteção a Menores</strong><br/>
                Ao utilizar o Ensina AI, estudantes adolescentes têm seus dados tratados no seu melhor interesse (Estatuto da Criança e do Adolescente), com a finalidade exclusiva de apoio ao estudo. Não realizamos rastreamento para fins de publicidade direcionada.
              </p>

              <p>
                <strong>3. Compartilhamento com APIs de Inteligência Artificial</strong><br/>
                Para oferecer o serviço de tutoria, as mensagens trocadas no chat são enviadas e processadas por uma API externa da Google (Gemini 2.5 Flash). Garantimos que a nossa configuração de acesso corporativo impede que as suas mensagens sejam retidas ou utilizadas pela Google para treinar modelos públicos.
              </p>

              <p>
                <strong>4. Seus Direitos (Exclusão e Consentimento)</strong><br/>
                O seu consentimento é livre e esclarecido. Você poderá, a qualquer momento, visualizar seus dados e solicitar a exclusão definitiva da sua conta e de todo o seu histórico (conversas e simulados) entrando em contato com a equipe do projeto ou diretamente pelo painel do usuário.
              </p>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2.5 rounded-xl text-[#6b7280] font-medium hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
