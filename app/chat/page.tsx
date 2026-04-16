'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
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

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  latestAnalysis: FreeModeResponse | null;
};

const STORAGE_KEY = 'ensina_ai_chat_sessions_v1';
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function sanitizeSessions(data: unknown): ChatSession[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const raw = item as Partial<ChatSession>;
      if (!raw.id || !raw.title || !Array.isArray(raw.messages)) return null;

      const messages = raw.messages
        .filter((msg) => msg?.id && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
        .map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt ?? new Date().toISOString(),
        }));

      return {
        id: raw.id,
        title: raw.title,
        createdAt: raw.createdAt ?? new Date().toISOString(),
        updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
        messages,
        latestAnalysis: raw.latestAnalysis ?? null,
      };
    })
    .filter((session): session is ChatSession => Boolean(session));
}

function formatPtDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function truncateText(value: string, max = 46): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function buildHistoryPreview(session: ChatSession): string[] {
  const contents = session.latestAnalysis?.classification?.contents ?? [];
  if (contents.length > 0) {
    return contents.slice(0, 3).map((item) => truncateText(item, 36));
  }

  const userMessages = session.messages.filter((msg) => msg.role === 'user');
  if (userMessages.length > 0) {
    return userMessages.slice(0, 3).map((msg) => truncateText(msg.content, 36));
  }

  return ['Conversa salva'];
}

function buildSessionTitle(question: string): string {
  const clean = question.trim();
  if (!clean) return 'Nova conversa';
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean;
}

