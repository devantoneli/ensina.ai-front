'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import '../../../simulados.css';

type OptionLabel = 'A' | 'B' | 'C' | 'D' | 'E';

type SimuladoQuestion = {
  id: string;
  statement: string;
  options: Array<{ label: OptionLabel; text: string }>;
};

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

function getQuestionCountByType(title: string, level: string): number {
  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const normalizedLevel = level
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalizedTitle.includes('gramatica') || normalizedTitle.includes('ortografia')) {
    return 10;
  }

  if (normalizedTitle.includes('interpretacao') || normalizedTitle.includes('literatura')) {
    return 8;
  }

  if (normalizedLevel.includes('facil')) {
    return 6;
  }

  if (normalizedLevel.includes('dificil')) {
    return 12;
  }

  return 9;
}

function createPlaceholderQuestions(title: string, level: string): SimuladoQuestion[] {
  const total = getQuestionCountByType(title, level);
  const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];

  return Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    return {
      id: `q-${number}`,
      statement: `${title}: escolha a alternativa correta para este enunciado de nível ${level}.`,
      options: labels.map((label) => ({
        label,
        text: `Alternativa ${label} (placeholder) para a questão ${number}.`,
      })),
    };
  });
}

export default function SimuladoRevisarPage() {
  const router = useRouter();
  const params = useParams<{ simulado: string; nivel: string }>();
  const simulado = Array.isArray(params.simulado) ? params.simulado[0] : params.simulado;
  const nivel = Array.isArray(params.nivel) ? params.nivel[0] : params.nivel;

  const titulo = simulado ? safeDecode(simulado) : 'Simulado';
  const nivelExibido = nivel ? levelLabel(safeDecode(nivel)) : 'Nível';
  const questions = useMemo(() => createPlaceholderQuestions(titulo, nivelExibido), [titulo, nivelExibido]);
  
  const [userAnswers, setUserAnswers] = useState<Record<string, OptionLabel>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, OptionLabel>>({});
  const [loading, setLoading] = useState(true);

  const simuladoCompletionKey = useMemo(() => normalizeCompletionKey(titulo, nivelExibido), [titulo, nivelExibido]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const answersKey = `simulado_answers_${simuladoCompletionKey}`;
      const correctKey = `simulado_correct_answers_${simuladoCompletionKey}`;

      const storedAnswers = window.localStorage.getItem(answersKey);
      const storedCorrect = window.localStorage.getItem(correctKey);

      if (storedAnswers) {
        setUserAnswers(JSON.parse(storedAnswers) as Record<string, OptionLabel>);
      }

      if (storedCorrect) {
        setCorrectAnswers(JSON.parse(storedCorrect) as Record<string, OptionLabel>);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading answers:', error);
      setLoading(false);
    }
  }, [simuladoCompletionKey]);

  const handleVoltar = () => {
    router.push('/simulados');
  };

  if (loading) {
    return (
      <div className="simulados-page">
        <ChatSidebar />
        <main className="simulados-shell simulados-detail">
          <section className="simulado-runner">
            <p>Carregando revisão...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="simulados-page">
      <ChatSidebar />

      <main className="simulados-shell simulados-detail">
        <section className="simulado-runner">
          <header className="simulado-runner-header">
            <div>
              <p className="simulado-runner-kicker">Revisão do simulado</p>
              <h1>{titulo}</h1>
              <p>
                Nível selecionado: <strong>{nivelExibido}</strong>
              </p>
            </div>

            <div className="simulado-runner-progress" aria-live="polite">
              <span>Revisão</span>
              <p>Consulte suas respostas</p>
            </div>
          </header>

          <section className="simulado-question-list" aria-label="Revisão das questões do simulado">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const correctAnswer = correctAnswers[question.id];
              const isCorrect = userAnswer === correctAnswer;

              return (
                <article key={question.id} className="simulado-question-card">
                  <header>
                    <span className={`simulado-question-status ${isCorrect ? 'simulado-question-status--correct' : 'simulado-question-status--wrong'}`}>
                      Questão {index + 1} {isCorrect ? '✓' : '✗'}
                    </span>
                    <p>{question.statement}</p>
                  </header>

                  <div className="simulado-option-grid">
                    {question.options.map((option) => {
                      const isUserAnswer = userAnswer === option.label;
                      const isCorrectOption = correctAnswer === option.label;
                      let optionClassName = 'simulado-option simulado-option--review';

                      if (isCorrectOption) {
                        optionClassName += ' simulado-option--correct';
                      } else if (isUserAnswer && !isCorrect) {
                        optionClassName += ' simulado-option--wrong';
                      }

                      return (
                        <div
                          key={option.label}
                          className={optionClassName}
                        >
                          <span>{option.label}</span>
                          <p>{option.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>

          <footer className="simulado-runner-footer">
            <div className="simulado-runner-actions">
              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--primary"
                onClick={handleVoltar}
              >
                Voltar para simulados
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
