'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { simuladoService } from '@/services/simuladoService';
import type { Question } from '@/services/questionService';
import { getSimuladoAnswersStorageKey } from '@/utils/simuladoStorage';
import '../../../simulados.css';

type OptionLabel = 'A' | 'B' | 'C' | 'D' | 'E';

const NIVEL_TO_DIFFICULTY: Record<string, string> = {
  facil:   'FÁCIL',
  medio:   'MÉDIO',
  dificil: 'DIFÍCIL',
};

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
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  const normalizedLevel = level
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  return `${normalizedTitle}::${normalizedLevel}`;
}

export default function SimuladoRevisarPage() {
  const router = useRouter();
  const params = useParams<{ simulado: string; nivel: string }>();
  const simulado = Array.isArray(params.simulado) ? params.simulado[0] : params.simulado;
  const nivel = Array.isArray(params.nivel) ? params.nivel[0] : params.nivel;

  const titulo = simulado ? safeDecode(simulado) : 'Simulado';
  const nivelExibido = nivel ? levelLabel(safeDecode(nivel)) : 'Nível';

  const [questions, setQuestions] = useState<SimuladoQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, OptionLabel>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, OptionLabel>>({});
  const [loading, setLoading] = useState(true);
  const [noQuestions, setNoQuestions] = useState(false);

  const simuladoCompletionKey = useMemo(() => normalizeCompletionKey(titulo, nivelExibido), [titulo, nivelExibido]);

  useEffect(() => {
    let isMounted = true;

    const loadQuestionsAndAnswers = async () => {
      let tempQuestions: SimuladoQuestion[] = [];
      const tempCorrectAnswers: Record<string, OptionLabel> = {};
      let usedRealQuestions = false;

      try {
        const examsList = await simuladoService.list();
        const foundExam = examsList.find(
          (e) => e.titulo.toLowerCase().trim() === titulo.toLowerCase().trim()
        );

        if (foundExam && isMounted) {
          const difficulty = nivel ? NIVEL_TO_DIFFICULTY[safeDecode(nivel).toLowerCase()] : undefined;
          const apiQuestions = await simuladoService.getQuestions(foundExam.id, difficulty);
          if (apiQuestions && apiQuestions.length > 0) {
            tempQuestions = apiQuestions.map((q: Question) => {
              const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
              return {
                id: String(q.id),
                statement: q.description,
                options: q.alternatives.slice(0, 5).map((alt, altIdx) => ({
                  label: labels[altIdx] || 'A',
                  text: alt.description
                }))
              };
            });

            apiQuestions.forEach((q) => {
              const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
              const correctIdx = q.alternatives.slice(0, 5).findIndex((alt: any) => alt.is_correct);
              tempCorrectAnswers[String(q.id)] = labels[correctIdx >= 0 ? correctIdx : 0];
            });

            usedRealQuestions = true;
          }
        }
      } catch (err) {
        console.error('Erro ao carregar questões para revisão:', err);
      }

      if (isMounted) {
        if (!usedRealQuestions) {
          setNoQuestions(true);
          setLoading(false);
          return;
        }

        setQuestions(tempQuestions);
        setCorrectAnswers(tempCorrectAnswers);

        try {
          const storedAnswers = window.localStorage.getItem(
            getSimuladoAnswersStorageKey(simuladoCompletionKey)
          );
          if (storedAnswers) {
            setUserAnswers(JSON.parse(storedAnswers) as Record<string, OptionLabel>);
          }
        } catch (error) {
          console.error('Error loading answers from localStorage:', error);
        }

        setLoading(false);
      }
    };

    loadQuestionsAndAnswers();

    return () => {
      isMounted = false;
    };
  }, [titulo, nivelExibido, simuladoCompletionKey]);

  const handleVoltar = () => {
    router.push('/simulados');
  };

  if (loading) {
    return (
      <div className="simulados-page">
        <ChatSidebar />
        <main className="simulados-shell simulados-detail">
          <section className="simulado-runner">
            <p className="text-center text-[#64748b]">Carregando revisão...</p>
          </section>
        </main>
      </div>
    );
  }

  if (noQuestions) {
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
            </header>

            <div className="simulados-empty-state">
              <h2>Nenhuma questão disponível</h2>
              <p>Este simulado ainda não possui questões cadastradas.</p>
              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--ghost"
                onClick={handleVoltar}
              >
                Voltar para simulados
              </button>
            </div>
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
