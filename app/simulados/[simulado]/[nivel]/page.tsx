'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { getSimuladoKeysStorageKey } from '@/utils/simuladoStorage';
import '../../simulados.css';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function levelLabel(value: string): string {
  switch (value.toLowerCase()) {
    case 'facil':
      return 'Fácil';
    case 'medio':
      return 'Médio';
    case 'dificil':
      return 'Difícil';
    default:
      return safeDecode(value);
  }
}

function normalizeCompletionKey(title: string, level: string): string {
  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const normalizedLevel = level
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return `${normalizedTitle}::${normalizedLevel}`;
}

export default function SimuladoDetalhePage() {
  const router = useRouter();
  const params = useParams<{ simulado: string; nivel: string }>();
  const simulado = Array.isArray(params.simulado) ? params.simulado[0] : params.simulado;
  const nivel = Array.isArray(params.nivel) ? params.nivel[0] : params.nivel;

  const titulo = simulado ? safeDecode(simulado) : 'Simulado';
  const nivelExibido = nivel ? levelLabel(safeDecode(nivel)) : 'Nível';
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false);

  const simuladoCompletionKey = useMemo(() => normalizeCompletionKey(titulo, nivelExibido), [titulo, nivelExibido]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(getSimuladoKeysStorageKey());
      const keys = raw ? (JSON.parse(raw) as string[]) : [];
      queueMicrotask(() => {
        setHasCompletedBefore(Array.isArray(keys) && keys.includes(simuladoCompletionKey));
      });
    } catch {
      queueMicrotask(() => {
        setHasCompletedBefore(false);
      });
    }
  }, [simuladoCompletionKey]);

  const handleIniciar = () => {
    router.push(`/simulados/${encodeURIComponent(titulo)}/${encodeURIComponent(nivel ?? 'medio')}/resolver`);
  };

  return (
    <div className="simulados-page">
      <ChatSidebar />

      <main className="simulados-shell simulados-detail">
        <section className="simulado-detail-card">
          <header className="simulado-detail-header">
            <div>
              <p className="simulado-runner-kicker">Detalhes do simulado</p>
              <h1>{titulo}</h1>
              <p>
                Nível selecionado: <strong>{nivelExibido}</strong>
              </p>
            </div>

            <div className="simulado-detail-status" aria-live="polite">
              <span>{hasCompletedBefore ? 'Concluído' : 'Pendente'}</span>
              <p>Status do aluno</p>
            </div>
          </header>

          <div className="simulado-detail-info">
            <article>
              <p>Formato</p>
              <strong>Múltipla escolha</strong>
            </article>
            <article>
              <p>Alternativas</p>
              <strong>A, B, C, D e E</strong>
            </article>
            <article>
              <p>Retentativa</p>
              <strong>Liberada</strong>
            </article>
          </div>

          <p className="simulado-detail-description">
            Esta tela apresenta os dados do simulado antes do início. O cálculo de acertos e pontuação é responsabilidade do backend.
          </p>

          <footer className="simulado-detail-footer">
            <p>
              Você poderá iniciar agora e, se já tiver concluído anteriormente, também refazer este simulado.
            </p>

            <div className="simulado-detail-actions">
              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--ghost"
                onClick={() => router.push('/simulados')}
              >
                Voltar para simulados
              </button>

              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--primary"
                onClick={handleIniciar}
              >
                Iniciar simulado
              </button>
              {hasCompletedBefore ? (
                <button
                  type="button"
                  className="simulado-runner-button simulado-runner-button--primary"
                  onClick={handleIniciar}
                >
                  Refazer simulado
                </button>
              ) : null}
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
