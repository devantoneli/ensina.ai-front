'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { simuladoService } from '@/services/simuladoService';
import {
  getSimuladoAnswersStorageKey,
  getSimuladoCorrectAnswersStorageKey,
  getSimuladoKeysStorageKey,
  getSimuladoResultStorageKey,
} from '@/utils/simuladoStorage';
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
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  const normalizedLevel = level
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  return `${normalizedTitle}::${normalizedLevel}`;
}

export default function SimuladoResolverPage() {
  const router = useRouter();
  const params = useParams<{ simulado: string; nivel: string }>();
  const simulado = Array.isArray(params.simulado) ? params.simulado[0] : params.simulado;
  const nivel = Array.isArray(params.nivel) ? params.nivel[0] : params.nivel;

  const titulo = simulado ? safeDecode(simulado) : 'Simulado';
  const nivelExibido = nivel ? levelLabel(safeDecode(nivel)) : 'Nível';

  const [questions, setQuestions] = useState<SimuladoQuestion[]>([]);
  const [realCorrectAnswers, setRealCorrectAnswers] = useState<Record<string, OptionLabel>>({});
  const [loading, setLoading] = useState(true);
  const [noQuestions, setNoQuestions] = useState(false);

  const [answers, setAnswers] = useState<Record<string, OptionLabel>>({});
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const simuladoCompletionKey = useMemo(() => normalizeCompletionKey(titulo, nivelExibido), [titulo, nivelExibido]);

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      try {
        const examsList = await simuladoService.list();
        const foundExam = examsList.find(
          (e) => e.titulo.toLowerCase().trim() === titulo.toLowerCase().trim()
        );

        if (foundExam && isMounted) {
          const apiQuestions = await simuladoService.getQuestions(foundExam.id);
          if (apiQuestions && apiQuestions.length > 0) {
            const mappedQuestions: SimuladoQuestion[] = apiQuestions.map((q) => {
              const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
              return {
                id: String(q.id),
                statement: q.description,
                options: q.alternatives.slice(0, 5).map((alt: any, altIdx: number) => ({
                  label: labels[altIdx] || 'A',
                  text: alt.description
                }))
              };
            });

            const correctMap: Record<string, OptionLabel> = {};
            apiQuestions.forEach((q) => {
              const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
              const correctIdx = q.alternatives.slice(0, 5).findIndex((alt: any) => alt.is_correct);
              correctMap[String(q.id)] = labels[correctIdx >= 0 ? correctIdx : 0];
            });

            setQuestions(mappedQuestions);
            setRealCorrectAnswers(correctMap);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao carregar questões do simulado:', err);
      }

      if (isMounted) {
        setNoQuestions(true);
        setLoading(false);
      }
    };

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [titulo, nivelExibido]);

  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id])).length,
    [questions, answers],
  );

  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const handleSelectOption = (questionId: string, option: OptionLabel) => {
    setAnswers((current) => ({ ...current, [questionId]: option }));
  };

  const handleFinalize = () => {
    if (!allAnswered) return;

    try {
      if (typeof window !== 'undefined') {
        const completedKeysKey = getSimuladoKeysStorageKey();
        const raw = window.localStorage.getItem(completedKeysKey);
        const keys = raw ? (JSON.parse(raw) as string[]) : [];
        const unique = Array.isArray(keys) ? Array.from(new Set([...keys, simuladoCompletionKey])) : [simuladoCompletionKey];
        window.localStorage.setItem(completedKeysKey, JSON.stringify(unique));

        const correct = questions.filter((q) => answers[q.id] === realCorrectAnswers[q.id]).length;
        const total = questions.length;
        const percentage = Math.round((correct / total) * 100);

        window.localStorage.setItem(getSimuladoAnswersStorageKey(simuladoCompletionKey), JSON.stringify(answers));
        window.localStorage.setItem(getSimuladoCorrectAnswersStorageKey(simuladoCompletionKey), JSON.stringify(realCorrectAnswers));
        window.localStorage.setItem(
          getSimuladoResultStorageKey(simuladoCompletionKey),
          JSON.stringify({ correct, total, percentage })
        );
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }

    const nivelEncoded = encodeURIComponent(nivel ?? 'medio');
    router.push(`/simulados/${encodeURIComponent(titulo)}/${nivelEncoded}/resultado`);
  };

  const handleConfirmExit = () => {
    setAnswers({});
    setIsExitModalOpen(false);
    router.push('/simulados');
  };

  if (loading) {
    return (
      <div className="simulados-page">
        <ChatSidebar />
        <main className="simulados-shell simulados-detail">
          <div className="py-12 text-center text-[#64748b]">Carregando questões do simulado...</div>
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
                <p className="simulado-runner-kicker">Execução do simulado</p>
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
                onClick={() => router.push('/simulados')}
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
              <p className="simulado-runner-kicker">Execução do simulado</p>
              <h1>{titulo}</h1>
              <p>
                Nível selecionado: <strong>{nivelExibido}</strong>
              </p>
            </div>

            <div className="simulado-runner-progress" aria-live="polite">
              <span>{answeredCount}/{questions.length}</span>
              <p>Questões respondidas</p>
            </div>
          </header>

          <div className="simulado-runner-info">
            <article>
              <p>Total de questões</p>
              <strong>{questions.length}</strong>
            </article>
            <article>
              <p>Alternativas</p>
              <strong>A, B, C, D e E</strong>
            </article>
            <article>
              <p>Status</p>
              <strong>Em andamento</strong>
            </article>
          </div>

          <section className="simulado-question-list" aria-label="Lista de questões do simulado">
            {questions.map((question, index) => (
              <article key={question.id} className="simulado-question-card">
                <header>
                  <span>Questão {index + 1}</span>
                  <p>{question.statement}</p>
                </header>

                <div className="simulado-option-grid">
                  {question.options.map((option) => {
                    const checked = answers[question.id] === option.label;

                    return (
                      <button
                        key={option.label}
                        type="button"
                        className={`simulado-option ${checked ? 'simulado-option--selected' : ''}`}
                        onClick={() => handleSelectOption(question.id, option.label)}
                        aria-pressed={checked}
                      >
                        <span>{option.label}</span>
                        <p>{option.text}</p>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>

          <footer className="simulado-runner-footer">
            <p>Você só pode finalizar quando todas as questões estiverem respondidas.</p>

            <div className="simulado-runner-actions">
              <div className="simulado-runner-actions-left">
                <button
                  type="button"
                  className="simulado-runner-button simulado-runner-button--ghost"
                  onClick={() => setIsExitModalOpen(true)}
                >
                  Voltar para simulados
                </button>
              </div>
              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--primary"
                onClick={handleFinalize}
                disabled={!allAnswered}
                title={!allAnswered ? 'Responda todas as questões para finalizar' : undefined}
              >
                Finalizar simulado
              </button>
            </div>
          </footer>
        </section>

        {isExitModalOpen ? (
          <div className="simulado-exit-modal" role="dialog" aria-modal="true" aria-label="Confirmar saída do simulado">
            <button
              type="button"
              className="simulado-exit-modal-backdrop"
              aria-label="Fechar confirmação"
              onClick={() => setIsExitModalOpen(false)}
            />
            <div className="simulado-exit-modal-card">
              <h2>Sair do simulado?</h2>
              <p>Se você sair agora, o progresso atual será redefinido.</p>
              <div>
                <button
                  type="button"
                  className="simulado-runner-button simulado-runner-button--ghost"
                  onClick={() => setIsExitModalOpen(false)}
                >
                  Continuar no simulado
                </button>
                <button
                  type="button"
                  className="simulado-runner-button simulado-runner-button--primary"
                  onClick={handleConfirmExit}
                >
                  Sair e redefinir
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
