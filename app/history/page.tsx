'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { authService } from '@/services/authService';
import { useProgress } from '@/hooks/useProgress';
import { simuladoService } from '@/services/simuladoService';
import type { Simulado } from '@/types/simulados';
import { getSimuladoKeysStorageKey, getSimuladoResultStorageKey } from '@/utils/simuladoStorage';
import './history.css';

// ── Tipos ─────────────────────────────────────────────────

type ChatSession = {
  id: string;
  title: string;
  updatedAt: string;
};

type CompletedSimulado = {
  key: string;
  titulo: string;
  nivel: string;
  materia: string;
  correct: number;
  total: number;
  percentage: number;
  completedAt: string;
};

// ── Helpers ───────────────────────────────────────────────

const CHAT_STORAGE_PREFIX = 'ensina_ai_chat_sessions_v1';

function formatPtDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getUserStorageKey(): string {
  if (typeof window === 'undefined') return `${CHAT_STORAGE_PREFIX}:guest`;
  const rawUser = window.localStorage.getItem('user_data');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      const keyPart = parsed?.id ?? parsed?.email;
      if (keyPart) return `${CHAT_STORAGE_PREFIX}:${String(keyPart)}`;
    } catch { /* ignore */ }
  }
  return `${CHAT_STORAGE_PREFIX}:guest`;
}

function loadChatSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getUserStorageKey();
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((s: any) => ({
        id: s.id ?? '',
        title: s.title ?? 'Conversa sem título',
        updatedAt: s.updatedAt ?? s.createdAt ?? new Date().toISOString(),
      }))
      .filter((s) => Boolean(s.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20);
  } catch {
    return [];
  }
}

function loadCompletedSimulados(examsList: Simulado[]): CompletedSimulado[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getSimuladoKeysStorageKey());
    const keys: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(keys)) return [];

    return keys
      .map((key) => {
        const resultRaw = window.localStorage.getItem(getSimuladoResultStorageKey(key));
        if (!resultRaw) return null;
        const result = JSON.parse(resultRaw) as { correct: number; total: number; percentage: number };

        const [titlePart, nivelPart] = key.split('::');
        const matchedExam = examsList.find(
          (e) =>
            e.titulo
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim() === titlePart?.trim()
        );

        return {
          key,
          titulo: matchedExam?.titulo ?? titlePart ?? key,
          nivel: nivelPart ?? 'Médio',
          materia: matchedExam?.materia ?? 'Simulado',
          correct: result.correct,
          total: result.total,
          percentage: result.percentage,
          completedAt: new Date().toISOString(), // localStorage doesn't store date
        } satisfies CompletedSimulado;
      })
      .filter((s): s is CompletedSimulado => s !== null)
      .reverse(); // most recent first
  } catch {
    return [];
  }
}

// ── Componente principal ──────────────────────────────────

