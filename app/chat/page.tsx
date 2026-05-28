'use client';

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import TutorMarkdown from '@/components/TutorMarkdown';
import { chatService, chatPersistenceService } from '@/services/chatService';
import type { BackendMessage } from '@/services/chatService';
import { subjectService } from '@/services/subjectService';
import type { ContentItem, Subject } from '@/services/subjectService';
import ContentSelector from '@/components/chat/ContentSelector';
import './chat.css';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: Array<{
    name?: string;
    url?: string;
    contents?: Array<{ name?: string }>;
  }>;
};

type FreeModeResponse = {
  state?: string;
  conversation_mode?: 'study_plan' | 'pedagogical_support' | string;
  classification?: {
    discipline?: string;
    contents?: string[];
    content_ids?: number[];
    available_disciplines?: string[];
    status?: string;
    top_score?: number;
    confidence?: number;
    recommendation_eligible?: boolean;
    message?: string;
  };
  teaching?: {
    direct_answer?: string;
    explanation?: string;
    study_tips?: string[];
    check_question?: string;
  };
  trail?: string | {
    trail?: Array<{
      title?: string;
      activities?: string[];
      prerequisites?: string[];
      recommended_sources?: Array<{
        name?: string;
        url?: string;
        reason?: string;
      }>;
    }>;
  };
  recommended_studies?: Array<{
    content?: string;
    reason?: string;
    sources?: Array<{ name?: string; url?: string }>;
  }>;
  detail?: string;
  message?: string;
};

type TrailModule = {
  title?: string;
  activities?: string[];
  prerequisites?: string[];
  recommended_sources?: Array<{
    name?: string;
    url?: string;
    reason?: string;
  }>;
};

type TrailSource = {
  name?: string;
  url?: string;
  reason?: string;
};

type ChatSession = {
  id: string;
  backendId?: number;
  contentId?: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  latestAnalysis: FreeModeResponse | null;
};

const STORAGE_PREFIX = 'ensina_ai_chat_sessions_v1';
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
        ...(typeof raw.backendId === 'number' ? { backendId: raw.backendId } : {}),
        ...(typeof raw.contentId === 'number' ? { contentId: raw.contentId } : {}),
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

const ACCENT_FIXES: Record<string, string> = {
  voce: 'voc\u00ea',
  voces: 'voc\u00eas',
  nao: 'n\u00e3o',
  tambem: 'tamb\u00e9m',
  facil: 'f\u00e1cil',
  dificil: 'dif\u00edcil',
  portugues: 'portugu\u00eas',
  matematica: 'matem\u00e1tica',
  fisica: 'f\u00edsica',
  quimica: 'qu\u00edmica',
  historia: 'hist\u00f3ria',
  gramatica: 'gram\u00e1tica',
  lingua: 'l\u00edngua',
  acao: 'a\u00e7\u00e3o',
  acoes: 'a\u00e7\u00f5es',
};

function applyAccentFixes(text: string): string {
  return text
    .split(/\s+/)
    .map((token) => {
      const match = token.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
      if (!match) return token;

      const [, prefix, word, suffix] = match;
      const lower = word.toLowerCase();
      const mapped = ACCENT_FIXES[lower];

      if (!mapped) return token;

      let result = mapped;
      if (word === word.toUpperCase()) {
        result = mapped.toUpperCase();
      } else if (word[0] === word[0].toUpperCase()) {
        result = mapped.charAt(0).toUpperCase() + mapped.slice(1);
      }

      return `${prefix}${result}${suffix}`;
    })
    .join(' ');
}

function sentenceCase(text: string): string {
  let result = '';
  let shouldCapitalize = true;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (shouldCapitalize && /[A-Za-z]/.test(char)) {
      result += char.toUpperCase();
      shouldCapitalize = false;
      continue;
    }

    result += char;

    if (/[.!?]/.test(char)) {
      shouldCapitalize = true;
    }
  }

  return result;
}