function inferContentsFromQuestion(question: string): string[] {
  const normalized = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const unique = Array.from(new Set(normalized));
  return unique.slice(0, 4).map((word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function formatAssistantReply(question: string, data: FreeModeResponse | null, ok: boolean): string {
  if (!ok) {
    return data?.detail ?? data?.message ?? 'Nao foi possivel processar sua pergunta no momento.';
  }

  if (!data) {
    return `Entendi sua pergunta sobre "${question}". Pode me dar mais contexto para eu aprofundar a explicacao?`;
  }

  const discipline = data.classification?.discipline;
  const contents = data.classification?.contents ?? [];
  const modules = data.trail?.trail ?? [];

  if (!discipline && contents.length === 0 && modules.length === 0) {
    return data.message ?? data.detail ?? `Entendi sua pergunta sobre "${question}". Vamos trabalhar nisso em partes.`;
  }

  const lines: string[] = [];

  if (discipline) {
    lines.push(`Tema identificado: ${discipline}.`);
  }

  if (contents.length > 0) {
    lines.push('Pontos relacionados para estudar agora:');
    contents.slice(0, 4).forEach((content, index) => {
      lines.push(`${index + 1}. ${content}`);
    });
  }

  if (modules.length > 0) {
    lines.push('Sequencia sugerida:');
    modules.slice(0, 2).forEach((module, index) => {
      lines.push(`${index + 1}. ${module.title ?? 'Modulo sem titulo'}`);
      if (module.activities?.length) {
        lines.push(`   Atividade: ${module.activities[0]}`);
      }
    });
  }

  lines.push('Se quiser, eu te guio no proximo passo com um exercicio curto.');
  return lines.join('\n');
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userName, setUserName] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const safeSessions = sanitizeSessions(parsed).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setSessions(safeSessions);
      setActiveSessionId(safeSessions[0]?.id ?? null);
    } catch {
      setSessions([]);
      setActiveSessionId(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawUser = window.localStorage.getItem('user_data');
    if (!rawUser) return;

    try {
      const parsed = JSON.parse(rawUser) as { name?: string };
      if (parsed?.name) {
        setUserName(parsed.name.split(' ')[0]);
      }
    } catch {
      // ignore invalid stored user data
    }
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [sessions],
  );

  const activeContents = activeSession?.latestAnalysis?.classification?.contents ?? [];
  const fallbackContents = activeSession?.messages.length
    ? inferContentsFromQuestion(activeSession.messages[0]?.content ?? '')
    : [];
  const displayedContents = activeContents.length > 0 ? activeContents.slice(0, 4) : fallbackContents;
  const activeDiscipline = activeSession?.latestAnalysis?.classification?.discipline ?? 'Materia';
  const contentSubtitle = displayedContents[0] ?? 'Aguardando conteudos';
  const spotlightTitle = displayedContents[1] ?? displayedContents[0] ?? 'Seu proximo conteudo aparece aqui';
  const dotCount = Math.max(displayedContents.length, 5);
  const hasMessages = (activeSession?.messages.length ?? 0) > 0;
  const headerTitle = hasMessages ? activeSession?.title ?? 'Nova conversa' : 'No que voce esta pensando hoje?';
  const greetingLine = userName ? `${userName}` : '';
  const assistantMetaTitle = activeSession?.latestAnalysis?.classification?.discipline ?? '';
  const assistantMetaSubtitle = activeSession?.latestAnalysis?.classification?.contents?.[0] ?? '';

  const createSession = (question: string): string => {
    const now = new Date().toISOString();
    const newId = makeId();

    const newSession: ChatSession = {
      id: newId,
      title: buildSessionTitle(question),
      createdAt: now,
      updatedAt: now,
      messages: [],
      latestAnalysis: null,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    return newId;
  };

  const appendMessage = (sessionId: string, message: ChatMessage, analysis?: FreeModeResponse | null) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;

        const mergedAnalysis = analysis === undefined ? session.latestAnalysis : analysis;
        const discipline = mergedAnalysis?.classification?.discipline;

        return {
          ...session,
          updatedAt: message.createdAt,
          title: discipline ? `${discipline} - ${buildSessionTitle(session.messages[0]?.content ?? message.content)}` : session.title,
          latestAnalysis: mergedAnalysis,
          messages: [...session.messages, message],
        };
      }),
    );
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
  };

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const question = input.trim();
    if (!question || isSending) return;

    setIsSending(true);
    setInput('');

    const sessionId = activeSessionId ?? createSession(question);

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };

    appendMessage(sessionId, userMessage);

    try {
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token')
          : null;

      if (!token) {
        appendMessage(sessionId, {
          id: makeId(),
          role: 'assistant',
          content: 'Sua sessao expirou. Faca login novamente para continuar.',
          createdAt: new Date().toISOString(),
        });
        return;
      }

      const response = await fetch(`/api/chat?question=${encodeURIComponent(question)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json().catch(() => null)) as FreeModeResponse | null;

      appendMessage(
        sessionId,
        {
          id: makeId(),
          role: 'assistant',
          content: formatAssistantReply(question, data, response.ok),
          createdAt: new Date().toISOString(),
        },
        response.ok ? data : undefined,
      );
    } catch {
      appendMessage(sessionId, {
        id: makeId(),
        role: 'assistant',
        content: 'Nao foi possivel conectar ao servico de IA no momento.',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#E1F0FC_-14.48%,#79B3E0_109.23%)]">
      <ChatSidebar />

      <main className="ml-[80px] min-h-screen">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 h-screen w-[320px] shrink-0 overflow-y-auto bg-[linear-gradient(180deg,#F6FAFD_0%,#C7E7FF_100%)] px-6 py-6">
            <p className="text-[15px] font-medium text-[#263244]">Resultados do chat</p>

            <section className="mt-5">
              <h2 className="text-[22px] font-semibold text-[#1f2937]">Conteudos</h2>

              <div className="mt-4 rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(34,67,111,0.12)]">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[#2f90e5]" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#1f2937]">{activeDiscipline}</p>
                    <p className="text-[11px] text-[#6b7b8f]">{contentSubtitle}</p>
                  </div>
                </div>

                <div className="mt-4 min-h-[108px] rounded-[22px] bg-[#7341b0] px-4 py-4 text-white shadow-[0_12px_22px_rgba(93,54,150,0.24)]">
                  <div className="flex items-center justify-between">
                    <button type="button" className="text-lg leading-none opacity-80" aria-label="Anterior">
                      {'<'}
                    </button>
                    <p className="max-w-[180px] text-center text-sm font-semibold leading-5">{spotlightTitle}</p>
                    <button type="button" className="text-lg leading-none opacity-80" aria-label="Proximo">
                      {'>'}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    {Array.from({ length: dotCount }).map((_, index) => (
                      <span
                        key={`dot-${index}`}
                        className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-[#ef7c4d]' : 'bg-[#f2e5f8]'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="mt-8 text-[22px] font-semibold text-[#1f2937]">Conversas anteriores</h3>

              <div className="mt-4 space-y-3 pb-6">
                {sortedSessions.length === 0 ? (
                  <div className="rounded-[22px] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(34,67,111,0.1)]">
                    <p className="text-[13px] font-semibold text-[#334155]">Nenhuma conversa ainda</p>
                    <p className="mt-1 text-[11px] text-[#64748b]">Comece com sua primeira pergunta para salvar o historico.</p>
                  </div>
                ) : (
                  sortedSessions.map((session, index) => {
                    const preview = buildHistoryPreview(session);
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setActiveSessionId(session.id)}
                        className={`w-full rounded-[22px] border px-4 py-4 text-left shadow-[0_8px_18px_rgba(34,67,111,0.1)] transition ${
                          activeSessionId === session.id
                            ? 'border-[#b3c7da] bg-white'
                            : 'border-transparent bg-white/92 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${index % 2 === 0 ? 'bg-[#7fe28b]' : 'bg-[#8ec4ff]'}`} />
                          <div>
                            <p className="text-[13px] font-semibold text-[#1f2937]">{session.title}</p>
                            <p className="text-[11px] text-[#8a9bb2]">{formatPtDate(session.updatedAt)}</p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {preview.map((topic) => (
                            <div key={topic} className="rounded-full bg-[#ededed] px-3 py-1.5 text-[11px] text-[#4b5563]">
                              {topic}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </aside>

          <section className="relative flex min-h-screen min-w-0 flex-1 flex-col rounded-[69px] bg-[linear-gradient(180deg,#E1F0FC_-14.48%,#79B3E0_109.23%)] px-6 shadow-[inset_1px_0_0_rgba(255,255,255,0.65)]">
            <header className="relative flex items-center justify-center py-6">
              <h1 className="text-center text-[24px] font-medium text-[#1f2937]">{headerTitle}</h1>
              <button
                type="button"
                onClick={handleNewChat}
                className="absolute right-0 h-8 w-8 rounded-full text-lg text-[#1f2937] hover:bg-white/40"
                aria-label="Nova conversa"
                title="Nova conversa"
              >
                x
              </button>
            </header>

            <div className={`flex-1 ${!hasMessages ? 'flex items-center justify-center' : 'overflow-y-auto pb-6'}`}>
              {!hasMessages ? (
                <div className="flex w-full flex-col items-center gap-6 px-6 text-center">
                  {greetingLine ? (
                    <p className="text-[12px] text-[#6b7b8f]">{greetingLine}</p>
                  ) : null}
                  <p className="text-[22px] font-semibold text-[#1f2937]">O que vamos estudar hoje?</p>
                  <form
                    onSubmit={handleSend}
                    className="w-full max-w-[520px] items-center gap-3 rounded-[18px] bg-white px-4 py-2.5 shadow-[0_12px_26px_rgba(34,67,111,0.18)]"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Por onde comecamos?"
                        className="flex-1 bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#9aa9bb]"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={isSending || !input.trim()}
                        className="h-9 rounded-[12px] bg-[#2f90e5] px-4 text-sm font-semibold text-white transition hover:bg-[#227dce] disabled:cursor-not-allowed disabled:opacity-65"
                      >
                        {isSending ? '...' : '➤'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[760px] space-y-4">
                  {activeSession?.messages.map((message, index) => (
                    <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      {message.role === 'assistant' ? (
                        <span className="mt-1 h-6 w-6 rounded-full bg-white shadow-[0_6px_12px_rgba(34,67,111,0.12)]" />
                      ) : null}

                      <div
                        className={`max-w-[78%] rounded-[20px] px-4 py-3 shadow-[0_8px_18px_rgba(34,67,111,0.12)] ${
                          message.role === 'user'
                            ? 'bg-[#2f90e5] text-white'
                            : 'border border-white/80 bg-white text-[#1f2937]'
                        }`}
                      >
                        {message.role === 'assistant' && index === 0 && assistantMetaTitle ? (
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7b8da1]">
                            {assistantMetaSubtitle ? `${assistantMetaTitle} - ${assistantMetaSubtitle}` : assistantMetaTitle}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-line text-sm leading-6">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {hasMessages ? (
              <footer className="sticky bottom-0 pb-6">
                <form
                  onSubmit={handleSend}
                  className="mx-auto flex w-full max-w-[760px] items-center gap-3 rounded-[18px] bg-white px-4 py-2.5 shadow-[0_12px_26px_rgba(34,67,111,0.18)]"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Por onde comecamos?"
                    className="flex-1 bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#9aa9bb]"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="h-9 rounded-[12px] bg-[#2f90e5] px-4 text-sm font-semibold text-white transition hover:bg-[#227dce] disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {isSending ? '...' : '➤'}
                  </button>
                </form>
              </footer>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