export default function HistoryPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [completedSimulados, setCompletedSimulados] = useState<CompletedSimulado[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  const { dashboard, isLoading: isLoadingProgress } = useProgress();

  const accuracyPct = dashboard?.accuracy?.accuracy_pct ?? null;
  const totalMessages = dashboard?.study_time?.total_messages ?? null;
  const totalSessions = dashboard?.study_time?.total_sessions ?? null;
  const weakTopics = dashboard?.weak_topics ?? [];
  const studiedContents = dashboard?.studied_contents ?? [];

  // ── Auth guard ────────────────────────────────────────
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  // ── Carrega dados locais (chat + simulados) ────────────
  useEffect(() => {
    if (!isAuthorized) return;

    const loadAll = async () => {
      // Chat sessions from localStorage (same key as chat page)
      const sessions = loadChatSessions();
      setChatSessions(sessions);

      // Completed simulados — need exam list to map titles/materias
      try {
        const examsList = await simuladoService.list();
        const simulados = loadCompletedSimulados(examsList);
        setCompletedSimulados(simulados);
      } catch {
        const simulados = loadCompletedSimulados([]);
        setCompletedSimulados(simulados);
      } finally {
        setIsLoadingLocal(false);
      }
    };

    void loadAll();
  }, [isAuthorized]);

  const latestChat = useMemo(() => chatSessions[0] ?? null, [chatSessions]);

  if (!isAuthorized) return null;

  const isLoading = isLoadingLocal || isLoadingProgress;

  return (
    <div className="history-page">
      <ChatSidebar />

      <main className="history-main">
        <header className="history-header">
          <h1 className="history-title">Histórico</h1>
          <p className="history-subtitle">Visualize seu histórico de conversas, simulados e progresso</p>
        </header>

        <section className="history-content">

          {/* ── Resumo geral ─────────────────────────────── */}
          <div className="history-summary-grid">
            <article className="history-summary-card">
              <p className="history-summary-label">Última conversa</p>
              <p className="history-summary-value">
                {isLoading ? 'Carregando...' : latestChat?.title ?? 'Sem conversas ainda'}
              </p>
              <p className="history-summary-meta">
                {latestChat
                  ? formatPtDate(latestChat.updatedAt)
                  : 'Faça uma pergunta para começar'}
              </p>
            </article>

            <article className="history-summary-card">
              <p className="history-summary-label">Mensagens estudadas</p>
              <p className="history-summary-value">
                {isLoadingProgress
                  ? 'Carregando...'
                  : totalMessages !== null
                  ? `${totalMessages} mensagens`
                  : '0 mensagens'}
              </p>
              <p className="history-summary-meta">
                {totalSessions !== null && totalSessions > 0
                  ? `${totalSessions} sessão${totalSessions !== 1 ? 'ões' : ''} no chat`
                  : 'Converse com a IA para acumular progresso.'}
              </p>
            </article>

            <article className="history-summary-card">
              <p className="history-summary-label">Desempenho geral</p>
              <p className="history-summary-value">
                {isLoadingProgress
                  ? 'Carregando...'
                  : accuracyPct !== null
                  ? `${accuracyPct}%`
                  : '--%'}
              </p>
              <p className="history-summary-meta">
                {accuracyPct !== null
                  ? 'Taxa de acerto nas questões respondidas'
                  : 'Seu desempenho aparecerá após responder questões.'}
              </p>
            </article>
          </div>

          {/* ── Simulados concluídos ──────────────────────── */}
          <section className="history-list-card">
            <div className="history-list-header">
              <h2>Simulados realizados</h2>
              <span>
                {isLoadingLocal
                  ? '...'
                  : completedSimulados.length > 0
                  ? `${completedSimulados.length} simulado${completedSimulados.length !== 1 ? 's' : ''}`
                  : 'Nenhum ainda'}
              </span>
            </div>

            {isLoadingLocal ? (
              <div className="history-empty-state">
                <p className="history-empty-title">Carregando simulados...</p>
              </div>
            ) : completedSimulados.length === 0 ? (
              <div className="history-empty-state">
                <p className="history-empty-title">Nenhum simulado realizado</p>
                <p className="history-empty-text">
                  Acesse a seção de{' '}
                  <button
                    type="button"
                    className="history-link-btn"
                    onClick={() => router.push('/simulados')}
                  >
                    Simulados
                  </button>{' '}
                  para fazer seu primeiro!
                </p>
              </div>
            ) : (
              <div className="history-list">
                {completedSimulados.map((sim) => (
                  <article key={sim.key} className="history-item history-item--simulado">
                    <div className="history-item-info">
                      <p className="history-item-title">{sim.titulo}</p>
                      <p className="history-item-subtitle">
                        {sim.materia} · Nível {sim.nivel}
                      </p>
                    </div>
                    <div className="history-item-score">
                      <span
                        className={`history-score-badge ${
                          sim.percentage >= 70
                            ? 'history-score-badge--green'
                            : sim.percentage >= 50
                            ? 'history-score-badge--yellow'
                            : 'history-score-badge--red'
                        }`}
                      >
                        {sim.percentage}%
                      </span>
                      <span className="history-score-detail">
                        {sim.correct}/{sim.total} acertos
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>



          {/* ── Conteúdos estudados (backend) ────────────── */}
          {!isLoadingProgress && studiedContents.length > 0 && (
            <section className="history-list-card">
              <div className="history-list-header">
                <h2>Conteúdos estudados</h2>
                <span>{studiedContents.length} conteúdo{studiedContents.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="history-list">
                {studiedContents.slice(0, 8).map((content) => (
                  <article key={content.content_id} className="history-item">
                    <div>
                      <p className="history-item-title">{content.content_name}</p>
                      <p className="history-item-subtitle">
                        {content.interactions} interaç{content.interactions !== 1 ? 'ões' : 'ão'} ·{' '}
                        {content.correct} acerto{content.correct !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="history-item-arrow" style={{ color: '#4791df' }}>→</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ── Conversas recentes (chat) ─────────────────── */}
          <section className="history-list-card">
            <div className="history-list-header">
              <h2>Conversas recentes</h2>
              <span>
                {isLoadingLocal
                  ? '...'
                  : chatSessions.length > 0
                  ? `${chatSessions.length} conversa${chatSessions.length !== 1 ? 's' : ''}`
                  : 'Sem dados ainda'}
              </span>
            </div>

            {isLoadingLocal ? (
              <div className="history-empty-state">
                <p className="history-empty-title">Carregando conversas...</p>
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="history-empty-state">
                <p className="history-empty-title">Nenhuma conversa para mostrar</p>
                <p className="history-empty-text">
                  <button
                    type="button"
                    className="history-link-btn"
                    onClick={() => router.push('/chat')}
                  >
                    Inicie uma conversa no chat
                  </button>{' '}
                  para começar a preencher este histórico.
                </p>
              </div>
            ) : (
              <div className="history-list">
                {chatSessions.map((session) => (
                  <article
                    key={session.id}
                    className="history-item history-item--clickable"
                    onClick={() => router.push(`/chat?session_id=${session.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/chat?session_id=${session.id}`);
                      }
                    }}
                  >
                    <div>
                      <p className="history-item-title">{session.title}</p>
                      <p className="history-item-subtitle">{formatPtDate(session.updatedAt)}</p>
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
