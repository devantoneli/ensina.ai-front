'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { authService } from '@/services/authService';
import './history.css';

type HistoryItem = {
  id: string;
  title: string;
  subtitle: string;
};

function formatPtDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function parseHistoryItems(payload: unknown): HistoryItem[] {
  if (!payload || typeof payload !== 'object') return [];

  const root = payload as Record<string, unknown>;
  const candidates = [
    root.data,
    root.history,
    root.sessions,
    root.conversations,
    (root.data as Record<string, unknown> | undefined)?.history,
    (root.data as Record<string, unknown> | undefined)?.sessions,
    (root.data as Record<string, unknown> | undefined)?.conversations,
  ];

  const source = candidates.find((item) => Array.isArray(item));
  if (!Array.isArray(source)) return [];

  return source
    .map((entry, index) => {
      const raw = entry as Record<string, unknown>;
      const id = (raw.id ?? raw.chat_id ?? raw.session_id ?? `history-${index}`).toString();
      const title =
        (raw.title ?? raw.subject ?? raw.topic ?? raw.name ?? '').toString().trim() ||
        'Conversa sem título';
      const updatedAt =
        (raw.updated_at ?? raw.updatedAt ?? raw.created_at ?? raw.createdAt ?? '').toString();

      return {
        id,
        title,
        subtitle: updatedAt ? formatPtDate(updatedAt) : 'Data indisponível',
      };
    })
    .slice(0, 8);
}

const STORAGE_PREFIX = 'ensina_ai_chat_sessions_v1';

function parseLocalSessions(storageKey: string): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((session: any) => ({
      id: session.id,
      title: session.title || 'Conversa sem título',
      subtitle: formatPtDate(session.updatedAt || session.createdAt || new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

function mergeHistory(local: HistoryItem[], remote: HistoryItem[]): HistoryItem[] {
  const map = new Map<string, HistoryItem>();
  local.forEach((item) => map.set(item.id, item));
  remote.forEach((item) => map.set(item.id, item));

  return Array.from(map.values()).slice(0, 20);
}

export default function HistoryPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  useEffect(() => {
    const loadHistory = async () => {
      if (typeof window === 'undefined') return;

      let storageKey = `${STORAGE_PREFIX}:guest`;
      const rawUser = window.localStorage.getItem('user_data');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          const keyPart = parsed?.id ?? parsed?.email;
          if (keyPart) {
            storageKey = `${STORAGE_PREFIX}:${String(keyPart)}`;
          }
        } catch { /* ignore */ }
      }

      const localItems = parseLocalSessions(storageKey);
      setHistoryItems(localItems);

      const token = window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token');
      if (!token) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const response = await fetch('/api/chat/history', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data) {
          setIsLoadingHistory(false);
          return;
        }

        const remoteItems = parseHistoryItems(data);
        setHistoryItems(mergeHistory(localItems, remoteItems));
      } catch {
        // stay with local items
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (isAuthorized) {
      loadHistory();
    }
  }, [isAuthorized]);

  const latestConversation = useMemo(() => historyItems[0] ?? null, [historyItems]);

  if (!isAuthorized) return null;

  return (
    <div className="history-page">
      <ChatSidebar />

      <main className="history-main">
        <header className="history-header">
          <h1 className="history-title">Histórico</h1>
          <p className="history-subtitle">Visualize seu histórico de conversas e progresso recente</p>
        </header>

        <section className="history-content">
          <div className="history-summary-grid">
            <article className="history-summary-card">
              <p className="history-summary-label">Última conversa</p>
              <p className="history-summary-value">
                {isLoadingHistory ? 'Carregando conversas...' : latestConversation?.title ?? 'Sem conversas ainda'}
              </p>
              <p className="history-summary-meta">
                {isLoadingHistory ? 'Aguarde' : latestConversation?.subtitle ?? 'Faça uma pergunta para começar'}
              </p>
            </article>

            <article className="history-summary-card history-summary-card--placeholder">
              <p className="history-summary-label">Último simulado</p>
              <p className="history-summary-value">Sem simulados disponíveis</p>
              <p className="history-summary-meta">Faça um simulado para ele aparecer aqui.</p>
            </article>

            <article className="history-summary-card history-summary-card--placeholder">
              <p className="history-summary-label">Desempenho</p>
              <p className="history-summary-value">--%</p>
              <p className="history-summary-meta">Seu desempenho aparecerá após concluir atividades.</p>
            </article>
          </div>

          <section className="history-list-card">
            <div className="history-list-header">
              <h2>Conversas recentes</h2>
              <span>{historyItems.length > 0 ? `${historyItems.length} itens` : 'Sem dados ainda'}</span>
            </div>

            {historyItems.length === 0 ? (
              <div className="history-empty-state">
                <p className="history-empty-title">Nenhuma conversa para mostrar</p>
                <p className="history-empty-text">Inicie uma conversa no chat para começar a preencher este histórico.</p>
              </div>
            ) : (
              <div className="history-list">
                {historyItems.map((item) => (
                  <article
                    key={item.id}
                    className="history-item cursor-pointer hover:bg-black/5 transition-colors"
                    onClick={() => router.push(`/chat?session_id=${item.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/chat?session_id=${item.id}`);
                      }
                    }}
                  >
                    <div>
                      <p className="history-item-title">{item.title}</p>
                      <p className="history-item-subtitle">{item.subtitle}</p>
                    </div>
                    <span className="history-item-arrow">→</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
