'use client';

import { useState, useEffect, useMemo } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { useProgress } from '@/hooks/useProgress';
import { simuladoService } from '@/services/simuladoService';
import { adminService } from '@/services/adminService';
import type { Question } from '@/services/questionService';
import type { ProgressDashboard, TopicAccuracy } from '@/services/progressService';
import { getSimuladoKeysStorageKey, getSimuladoResultStorageKey } from '@/utils/simuladoStorage';
import './desempenho.css';

// ── Ícones SVG inline ──────────────────────────────────────

function IconTrophy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M8 21h8M12 17v4M5 3H3v4a4 4 0 004 4h.5M19 3h2v4a4 4 0 01-4 4h-.5M7 3h10v6a5 5 0 01-10 0V3z"
        stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="white" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 17l5-5 4 4 7-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Cores para o gráfico de pizza ─────────────────────────

const PIE_COLORS = ['#4791df', '#f97316', '#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#60a5fa'];

function buildConicGradient(slices: { value: number; color: string }[]): string {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (!total) return 'conic-gradient(#e2e8f0 0deg 360deg)';

  let current = 0;
  const parts: string[] = [];
  for (const sl of slices) {
    const deg = (sl.value / total) * 360;
    parts.push(`${sl.color} ${current}deg ${current + deg}deg`);
    current += deg;
  }
  return `conic-gradient(${parts.join(', ')})`;
}

