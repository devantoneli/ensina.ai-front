import api from './api';
import type { ChatResponse, ChatMessageRequest } from '@/types/chat';

export type BackendChat = {
  id: number;
  name: string;
  mode: string;
  created_at: string;
  last_interaction: string;
  is_active: boolean;
  last_message: string | null;
};

export type BackendMessage = {
  id: number;
  sender: 'USER' | 'IA';
  content: string;
  sent_at: string;
};

export type BackendChatDetails = BackendChat & {
  messages: BackendMessage[];
};

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token');
}

type TutorSource = {
  id?: number;
  name?: string;
  url?: string;
  indexed?: boolean;
};

type StreamPayload = {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode?: 'responde' | 'ensino';
  content_id?: number | null;
  chat_id?: number | null;
  exam_id?: number | null;
  question_id?: number | null;
};

type StreamHandlers = {
  onMeta?: (meta: {
    type: 'meta';
    sources?: TutorSource[];
    sources_consulted?: TutorSource[];
    grounded?: boolean;
    mode?: string;
    intent?: string;
    refusal?: boolean;
    scope?: Record<string, unknown>;
  }) => void;
  onDelta?: (token: string) => void;
  onDone?: () => void;
};

export const chatPersistenceService = {
  async createChat(name: string): Promise<BackendChat | null> {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mode: 'LIVRE' }),
      });
      if (!res.ok) return null;
      return (await res.json()) as BackendChat;
    } catch {
      return null;
    }
  },

  async getChatDetails(chatId: number): Promise<BackendChatDetails | null> {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      return (await res.json()) as BackendChatDetails;
    } catch {
      return null;
    }
  },

  async startProgressSession(chatId: number): Promise<void> {
    const token = getStoredToken();
    if (!token) return;
    try {
      await fetch(`/api/progress/session/start/${chatId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // não bloqueia o fluxo
    }
  },

  async endProgressSession(chatId: number): Promise<void> {
    const token = getStoredToken();
    if (!token) return;
    try {
      await fetch(`/api/progress/session/end/${chatId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // não bloqueia o fluxo
    }
  },
};

export const chatService = {
  async sendMessage(messages: ChatMessageRequest[], mode: string): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/free-mode/', { messages, mode });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o chat:', error);
      throw error;
    }
  },

  async streamTutorResponse(payload: StreamPayload, handlers: StreamHandlers): Promise<void> {
    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token')
        : null;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        window.localStorage.removeItem('access_token');
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('user_data');
        window.location.href = '/login';
      }

      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || errorData?.message || 'Request failed');
    }

    if (!response.body) {
      throw new Error('Resposta sem stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;

        const raw = line.slice(5).trim();
        if (raw === '[DONE]') {
          handlers.onDone?.();
          continue;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          if (raw) {
            handlers.onDelta?.(raw);
          }
          continue;
        }

        const candidate = parsed as {
          type?: string;
          sources?: TutorSource[];
          sources_consulted?: TutorSource[];
          grounded?: boolean;
          mode?: string;
          intent?: string;
          refusal?: boolean;
          scope?: Record<string, unknown>;
          choices?: Array<{ delta?: { content?: string } }>;
        };

        if (candidate.type === 'meta') {
          handlers.onMeta?.({
            type: 'meta',
            sources: candidate.sources,
            sources_consulted: candidate.sources_consulted,
            grounded: candidate.grounded,
            mode: candidate.mode,
            intent: candidate.intent,
            refusal: candidate.refusal,
            scope: candidate.scope,
          });
          continue;
        }

        const tokenContent = candidate.choices?.[0]?.delta?.content;
        if (tokenContent !== undefined) {
          handlers.onDelta?.(tokenContent);
        }
      }
    }

    if (buffer.startsWith('data:')) {
      const raw = buffer.slice(5).trim();
      if (raw === '[DONE]') {
        handlers.onDone?.();
      } else if (raw) {
        try {
          const parsed = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
          const tokenContent = parsed.choices?.[0]?.delta?.content;
          if (tokenContent !== undefined) {
            handlers.onDelta?.(tokenContent);
          }
        } catch {
          handlers.onDelta?.(raw);
        }
      }
    }
  },
};
