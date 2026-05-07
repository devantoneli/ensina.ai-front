'use client';

import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { useProgress } from '@/hooks/useProgress';
import './desempenho.css';

// ── Ícones SVG inline ──────────────────────────────────────

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M15 19l-7-7 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

// ── Componente principal ──────────────────────────────────

export default function DesempenhoPage() {
  const router = useRouter();
  const { dashboard, isLoading } = useProgress();

  const accuracy     = dashboard?.accuracy;
  const studyTime    = dashboard?.study_time;
  const byTopic      = accuracy?.by_topic ?? [];
  const weakTopics   = dashboard?.weak_topics ?? [];
  const bestTopic    = byTopic.length
    ? byTopic.reduce((a, b) => (a.accuracy_pct >= b.accuracy_pct ? a : b))
    : null;

  // Slices do gráfico de pizza (mensagens por tópico — proxy de tempo)
  const pieSlices = byTopic.map((t, i) => ({
    label: t.topic,
    value: t.total,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

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

  // Fallback se sem dados
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
        <header className="desempenho-header">
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
                  <p className="desempenho-stat-label">Tempo de Estudo</p>
                  <p className="desempenho-stat-value">
                    {studyTime?.total_messages != null ? `${studyTime.total_messages} msg` : '--'}
                  </p>
                </div>
              </div>

              <div className="desempenho-stat-card desempenho-stat-card--blue2">
                <div className="desempenho-stat-icon"><IconTrend /></div>
                <div>
                  <p className="desempenho-stat-label">% da Melhor Matéria</p>
                  <p className="desempenho-stat-value">
                    {bestTopic ? `${bestTopic.accuracy_pct}%` : '--%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom grid */}
            <div className="desempenho-bottom-grid">
              {/* Gráfico de barras por tópico */}
              <div className="desempenho-card">
                <h2 className="desempenho-card-title">Desempenho por Tópico de Português</h2>

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

              {/* Gráfico de pizza — distribuição de tópicos */}
              <div className="desempenho-card">
                <h2 className="desempenho-card-title">Distribuição de Tempo de Estudo</h2>

                {pieSlices.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                    Sem dados suficientes ainda.
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


            </div>
          </>
        )}
      </main>
    </div>
  );
}