function mapBackendMessage(msg: BackendMessage, chatId: number, index: number): ChatMessage {
  return {
    id: `${chatId}-${msg.id ?? index}`,
    role: msg.sender === 'USER' ? 'user' : 'assistant',
    content: msg.content,
    createdAt: msg.sent_at,
  };
}

function parseBackendHistory(payload: unknown): ChatSession[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item): ChatSession | null => {
      if (typeof item !== 'object' || !item) return null;
      const raw = item as Record<string, unknown>;
      const backendId = typeof raw.id === 'number' ? raw.id : null;
      if (!backendId) return null;

      const title = String(raw.name ?? 'Conversa');
      const createdAt = String(raw.created_at ?? new Date().toISOString());
      const updatedAt = String(raw.last_interaction ?? createdAt);

      return {
        id: `backend-${backendId}`,
        backendId,
        title,
        createdAt,
        updatedAt,
        messages: [],
        latestAnalysis: null,
      };
    })
    .filter((s): s is ChatSession => s !== null);
}

function mergeSessions(localSessions: ChatSession[], remoteSessions: ChatSession[]): ChatSession[] {
  const map = new Map<string, ChatSession>();

  localSessions.forEach((session) => {
    map.set(session.id, session);
  });

  remoteSessions.forEach((remote) => {
    // Evita duplicata: sessão local já vinculada ao mesmo backendId
    if (remote.backendId) {
      const localWithBackend = Array.from(map.values()).find((s) => s.backendId === remote.backendId);
      if (localWithBackend) {
        const remoteNewer = new Date(remote.updatedAt).getTime() > new Date(localWithBackend.updatedAt).getTime();
        if (remoteNewer) {
          map.set(localWithBackend.id, { ...localWithBackend, title: remote.title, updatedAt: remote.updatedAt });
        }
        return;
      }
    }

    const current = map.get(remote.id);
    if (!current) {
      map.set(remote.id, remote);
      return;
    }

    const currentTime = new Date(current.updatedAt).getTime();
    const incomingTime = new Date(remote.updatedAt).getTime();
    map.set(remote.id, incomingTime >= currentTime ? remote : current);
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function buildSessionTitle(question: string): string {
  const collapsed = question.replace(/\s+/g, ' ').trim();
  if (!collapsed) return 'Nova conversa';

  const withoutTrailing = collapsed.replace(/[?!.]+$/, '').trim();
  const safeText = withoutTrailing || collapsed;
  const sentenceCased = sentenceCase(safeText);
  const accentFixed = applyAccentFixes(sentenceCased);

  return accentFixed.length > 42 ? `${accentFixed.slice(0, 42).trim()}...` : accentFixed;
}


function buildAssistantMarkdown(question: string, data: FreeModeResponse | null, ok: boolean): string {
  if (!ok) {
    if (data?.detail && Array.isArray(data.detail)) {
      return '## Erro de validação\n\nOs dados enviados não puderam ser processados.';
    }
    const errorMessage = (typeof data?.detail === 'string' ? data.detail : data?.message) ?? 'Não foi possível processar sua pergunta no momento.';
    return `## Não foi possível responder\n\n> ${errorMessage}`;
  }

  if (!data) {
    return `## Vamos começar\n\nEntendi sua pergunta sobre **${question}**. Pode me dar mais contexto para eu aprofundar a explicação?`;
  }

  const mode = data.conversation_mode ?? 'pedagogical_support';
  const discipline = data.classification?.discipline;
  const contents: string[] = data.classification?.contents ?? [];
  const modules: TrailModule[] = typeof data.trail === 'string' ? [] : data.trail?.trail ?? [];
  const teaching = data.teaching;
  const recommendedStudies = data.recommended_studies ?? [];

  // Sem estrutura teaching: usa o message da IA diretamente.
  // O message já contém a resposta completa formatada em Markdown.
  if (!teaching && data.message) {
    const disciplineTag =
      discipline
        ? `*${[discipline, ...contents.slice(0, 3)].filter(Boolean).join(' — ')}*\n\n`
        : '';
    return disciplineTag + data.message;
  }

  // Fallback genérico quando não há nada aproveitável
  if (!discipline && contents.length === 0 && modules.length === 0 && !teaching) {
    return data.message ?? data.detail ?? `## Entendi sua pergunta\n\nVamos trabalhar nisso em partes.`;
  }

  // Caminho legado: resposta estruturada via campos teaching.* (retrocompatibilidade)
  const lines: string[] = [];

  lines.push(mode === 'study_plan' ? `## ${discipline ?? 'Plano de estudo'}` : '## Apoio pedagógico');

  if (teaching?.direct_answer) {
    lines.push(`**Resposta direta**\n\n${teaching.direct_answer}`);
  }

  if (teaching?.explanation) {
    lines.push(`> ${teaching.explanation}`);
  }

  if (contents.length > 0) {
    lines.push('### Conteúdos relacionados');
    contents.slice(0, 4).forEach((content) => {
      lines.push(`- [[${content}|Conteúdo relacionado e importante para sua dúvida.]]`);
    });
  }

  if (teaching?.study_tips?.length) {
    lines.push('### Dicas de estudo');
    teaching.study_tips.slice(0, 4).forEach((tip) => {
      lines.push(`- ${tip}`);
    });
  }

  if (teaching?.check_question) {
    lines.push('### Verificação rápida');
    lines.push(`> ${teaching.check_question}`);
  }

  if (modules.length > 0) {
    lines.push('### Trilha sugerida');
    modules.slice(0, 3).forEach((module, index) => {
      lines.push(`${index + 1}. **${module.title ?? 'Módulo sem título'}**`);
      if (module.activities?.length) {
        module.activities.slice(0, 4).forEach((activity) => {
          lines.push(`   - ${activity}`);
        });
      }
      if (module.prerequisites?.length) {
        lines.push(`   - Pré-requisitos: ${module.prerequisites.join(', ')}`);
      }
      if (module.recommended_sources?.length) {
        lines.push('   - Fontes recomendadas:');
        module.recommended_sources.forEach((source: TrailSource) => {
          lines.push(`     - ${source.url ? `[${source.name ?? 'Fonte'}](${source.url})` : source.name ?? 'Fonte'}${source.reason ? ` — ${source.reason}` : ''}`);
        });
      }
    });
  }

  if (recommendedStudies.length > 0) {
    lines.push('### Estudos recomendados');
    recommendedStudies.slice(0, 4).forEach((study) => {
      const title = study.content ?? 'Conteúdo';
      const reason = study.reason ? ` — ${study.reason}` : '';
      lines.push(`- **${title}**${reason}`);
    });
  }

  lines.push('### Próximo passo');
  lines.push('Se quiser, eu posso continuar com um exercício curto ou aprofundar algum ponto específico.');

  return lines.join('\n');
}


function ChatContent() {
  const searchParams = useSearchParams();
  const shouldStartNewChat = searchParams.get('new') === '1';
  const sessionIdFromQuery = searchParams.get('session_id');
  const parseQueryId = (key: 'content_id' | 'chat_id' | 'exam_id' | 'question_id'): number | undefined => {
    const rawValue = searchParams.get(key);
    if (rawValue === null || rawValue === '') return undefined;
    if (!/^\d+$/.test(rawValue)) return undefined;
    const value = Number(rawValue);
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
  };
  const contentIdFromQuery = parseQueryId('content_id');
  const chatIdFromQuery = parseQueryId('chat_id');
  const examIdFromQuery = parseQueryId('exam_id');
  const questionIdFromQuery = parseQueryId('question_id');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState<'chat_responde' | 'modo_ensino'>('chat_responde');
  const [userName, setUserName] = useState('');
  const [storageKey, setStorageKey] = useState('');
  const [contentIndex, setContentIndex] = useState(0);
  const [teachingSubject, setTeachingSubject] = useState<Subject | null>(null);
  const [teachingContent, setTeachingContent] = useState<ContentItem | null>(null);
  const [isCreatingTutorChat, setIsCreatingTutorChat] = useState(false);
  const [limitModal, setLimitModal] = useState<{ oldestChat: { id: number; name: string } } | null>(null);
  const [pendingTutorSelection, setPendingTutorSelection] = useState<{ subject: Subject; content: ContentItem } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const activeSessionRef = useRef<string | null>(null);
  const activeProgressChatRef = useRef<number | null>(null);

  useEffect(() => {
    setContentIndex(0);
  }, [activeSessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let resolvedKey = `${STORAGE_PREFIX}:guest`;
    setUserName('');

    const rawUser = window.localStorage.getItem('user_data');
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as { id?: string | number; email?: string; name?: string };
        if (parsed?.name) {
          setUserName(parsed.name.split(' ')[0]);
        }

        const keyPart = parsed?.id ?? parsed?.email;
        if (keyPart) {
          resolvedKey = `${STORAGE_PREFIX}:${String(keyPart)}`;
        }
      } catch {
        // ignore invalid stored user data
      }
    }

    setStorageKey(resolvedKey);

    try {
      const raw = window.localStorage.getItem(resolvedKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const safeSessions = sanitizeSessions(parsed).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setSessions(safeSessions);

      if (shouldStartNewChat) {
        setActiveSessionId(null);
        setInput('');
      } else if (sessionIdFromQuery) {
        setActiveSessionId(sessionIdFromQuery);
      } else {
        setActiveSessionId(safeSessions[0]?.id ?? null);
      }
    } catch {
      setSessions([]);
      setActiveSessionId(null);
    }
  }, [shouldStartNewChat, sessionIdFromQuery]);

  useEffect(() => {
    if ((!shouldStartNewChat && !sessionIdFromQuery) || typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.delete('new');
    url.searchParams.delete('session_id');

    const queryString = url.searchParams.toString();
    const nextPath = queryString ? `${url.pathname}?${queryString}` : url.pathname;
    window.history.replaceState({}, '', nextPath);
  }, [shouldStartNewChat, sessionIdFromQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  useEffect(() => {
    activeSessionRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length]);

  useEffect(() => {
    const newBackendId = activeSession?.backendId ?? null;
    if (!newBackendId || newBackendId === activeProgressChatRef.current) return;

    const prev = activeProgressChatRef.current;
    activeProgressChatRef.current = newBackendId;

    if (prev) chatPersistenceService.endProgressSession(prev).catch(() => {});
    chatPersistenceService.startProgressSession(newBackendId).catch(() => {});
  }, [activeSession?.backendId]);

  useEffect(() => {
    return () => {
      if (activeProgressChatRef.current) {
        chatPersistenceService.endProgressSession(activeProgressChatRef.current).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!storageKey) return;

    const token = window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token');
    if (!token) return;

    let isCancelled = false;

    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/chat/history', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data) return;

        const remoteSessions = parseBackendHistory(data);
        if (remoteSessions.length === 0) return;
        if (isCancelled) return;

        setSessions((prev) => {
          const merged = mergeSessions(prev, remoteSessions);
          if (!activeSessionRef.current && merged[0]) {
            setActiveSessionId(merged[0].id);
          }
          return merged;
        });
      } catch {
        // fallback to local persistence
      }
    };

    fetchHistory();

    return () => {
      isCancelled = true;
    };
  }, [storageKey]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [sessions],
  );

  const hasMessages = (activeSession?.messages.length ?? 0) > 0;
  const headerTitle = hasMessages ? activeSession?.title ?? 'Nova conversa' : 'No que voce esta pensando hoje?';
  const greetingLine = userName ? `${userName}` : '';
  const assistantMetaTitle = activeSession?.latestAnalysis?.classification?.discipline ?? '';
  const assistantMetaSubtitle = activeSession?.latestAnalysis?.classification?.contents?.[0] ?? '';
  const activeContentId = activeSession?.latestAnalysis?.classification?.content_ids?.[contentIndex];

  const createSession = (question: string, contentId?: number): string => {
    const now = new Date().toISOString();
    const newId = makeId();

    const newSession: ChatSession = {
      id: newId,
      ...(contentId !== undefined ? { contentId } : {}),
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

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);

    const session = sessions.find((s) => s.id === sessionId);
    if (!session?.backendId || session.messages.length > 0) return;

    chatPersistenceService.getChatDetails(session.backendId).then((details) => {
      if (!details?.messages?.length) return;
      const mapped = details.messages.map((msg, i) => mapBackendMessage(msg, details.id, i));
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: mapped } : s)),
      );
    }).catch(() => {});
  };

  const handleDeleteSession = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    if (activeSessionId === sessionId) {
      const nextSession = sessions.find((s) => s.id !== sessionId);
      setActiveSessionId(nextSession?.id ?? null);
    }

    if (!session?.backendId) return;
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token');
    if (!token) return;

    try {
      await fetch(`/api/chat/delete?chat_id=${session.backendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore remote deletion errors
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
  };

  const handleModeChange = (newMode: 'chat_responde' | 'modo_ensino') => {
    setMode(newMode);
    if (newMode === 'chat_responde') {
      setTeachingContent(null);
      setTeachingSubject(null);
    }
  };

  const doCreateTutorChat = async (subject: Subject, content: ContentItem) => {
    const title = `${subject.name} — ${content.title}`;
    const numericContentId = Number(content.id);
    const result = await chatPersistenceService.createTutorChat(title);

    if (!result.ok) {
      if (result.status === 409) {
        const detail = result.detail as { oldest_chat?: { id: number; name: string } } | null;
        if (detail?.oldest_chat) {
          setPendingTutorSelection({ subject, content });
          setLimitModal({ oldestChat: detail.oldest_chat });
        }
      }
      return;
    }

    const sessionId = createSession(title, Number.isFinite(numericContentId) ? numericContentId : undefined);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, backendId: result.chat.id } : s)),
    );
    setTeachingSubject(subject);
    setTeachingContent(content);
  };

  const handleContentSelected = async (subject: Subject, content: ContentItem) => {
    setIsCreatingTutorChat(true);
    try {
      const limitStatus = await subjectService.getLimitStatus();
      if (limitStatus?.at_limit && limitStatus.oldest_chat) {
        setPendingTutorSelection({ subject, content });
        setLimitModal({ oldestChat: limitStatus.oldest_chat });
        return;
      }
      await doCreateTutorChat(subject, content);
    } finally {
      setIsCreatingTutorChat(false);
    }
  };

  const handleLimitModalConfirm = async () => {
    const pending = pendingTutorSelection;
    setLimitModal(null);
    setPendingTutorSelection(null);
    if (!pending) return;
    setIsCreatingTutorChat(true);
    try {
      await doCreateTutorChat(pending.subject, pending.content);
    } finally {
      setIsCreatingTutorChat(false);
    }
  };

  const handleChangeContent = () => {
    setTeachingContent(null);
    setTeachingSubject(null);
    handleNewChat();
  };

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const question = input.trim();
    if (!question || isSending) return;

    setIsSending(true);
    setInput('');

    const isNewSession = !activeSessionId;
    const sessionId = activeSessionId ?? createSession(question, contentIdFromQuery);

    // Resolve backendId: usa o da sessão existente ou cria um chat novo no backend
    let backendChatId: number | undefined =
      sessions.find((s) => s.id === sessionId)?.backendId ?? chatIdFromQuery ?? undefined;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };

    appendMessage(sessionId, userMessage);

    const assistantMessageId = makeId();
    appendMessage(sessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      sources: [],
    });

    try {
      // Cria chat no backend na primeira mensagem de uma nova sessão
      if (isNewSession && !backendChatId) {
        const backendChat = await chatPersistenceService.createChat(buildSessionTitle(question));
        if (backendChat?.id) {
          backendChatId = backendChat.id;
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, backendId: backendChatId } : s)),
          );
        }
      }

      const sessionMessages = sessions.find((session) => session.id === sessionId)?.messages ?? [];
      const fullHistory = [...sessionMessages, userMessage]
        .filter((message) => message.content.trim() !== '')
        .map((message) => ({
          role: (message.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: message.content,
        }));

      await chatService.streamTutorResponse(
        {
          messages: fullHistory,
          mode: mode === 'modo_ensino' ? 'ensino' : 'responde',
          content_id: activeSession?.contentId ?? contentIdFromQuery ?? activeContentId,
          chat_id: backendChatId,
          exam_id: examIdFromQuery,
          question_id: questionIdFromQuery,
        },
        {
          onMeta: (meta) => {
            const metaSources = meta.sources_consulted ?? meta.sources ?? [];

            setSessions((prev) =>
              prev.map((session) => {
                if (session.id !== sessionId) return session;
                return {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === assistantMessageId
                      ? {
                          ...message,
                          sources: metaSources.map((source) => ({
                            name: source.name,
                            url: source.url,
                            contents: [],
                          })),
                        }
                      : message,
                  ),
                };
              }),
            );
          },
          onDelta: (token) => {
            setSessions((prev) =>
              prev.map((session) => {
                if (session.id !== sessionId) return session;
                return {
                  ...session,
                  updatedAt: new Date().toISOString(),
                  messages: session.messages.map((message) =>
                    message.id === assistantMessageId
                      ? { ...message, content: `${message.content}${token}` }
                      : message,
                  ),
                };
              }),
            );
          },
        },
      );
    } catch {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionId) return session;
          return {
            ...session,
            messages: session.messages.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content:
                      message.content ||
                      buildAssistantMarkdown(
                        question,
                        { message: 'Não foi possível conectar ao serviço de IA no momento.' },
                        false,
                      ),
                  }
                : message,
            ),
          };
        }),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F6FAFD_0%,#C7E7FF_100%)]">
      <ChatSidebar onNewChat={handleNewChat} />

      <main className="ml-[80px] min-h-screen">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 h-screen w-[320px] shrink-0 overflow-y-auto bg-[linear-gradient(180deg,#F6FAFD_0%,#C7E7FF_100%)] px-6 py-6">
            <p className="text-[var(--app-root-font-size)] font-medium text-[#263244]">Resultados do chat</p>

            <section className="mt-5">
              <h3 className="text-[22px] font-semibold text-[#1f2937]">Conversas anteriores</h3>

              <div className="mt-4 space-y-3 pb-6">
                {sortedSessions.length === 0 ? (
                  <div className="rounded-[22px] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(34,67,111,0.1)]">
                    <p className="text-[calc(var(--app-root-font-size)*0.8125)] font-semibold text-[#334155]">Nenhuma conversa ainda</p>
                    <p className="mt-1 text-[calc(var(--app-root-font-size)*0.6875)] text-[#64748b]">Comece com sua primeira pergunta para salvar o historico.</p>
                  </div>
                ) : (
                  sortedSessions.map((session, index) => {
                    const preview = buildHistoryPreview(session);
                    return (
                      <div
                        key={session.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectSession(session.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectSession(session.id);
                          }
                        }}
                        className={`relative w-full cursor-pointer rounded-[22px] border px-4 py-4 text-left shadow-[0_8px_18px_rgba(34,67,111,0.1)] transition ${
                          activeSessionId === session.id
                            ? 'border-[#b3c7da] bg-white'
                            : 'border-transparent bg-white/92 hover:bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#9aa9bb] shadow-[0_6px_12px_rgba(34,67,111,0.12)] transition hover:text-[#ef4444]"
                          aria-label="Excluir conversa"
                          title="Excluir conversa"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7H20" strokeLinecap="round" />
                            <path d="M9 7V5H15V7" strokeLinecap="round" />
                            <path d="M7 7L8 19H16L17 7" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 11V16M14 11V16" strokeLinecap="round" />
                          </svg>
                        </button>

                        <div className="flex items-center gap-2 pr-8">
                          <span className={`h-2.5 w-2.5 rounded-full ${index % 2 === 0 ? 'bg-[#2f90e5]' : 'bg-[#8ec4ff]'}`} />
                          <div>
                            <p className="text-[calc(var(--app-root-font-size)*0.8125)] font-semibold text-[#1f2937]">{session.title}</p>
                            <p className="text-[calc(var(--app-root-font-size)*0.6875)] text-[#8a9bb2]">{formatPtDate(session.updatedAt)}</p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {preview.map((topic, i) => (
                            <div key={`${topic}-${i}`} className="rounded-full bg-[#ededed] px-3 py-1.5 text-[11px] text-[#4b5563]">
                              {topic}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>

          <section className="relative flex min-h-screen min-w-0 flex-1 flex-col rounded-[69px] bg-[linear-gradient(180deg,#F6FAFD_0%,#C7E7FF_100%)] px-6">
            <>
            <header className="relative flex items-center justify-center py-6">
              <h1 className="text-center text-[calc(var(--app-root-font-size)*1.75)] font-medium text-[#1f2937]">{headerTitle}</h1>
              <button
                type="button"
                onClick={handleNewChat}
                className="absolute right-0 h-10 w-10 rounded-full text-xl text-[#1f2937] hover:bg-white/40"
                aria-label="Nova conversa"
                title="Nova conversa"
              >
                x
              </button>
            </header>

            {mode === 'modo_ensino' && teachingContent && teachingSubject && (
              <div className="mb-1 flex items-center justify-between gap-3 rounded-2xl border border-[#d0eaff] bg-[#f0f7ff] px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm leading-none">
                    {teachingContent.type === 'video' ? '🎥' : teachingContent.type === 'article' ? '📄' : '📖'}
                  </span>
                  <span className="truncate text-sm">
                    <span className="text-[#6b7280]">{teachingSubject.name} ›</span>{' '}
                    <span className="font-medium text-[#1f2937]">{teachingContent.title}</span>
                  </span>
                  {teachingContent.difficulty && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      teachingContent.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      teachingContent.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {teachingContent.difficulty === 'easy' ? 'Fácil' : teachingContent.difficulty === 'hard' ? 'Difícil' : 'Médio'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleChangeContent}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-[#2f90e5] transition hover:bg-[#dbeeff]"
                >
                  Trocar conteúdo
                </button>
              </div>
            )}

            <div className={`flex-1 ${!hasMessages ? (mode === 'modo_ensino' && !teachingContent ? 'overflow-y-auto py-4' : 'flex items-center justify-center') : 'overflow-y-auto pb-6'}`}>
              {!hasMessages ? (
                <div className="flex w-full flex-col items-center gap-7 px-6 text-center">
                  {greetingLine ? (
                    <p className="text-[calc(var(--app-root-font-size)*0.75)] text-[#6b7b8f]">{greetingLine}</p>
                  ) : null}
                  <p className="text-[28px] font-semibold text-[#1f2937]">O que vamos estudar hoje?</p>
                  
                  <div className="user-mode-selector mt-4">
                    <button
                      type="button"
                      className={`user-mode-button ${mode === 'chat_responde' ? 'user-mode-button--active' : ''}`}
                      onClick={() => handleModeChange('chat_responde')}
                    >
                      Chat Responde
                    </button>
                    <button
                      type="button"
                      className={`user-mode-button ${mode === 'modo_ensino' ? 'user-mode-button--active modo-ensina' : ''}`}
                      onClick={() => handleModeChange('modo_ensino')}
                    >
                      Modo Ensina
                    </button>
                  </div>

                  {mode === 'modo_ensino' && !teachingContent ? (
                    <ContentSelector onSelect={handleContentSelected} loading={isCreatingTutorChat} />
                  ) : (
                    <form
                      onSubmit={handleSend}
                      className="w-full max-w-[640px] items-center gap-3 rounded-[20px] bg-white px-5 py-3.5 shadow-[0_12px_26px_rgba(34,67,111,0.18)]"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Por onde começamos?"
                          className="flex-1 bg-transparent text-[var(--app-root-font-size)] text-[#1f2937] outline-none placeholder:text-[#9aa9bb]"
                          disabled={isSending}
                        />
                        <button
                          type="submit"
                          disabled={isSending || !input.trim()}
                          className="h-11 rounded-[14px] bg-[#2f90e5] px-5 text-[var(--app-root-font-size)] font-semibold text-white transition hover:bg-[#227dce] disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          {isSending ? '...' : '➤'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[900px] space-y-5">
                  {activeSession?.messages.map((message, index) => (
                    <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      {message.role === 'assistant' ? (
                        <span className="mt-1 h-7 w-7 rounded-full bg-white shadow-[0_6px_12px_rgba(34,67,111,0.12)]" />
                      ) : null}

                      <div
                        className={`max-w-[85%] rounded-[22px] px-5 py-4 ${
                          message.role === 'user'
                            ? 'bg-[#2f90e5] text-white shadow-[0_8px_18px_rgba(34,67,111,0.12)]'
                            : 'bg-[#f1f5f9] text-[#1f2937]'
                        }`}
                      >
                        {message.role === 'assistant' && index === 0 && assistantMetaTitle ? (
                          <p className="mb-2 text-[calc(var(--app-root-font-size)*0.6875)] font-semibold uppercase tracking-[0.08em] text-[#7b8da1]">
                            {assistantMetaSubtitle ? `${assistantMetaTitle} - ${assistantMetaSubtitle}` : assistantMetaTitle}
                          </p>
                        ) : null}
                        
                        {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            {message.sources.map((src, i) => (
                              <div key={i} style={{ backgroundColor: 'white', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.85rem', flex: '1 1 auto', minWidth: '200px' }}>
                                <div style={{ fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                  {src.url ? (
                                    <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0284c7' }} onMouseOver={e => e.currentTarget.style.textDecoration='underline'} onMouseOut={e => e.currentTarget.style.textDecoration='none'}>{src.name}</a>
                                  ) : (
                                    <span>{src.name}</span>
                                  )}
                                </div>
                                {src.contents && src.contents.length > 0 && (
                                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {src.contents.map((c, j) => (
                                      <span key={j} style={{ fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                        {c.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-[15px] leading-6 user-bubble-text">
                          <TutorMarkdown>{message.content}</TutorMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {hasMessages ? (
              <footer className="sticky bottom-0 pb-6 flex flex-col items-center gap-3">
                <div className="user-mode-selector">
                  <button
                    type="button"
                    className={`user-mode-button ${mode === 'chat_responde' ? 'user-mode-button--active' : ''}`}
                    onClick={() => handleModeChange('chat_responde')}
                  >
                    Chat Responde
                  </button>
                  <button
                    type="button"
                    className={`user-mode-button ${mode === 'modo_ensino' ? 'user-mode-button--active modo-ensina' : ''}`}
                    onClick={() => handleModeChange('modo_ensino')}
                  >
                    Modo Ensina
                  </button>
                </div>
                <form
                  onSubmit={handleSend}
                  className="mx-auto flex w-full max-w-[900px] items-center gap-3 rounded-[20px] bg-white px-5 py-3.5 shadow-[0_12px_26px_rgba(34,67,111,0.18)]"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Por onde começamos?"
                    className="flex-1 bg-transparent text-[var(--app-root-font-size)] text-[#1f2937] outline-none placeholder:text-[#9aa9bb]"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="h-11 rounded-[14px] bg-[#2f90e5] px-5 text-[var(--app-root-font-size)] font-semibold text-white transition hover:bg-[#227dce] disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {isSending ? '...' : '➤'}
                  </button>
                </form>
              </footer>
            ) : null}
            </>

            {limitModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-[#1f2937]">Limite de chats atingido</h3>
                  <p className="mt-2 text-sm text-[#6b7280]">
                    Para criar este chat, o mais antigo será excluído automaticamente:
                  </p>
                  <div className="mt-3 rounded-xl bg-[#f3f8fd] px-4 py-3">
                    <p className="text-sm font-medium text-[#374151]">{limitModal.oldestChat.name}</p>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setLimitModal(null); setPendingTutorSelection(null); }}
                      className="flex-1 rounded-xl border border-[#dce9f4] py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#f3f8fd]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleLimitModalConfirm}
                      className="flex-1 rounded-xl bg-[#138ecc] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1078b0]"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}
