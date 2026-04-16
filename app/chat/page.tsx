'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type FreeModeResponse = {
  state?: string;
  classification?: {
    discipline?: string;
    contents?: string[];
  };
  trail?: {
    trail?: Array<{
      title?: string;
      activities?: string[];
      prerequisites?: string[];
    }>;
  };
  detail?: string;
  message?: string;
};

type TrailModule = {
  title?: string;
  activities?: string[];
  prerequisites?: string[];
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function formatFreeModeResponse(data: FreeModeResponse): string {
  const discipline = data.classification?.discipline;
  const contents = data.classification?.contents ?? [];
  const modules = data.trail?.trail ?? [];

  if (!discipline && contents.length === 0 && modules.length === 0) {
    return data.message ?? data.detail ?? 'Não recebi uma trilha válida do backend.';
  }

  const lines: string[] = [];

  if (discipline) {
    lines.push(`Disciplina identificada: ${discipline}`);
  }

  if (contents.length > 0) {
    lines.push('');
    lines.push('Conteúdos relacionados:');
    contents.forEach((content) => {
      lines.push(`• ${content}`);
    });
  }

  if (modules.length > 0) {
    lines.push('');
    lines.push('Trilha sugerida:');

    modules.forEach((module, index) => {
      lines.push(`${index + 1}. ${module.title ?? 'Módulo sem título'}`);

      if (module.activities?.length) {
        module.activities.forEach((activity) => {
          lines.push(`   - ${activity}`);
        });
      }

      if (module.prerequisites?.length) {
        lines.push(`   Pré-requisitos: ${module.prerequisites.join(', ')}`);
      }
    });
  }

  return lines.join('\n');
}

function normalizeTrailModules(data: FreeModeResponse): TrailModule[] {
  return data.trail?.trail ?? [];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<FreeModeResponse | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: text };
    const history = [...messages, userMessage];

    setMessages(history);
    setInput('');
    setIsSending(true);

    try {
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token')
          : null;

      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: 'assistant',
            content: 'Sua sessão expirou. Faça login novamente para continuar no chat.',
          },
        ]);
        return;
      }

      const response = await fetch(`/api/chat?question=${encodeURIComponent(text)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json().catch(() => null)) as FreeModeResponse | null;
      const reply = data ? formatFreeModeResponse(data) : 'Não foi possível interpretar a resposta do backend.';

      if (response.ok && data) {
        setLatestAnalysis(data);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content: response.ok ? reply : data?.detail ?? data?.message ?? 'Erro ao processar pergunta no backend.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content: 'Não foi possível conectar ao serviço de IA no momento.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const contents = latestAnalysis?.classification?.contents ?? [];
  const trailModules = normalizeTrailModules(latestAnalysis ?? {});
  const discipline = latestAnalysis?.classification?.discipline;

  return (
    <div className="h-screen overflow-hidden bg-[#d7e7f5]">
      <ChatSidebar />

      <main className="ml-[88px] h-screen overflow-y-auto">
        <div className="min-h-screen flex">
          {/* Painel lateral de conteúdos */}
          <aside className="hidden lg:flex sticky top-0 h-screen w-[320px] shrink-0 border-r border-white/50 bg-[#e6eef6] px-6 py-6">
            <div className="w-full">
              <p className="text-xs text-[#4b5563]">Resultados do chat</p>
              <h2 className="mt-1 text-[30px] leading-[36px] font-medium text-[#1f2937]">Conteúdos</h2>

              <div className="mt-4 rounded-2xl bg-white/65 p-4">
                {discipline ? (
                  <>
                    <p className="text-sm font-medium text-[#1f2937]">{discipline}</p>
                    <p className="mt-1 text-xs text-[#6b7280]">Disciplina identificada pelo backend.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[#1f2937]">Sem conteúdos ainda</p>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      Os principais pontos da conversa vão aparecer aqui conforme o chat evolui.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {contents.length > 0 ? (
                  contents.map((content) => (
                    <div key={content} className="rounded-2xl bg-white/75 px-4 py-3 text-sm text-[#1f2937]">
                      {content}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white/55 p-4">
                    <p className="text-xs text-[#6b7280]">Nenhum conteúdo classificado ainda.</p>
                  </div>
                )}
              </div>

              <h3 className="mt-8 text-[32px] leading-[38px] font-medium text-[#1f2937]">Conversas anteriores</h3>
              <div className="mt-4 rounded-2xl bg-white/55 p-4">
                <p className="text-sm text-[#6b7280]">
                  {latestAnalysis?.state ? `Estado atual: ${latestAnalysis.state}` : 'Nenhuma conversa salva por enquanto.'}
                </p>
              </div>

              <h3 className="mt-8 text-[32px] leading-[38px] font-medium text-[#1f2937]">Trilha sugerida</h3>
              <div className="mt-4 space-y-3">
                {trailModules.length > 0 ? (
                  trailModules.map((module, index) => (
                    <div key={`${module.title ?? 'module'}-${index}`} className="rounded-2xl bg-white/75 p-4">
                      <p className="text-sm font-medium text-[#1f2937]">{module.title ?? `Módulo ${index + 1}`}</p>
                      {module.activities?.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-[#6b7280]">
                          {module.activities.map((activity) => (
                            <li key={activity}>{activity}</li>
                          ))}
                        </ul>
                      ) : null}
                      {module.prerequisites?.length ? (
                        <p className="mt-2 text-xs text-[#6b7280]">
                          Pré-requisitos: {module.prerequisites.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white/55 p-4">
                    <p className="text-sm text-[#6b7280]">A trilha gerada aparecerá aqui após a primeira pergunta.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Área principal */}
          <section className="flex-1 min-w-0 min-h-screen flex flex-col bg-[#9fc3e1]">
            <header className="flex items-center justify-between px-6 py-5">
              <h1 className="text-[30px] leading-[36px] font-medium text-[#1f2937]">Utilização de crase na frase</h1>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setLatestAnalysis(null);
                }}
                className="h-8 w-8 rounded-full bg-white/60 text-[#6b7280] text-lg leading-none"
                aria-label="Limpar conversa"
                title="Limpar conversa"
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="mx-auto w-full max-w-4xl">
                {messages.length === 0 ? (
                  <div className="mx-auto mt-4 max-w-[560px] rounded-2xl bg-white/55 px-8 py-6 text-center">
                    <p className="text-sm font-medium text-[#1f2937]">Seu chat com IA está pronto</p>
                    <p className="mt-1 text-xs text-[#6b7280]">Digite sua primeira pergunta para começar.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'ml-auto bg-[#2f90e5] text-white'
                            : 'mr-auto bg-white text-[#1f2937] border border-white/70'
                        }`}
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {msg.content}
                      </div>
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            <footer className="sticky bottom-0 border-t border-white/50 bg-[#b7d0e5]/95 px-6 py-4 backdrop-blur">
              <form onSubmit={handleSend} className="mx-auto flex w-full max-w-4xl gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-sm text-[#1f2937] outline-none"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="rounded-xl bg-[#8ec4bd] px-4 py-3 text-sm text-white disabled:opacity-60"
                >
                  {isSending ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}