function formatPtDate(value?: string | null): string {
  if (!value) return 'Sem atividades ainda';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Componente principal ──────────────────────────────────

export default function DesempenhoPage() {
  const { dashboard: backendDashboard, isLoading: isBackendLoading } = useProgress();
  const [combinedDashboard, setCombinedDashboard] = useState<ProgressDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simuladoMateriaTotals, setSimuladoMateriaTotals] = useState<Array<{ label: string; value: number }>>([]);

  useEffect(() => {
    if (isBackendLoading) return;

    const mergeData = async () => {
      try {
        const examsList = await simuladoService.list();
        const rawKeys = window.localStorage.getItem(getSimuladoKeysStorageKey());
        const completedKeys = rawKeys ? (JSON.parse(rawKeys) as string[]) : [];

        let contentToDiscipline = new Map<number, string>();
        try {
          const [contents, disciplines] = await Promise.all([
            adminService.getContents(),
            adminService.getDisciplines(),
          ]);
          const disciplineMap = new Map(disciplines.map((d) => [d.id, d.name]));
          contentToDiscipline = new Map(
            contents.map((c) => [c.id, disciplineMap.get(c.discipline_id) ?? 'Geral'])
          );
        } catch (error) {
          console.warn('Nao foi possivel carregar conteudos/disciplinas:', error);
        }

        let simulatedCorrect = 0;
        let simulatedWrong = 0;
        let simulatedTotal = 0;
        const simulatedTopicStats: Record<string, { correct: number; wrong: number; total: number }> = {};

        completedKeys.forEach((key) => {
          const resultRaw = window.localStorage.getItem(getSimuladoResultStorageKey(key));
          if (!resultRaw) return;

          const result = JSON.parse(resultRaw) as { correct: number; total: number; percentage: number };
          simulatedCorrect += result.correct;
          simulatedWrong += (result.total - result.correct);
          simulatedTotal += result.total;

          const [titlePart] = key.split('::');
          const matchedExam = examsList.find(
            (e) => e.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === titlePart.trim()
          );
          const topic = matchedExam ? matchedExam.materia : 'Simulados';

          if (!simulatedTopicStats[topic]) {
            simulatedTopicStats[topic] = { correct: 0, wrong: 0, total: 0 };
          }
          simulatedTopicStats[topic].correct += result.correct;
          simulatedTopicStats[topic].wrong += (result.total - result.correct);
          simulatedTopicStats[topic].total += result.total;
        });

        // Distribuicao por materia baseada nas questoes do simulado
        const completedExams = new Map<string, { id: string; materia?: string; questoes?: number }>();
        completedKeys.forEach((key) => {
          const [titlePart] = key.split('::');
          const matchedExam = examsList.find(
            (e) => e.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === titlePart.trim()
          );
          if (matchedExam) {
            completedExams.set(matchedExam.id, matchedExam);
          }
        });

        const examsWithQuestions = await Promise.all(
          Array.from(completedExams.values()).map(async (exam) => {
            const questions = await simuladoService.getQuestions(exam.id);
            return { exam, questions };
          })
        );

        const materiaTotalsMap = new Map<string, number>();
        examsWithQuestions.forEach(({ exam, questions }) => {
          const fallbackMateria = exam.materia ?? 'Geral';

          if (!questions || questions.length === 0) {
            const fallbackTotal = Number(exam.questoes ?? 0);
            if (fallbackTotal > 0) {
              materiaTotalsMap.set(
                fallbackMateria,
                (materiaTotalsMap.get(fallbackMateria) ?? 0) + fallbackTotal
              );
            }
            return;
          }

          questions.forEach((question: Question & { contentId?: number; content?: { id?: number } }) => {
            const rawContentId = question.content_id ?? question.contentId ?? question.content?.id;
            const contentId = typeof rawContentId === 'number' ? rawContentId : Number(rawContentId);
            const disciplina = Number.isFinite(contentId)
              ? contentToDiscipline.get(contentId)
              : undefined;
            const materia = disciplina ?? fallbackMateria;
            materiaTotalsMap.set(materia, (materiaTotalsMap.get(materia) ?? 0) + 1);
          });
        });

        const materiaTotals = Array.from(materiaTotalsMap.entries())
          .map(([label, value]) => ({ label, value }))
          .filter((item) => item.value > 0);
        setSimuladoMateriaTotals(materiaTotals);

        const db: ProgressDashboard = backendDashboard
          ? {
              study_time: { ...backendDashboard.study_time },
              accuracy: { ...backendDashboard.accuracy, by_topic: [...backendDashboard.accuracy.by_topic] },
              studied_contents: [...backendDashboard.studied_contents],
              weak_topics: [...backendDashboard.weak_topics],
            }
          : {
              study_time: { total_messages: 0, total_sessions: 0, last_studied_at: null },
              accuracy: { total: 0, correct: 0, wrong: 0, accuracy_pct: 0, by_topic: [] },
              studied_contents: [],
              weak_topics: []
            };

        db.study_time.total_sessions += completedKeys.length;

        const backendTopics = db.accuracy.by_topic || [];
        const mergedTopicsMap: Record<string, TopicAccuracy> = {};

        backendTopics.forEach((t) => {
          mergedTopicsMap[t.topic] = {
            topic: t.topic,
            correct: t.correct,
            wrong: t.wrong,
            total: t.total
          };
        });

        Object.entries(simulatedTopicStats).forEach(([topicName, stats]) => {
          if (mergedTopicsMap[topicName]) {
            mergedTopicsMap[topicName].correct += stats.correct;
            mergedTopicsMap[topicName].wrong += stats.wrong;
            mergedTopicsMap[topicName].total += stats.total;
          } else {
            mergedTopicsMap[topicName] = {
              topic: topicName,
              correct: stats.correct,
              wrong: stats.wrong,
              total: stats.total
            };
          }
        });

        const mergedTopicsList = Object.values(mergedTopicsMap).map((t) => ({
          topic: t.topic,
          correct: t.correct,
          wrong: t.wrong,
          total: t.total,
          accuracy_pct: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0
        }));

        db.accuracy.by_topic = mergedTopicsList;

        const overallCorrect = mergedTopicsList.reduce((sum, t) => sum + t.correct, 0);
        const overallWrong = mergedTopicsList.reduce((sum, t) => sum + t.wrong, 0);
        const overallTotal = mergedTopicsList.reduce((sum, t) => sum + t.total, 0);
        const overallPct = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

        db.accuracy.correct = overallCorrect;
        db.accuracy.wrong = overallWrong;
        db.accuracy.total = overallTotal;
        db.accuracy.accuracy_pct = overallPct;

        const weak = mergedTopicsList.filter((t) => t.accuracy_pct < 70);
        weak.sort((a, b) => a.accuracy_pct - b.accuracy_pct);
        db.weak_topics = weak;

        setCombinedDashboard(db);
      } catch (err) {
        console.error('Erro ao mesclar dados de simulados no desempenho:', err);
        setCombinedDashboard(backendDashboard);
        setSimuladoMateriaTotals([]);
      } finally {
        setIsLoading(false);
      }
    };

    void mergeData();
  }, [backendDashboard, isBackendLoading]);

  const dashboard = combinedDashboard;
  const accuracy     = dashboard?.accuracy;
  const studyTime    = dashboard?.study_time;
  const byTopic: TopicAccuracy[] = accuracy?.by_topic ?? [];
  const weakTopics   = dashboard?.weak_topics ?? [];
  const bestTopic    = byTopic.length
    ? byTopic.reduce((a, b) => (a.accuracy_pct >= b.accuracy_pct ? a : b))
    : null;
  const lastStudiedLabel = formatPtDate(studyTime?.last_studied_at ?? null);

  // Slices do gráfico de pizza
  const pieSlices = useMemo(() => {
    return simuladoMateriaTotals.map((item, i: number) => ({
      label: item.label,
      value: item.value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [simuladoMateriaTotals]);

  // Recomendações dinâmicas
  const recs: { type: 'red' | 'yellow' | 'green'; icon: string; title: string; text: string }[] = [];

  if (weakTopics.length > 0) {
    recs.push({
      type: 'red',
      icon: '🎯',
      title: `Foco em ${weakTopics[0].topic}`,
      text: `Taxa de acerto de ${weakTopics[0].accuracy_pct}%. Recomendamos praticar mais questões sobre este tópico.`,
    });
  }

  if (weakTopics.length > 1) {
    recs.push({
      type: 'yellow',
      icon: '⏰',
      title: `Aumente o tempo em ${weakTopics[1].topic}`,
      text: `Apenas ${weakTopics[1].accuracy_pct}% de acerto. Revise os conceitos fundamentais.`,
    });
  }

  if (bestTopic && bestTopic.accuracy_pct >= 80) {
    recs.push({
      type: 'green',
      icon: '🏆',
      title: `Excelente em ${bestTopic.topic}!`,
      text: `${bestTopic.accuracy_pct}% de acerto. Continue assim e explore tópicos avançados.`,
    });
  }

  // Fallback se sem dados no modo Geral
  if (recs.length === 0 && !isLoading) {
    recs.push({
      type: 'yellow',
      icon: '💬',
      title: 'Comece a interagir',
      text: 'Responda questões no chat para receber recomendações personalizadas.',
    });
  }

  return (
    <div className="desempenho-page">
      <ChatSidebar />

      <main className="desempenho-main">
        {/* Header */}
        <header className="desempenho-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 className="desempenho-title">Análise de Desempenho</h1>
        </header>

        {/* Subtitle */}
        <div className="desempenho-subtitle-card">
          Acompanhe sua evolução e identifique áreas de melhoria
        </div>

        {isLoading ? (
          <div className="desempenho-loading">Carregando seu desempenho...</div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="desempenho-stats-grid">
              <div className="desempenho-stat-card desempenho-stat-card--blue">
                <div className="desempenho-stat-icon"><IconTrophy /></div>
                <div>
                  <p className="desempenho-stat-label">Taxa de Acerto</p>
                  <p className="desempenho-stat-value">
                    {accuracy?.accuracy_pct != null ? `${accuracy.accuracy_pct}%` : '--%'}
                  </p>
                </div>
              </div>

              <div className="desempenho-stat-card desempenho-stat-card--orange">
                <div className="desempenho-stat-icon"><IconTarget /></div>
                <div>
                  <p className="desempenho-stat-label">Questões Resolvidas</p>
                  <p className="desempenho-stat-value">
                    {accuracy?.total != null ? accuracy.total : '--'}
                  </p>
                </div>
              </div>

              <div className="desempenho-stat-card desempenho-stat-card--teal">
                <div className="desempenho-stat-icon"><IconClock /></div>
                <div>
                  <p className="desempenho-stat-label">Mensagens Trocadas</p>
                  <p className="desempenho-stat-value">
                    {studyTime?.total_messages != null ? studyTime.total_messages : '--'}
                  </p>
                </div>
              </div>

              <div className="desempenho-stat-card desempenho-stat-card--blue2">
                <div className="desempenho-stat-icon"><IconTrend /></div>
                <div>
                  <p className="desempenho-stat-label">Respostas corretas</p>
                  <p className="desempenho-stat-value">
                    {accuracy?.correct != null ? accuracy.correct : '--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom grid */}
            <div className="desempenho-bottom-grid">
              {/* Gráfico de barras por tópico */}
              <div className="desempenho-card">
                <h2 className="desempenho-card-title">Desempenho por Tópico</h2>

                {byTopic.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                    Nenhum tópico registrado ainda. Responda questões no chat!
                  </p>
                ) : (
                  <>
                    <div className="desempenho-bar-chart">
                      {byTopic.map((t) => (
                        <div className="desempenho-bar-row" key={t.topic}>
                          <span className="desempenho-bar-label">{t.topic}</span>

                          <div className="desempenho-bar-track">
                            <div
                              className="desempenho-bar-fill desempenho-bar-fill--correct"
                              style={{ width: `${t.accuracy_pct}%` }}
                            />
                          </div>

                          <div className="desempenho-bar-track" style={{ height: 6 }}>
                            <div
                              className="desempenho-bar-fill desempenho-bar-fill--wrong"
                              style={{ width: `${100 - t.accuracy_pct}%` }}
                            />
                          </div>

                          <div className="desempenho-bar-meta">
                            <span>{t.correct} acertos</span>
                            <span>{t.wrong} erros</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="desempenho-bar-legend">
                      <div className="desempenho-legend-item">
                        <div className="desempenho-legend-dot" style={{ background: '#fca5a5' }} />
                        <span>Erros %</span>
                      </div>
                      <div className="desempenho-legend-item">
                        <div className="desempenho-legend-dot" style={{ background: '#4791df' }} />
                        <span>Acertos %</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Recomendações */}
              <div className="desempenho-card">
                <h2 className="desempenho-card-title">Recomendações</h2>
                <div className="desempenho-recs">
                  {recs.map((rec, i) => (
                    <div key={i} className={`desempenho-rec-card desempenho-rec-card--${rec.type}`}>
                      <div className={`desempenho-rec-icon desempenho-rec-icon--${rec.type}`}>
                        {rec.icon}
                      </div>
                      <div>
                        <p className={`desempenho-rec-title desempenho-rec-title--${rec.type}`}>
                          {rec.title}
                        </p>
                        <p className="desempenho-rec-text">{rec.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico de pizza — distribuição por matéria */}
              <div className="desempenho-card">
                <h2 className="desempenho-card-title">Distribuição de Questões por Matéria</h2>

                {pieSlices.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                    Sem dados de simulados por matéria ainda.
                  </p>
                ) : (
                  <div className="desempenho-pie-wrapper">
                    <div
                      className="desempenho-pie"
                      style={{ background: buildConicGradient(pieSlices) }}
                    />
                    <div className="desempenho-pie-legend">
                      {pieSlices.map((sl) => (
                        <div className="desempenho-pie-legend-item" key={sl.label}>
                          <div className="desempenho-pie-legend-dot" style={{ background: sl.color }} />
                          <span>{sl.label} ({sl.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo de sessões */}
              <div className="desempenho-card">
                <h2 className="desempenho-card-title">Resumo de Estudo</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Total de sessões',    value: studyTime?.total_sessions ?? '--' },
                    { label: 'Última atividade no chat',    value: lastStudiedLabel },
                    { label: 'Respostas erradas',   value: accuracy?.wrong ?? '--' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <span style={{ fontSize: '0.88rem', color: '#64748b' }}>{item.label}</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#2f79cb' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}