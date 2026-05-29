'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { getSimuladoResultStorageKey } from '@/utils/simuladoStorage';
import '../../../simulados.css';

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

interface ResultData {
  correct: number;
  total: number;
  percentage: number;
}

export default function SimuladoResultadoPage() {
  const router = useRouter();
  const params = useParams<{ simulado: string; nivel: string }>();
  const simulado = Array.isArray(params.simulado) ? params.simulado[0] : params.simulado;
  const nivel = Array.isArray(params.nivel) ? params.nivel[0] : params.nivel;

  const titulo = simulado ? safeDecode(simulado) : 'Simulado';
  const nivelExibido = nivel ? levelLabel(safeDecode(nivel)) : 'Nível';

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const completionKey = normalizeCompletionKey(titulo, nivelExibido);
      const storedResult = window.localStorage.getItem(
        getSimuladoResultStorageKey(completionKey)
      );

      queueMicrotask(() => {
        if (storedResult) {
          const parsed = JSON.parse(storedResult) as ResultData;
          setResult(parsed);
        }

        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading result:', error);
      queueMicrotask(() => {
        setLoading(false);
      });
    }
  }, [titulo, nivelExibido]);

  const handleVoltar = () => {
    router.push('/simulados');
  };

  const handleRevisar = () => {
    const nivelEncoded = encodeURIComponent(nivel ?? 'medio');
    router.push(
      `/simulados/${encodeURIComponent(titulo)}/${nivelEncoded}/revisar`
    );
  };

  if (loading) {
    return (
      <div className="simulados-page">
        <ChatSidebar />
        <main className="simulados-shell simulados-detail">
          <section className="simulado-result-card">
            <p>Carregando resultado...</p>
          </section>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="simulados-page">
        <ChatSidebar />
        <main className="simulados-shell simulados-detail">
          <section className="simulado-result-card">
            <p>Resultado não encontrado.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="simulados-page">
      <ChatSidebar />

      <main className="simulados-shell simulados-detail">
        <section className="simulado-result-card">
          <header className="simulado-result-header">
            <div>
              <p className="simulado-runner-kicker">Resultado do simulado</p>
              <h1>{titulo}</h1>
              <p>
                Nível selecionado: <strong>{nivelExibido}</strong>
              </p>
            </div>
          </header>

          <div className="simulado-result-score">
            <div className={`simulado-score-display ${result.percentage < 70 ? 'simulado-score-display--danger' : ''}`}>
              <h2>{result.correct}/{result.total}</h2>
              <p>Questões acertadas</p>
            </div>

            <div className="simulado-score-percentage">
              <div className="simulado-percentage-circle">
                <span>{result.percentage}%</span>
              </div>
              <p>Taxa de acerto</p>
            </div>
          </div>

          <div className="simulado-result-info">
            <article>
              <p>Total de questões</p>
              <strong>{result.total}</strong>
            </article>
            <article>
              <p>Acertos</p>
              <strong className="simulado-info-correct">{result.correct}</strong>
            </article>
            <article>
              <p>Erros</p>
              <strong className="simulado-info-wrong">{result.total - result.correct}</strong>
            </article>
          </div>

          <footer className="simulado-result-footer">
            <p>
              Você completou este simulado! Revise suas respostas para aprimorar seus conhecimentos.
            </p>

            <div className="simulado-result-actions">
              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--ghost"
                onClick={handleVoltar}
              >
                Voltar para simulados
              </button>

              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--primary"
                onClick={handleRevisar}
              >
                Revisar respostas
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
