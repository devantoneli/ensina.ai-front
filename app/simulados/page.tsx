'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { Simulado } from '@/types/simulados';
import './simulados.css';

type NivelFiltro = 'Todos' | 'Fácil' | 'Médio' | 'Difícil';
type TempoFiltro = 'Todos' | 'Ate20' | '21-35' | '36+';
type QuestoesFiltro = 'Todas' | 'Ate10' | '11-15' | '16+';

const SIMULADOS_EXEMPLO: Simulado[] = [
  {
    id: '1',
    titulo: 'Gramática - Crase e Preposições',
    descricao: 'Teste seus conhecimentos sobre crase, regência e o uso correto das preposições.',
    nivel: 'Médio',
    questoes: 10,
    tempoEstimado: 30,
    categoria: 'Gramática',
  },
  {
    id: '2',
    titulo: 'Pontuação - Vírgulas e Pontos',
    descricao: 'Pratique os usos mais comuns da pontuação em textos formais e informais.',
    nivel: 'Fácil',
    questoes: 8,
    tempoEstimado: 20,
    categoria: 'Pontuação',
  },
  {
    id: '3',
    titulo: 'Ortografia - Palavras Difíceis',
    descricao: 'Resolva questões sobre grafia, acentuação e palavras que geram dúvida.',
    nivel: 'Difícil',
    questoes: 15,
    tempoEstimado: 45,
    categoria: 'Ortografia',
  },
  {
    id: '4',
    titulo: 'Acentuação Gráfica',
    descricao: 'Fixe as regras de acentuação com exercícios práticos e objetivos.',
    nivel: 'Médio',
    questoes: 12,
    tempoEstimado: 35,
    categoria: 'Acentuação',
  },
  {
    id: '5',
    titulo: 'Concordância Verbal e Nominal',
    descricao: 'Aprofunde a concordância entre termos na frase com exemplos do dia a dia.',
    nivel: 'Difícil',
    questoes: 14,
    tempoEstimado: 40,
    categoria: 'Gramática',
  },
  {
    id: '6',
    titulo: 'Interpretação de Textos',
    descricao: 'Treine leitura, inferência e compreensão textual com situações reais.',
    nivel: 'Médio',
    questoes: 10,
    tempoEstimado: 30,
    categoria: 'Interpretação',
  },
  {
    id: '7',
    titulo: 'Verbos - Conjugação Completa',
    descricao: 'Domine tempos verbais e conjugações mais cobradas em prova.',
    nivel: 'Médio',
    questoes: 16,
    tempoEstimado: 45,
    categoria: 'Gramática',
  },
  {
    id: '8',
    titulo: 'Pronomes e suas Funções',
    descricao: 'Entenda os pronomes pessoais, possessivos, demonstrativos e seus usos.',
    nivel: 'Fácil',
    questoes: 10,
    tempoEstimado: 25,
    categoria: 'Gramática',
  },
  {
    id: '9',
    titulo: 'Figuras de Linguagem',
    descricao: 'Identifique recursos expressivos e interprete efeitos de sentido.',
    nivel: 'Difícil',
    questoes: 12,
    tempoEstimado: 40,
    categoria: 'Literatura',
  },
  {
    id: '10',
    titulo: 'Semântica - Sinônimos e Antônimos',
    descricao: 'Amplie o vocabulário e avance na leitura de contexto e significado.',
    nivel: 'Fácil',
    questoes: 10,
    tempoEstimado: 20,
    categoria: 'Semântica',
  },
];

const NIVEL_OPTIONS: NivelFiltro[] = ['Todos', 'Fácil', 'Médio', 'Difícil'];
const MATERIA_OPTIONS = [
  'Todas',
  ...Array.from(new Set(SIMULADOS_EXEMPLO.map((simulado) => simulado.categoria))).sort(),
];
const TEMPO_OPTIONS: Array<{ value: TempoFiltro; label: string }> = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Ate20', label: 'Até 20 min' },
  { value: '21-35', label: '21-35 min' },
  { value: '36+', label: '36+ min' },
];
const QUESTOES_OPTIONS: Array<{ value: QuestoesFiltro; label: string }> = [
  { value: 'Todas', label: 'Todas' },
  { value: 'Ate10', label: 'Até 10' },
  { value: '11-15', label: '11-15' },
  { value: '16+', label: '16+' },
];

function levelToPathSegment(level: string): string {
  return level
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6H20M7 12H17M10 18H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4.5H18.5C19.3284 4.5 20 5.17157 20 6V19.5H7.5C6.11929 19.5 5 18.3807 5 17V6.5C5 5.39543 5.89543 4.5 7 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.5 19.5H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 8.5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 11.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 9.5C9.5 7.567 11.067 6 13 6C14.933 6 16.5 7.567 16.5 9.5C16.5 11.1055 15.4164 12.4747 13.9 12.8719C12.7923 13.1622 12 14.162 12 15.3077V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

export default function SimuladosPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<NivelFiltro>('Todos');
  const [filtroMateria, setFiltroMateria] = useState('Todas');
  const [filtroTempo, setFiltroTempo] = useState<TempoFiltro>('Todos');
  const [filtroQuestoes, setFiltroQuestoes] = useState<QuestoesFiltro>('Todas');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const clearFilters = () => {
    setBusca('');
    setFiltroNivel('Todos');
    setFiltroMateria('Todas');
    setFiltroTempo('Todos');
    setFiltroQuestoes('Todas');
  };

  const simuladosFiltrados = useMemo(() => {
    const query = busca.trim().toLowerCase();

    return SIMULADOS_EXEMPLO.filter((simulado) => {
      const matchBusca =
        !query ||
        simulado.titulo.toLowerCase().includes(query) ||
        simulado.descricao.toLowerCase().includes(query) ||
        simulado.categoria.toLowerCase().includes(query);

      const matchNivel = filtroNivel === 'Todos' || simulado.nivel === filtroNivel;
      const matchMateria = filtroMateria === 'Todas' || simulado.categoria === filtroMateria;
      const matchTempo =
        filtroTempo === 'Todos' ||
        (filtroTempo === 'Ate20' && simulado.tempoEstimado <= 20) ||
        (filtroTempo === '21-35' && simulado.tempoEstimado >= 21 && simulado.tempoEstimado <= 35) ||
        (filtroTempo === '36+' && simulado.tempoEstimado >= 36);
      const matchQuestoes =
        filtroQuestoes === 'Todas' ||
        (filtroQuestoes === 'Ate10' && simulado.questoes <= 10) ||
        (filtroQuestoes === '11-15' && simulado.questoes >= 11 && simulado.questoes <= 15) ||
        (filtroQuestoes === '16+' && simulado.questoes >= 16);

      return matchBusca && matchNivel && matchMateria && matchTempo && matchQuestoes;
    });
  }, [busca, filtroNivel, filtroMateria, filtroTempo, filtroQuestoes]);

  const totalFiltrados = simuladosFiltrados.length;
  const totalMaterias = new Set(simuladosFiltrados.map((simulado) => simulado.categoria)).size;
  const totalQuestoes = simuladosFiltrados.reduce((acc, simulado) => acc + simulado.questoes, 0);

  const getNivelClass = (nivel: string) => {
    switch (nivel) {
      case 'Fácil':
        return 'simulado-card-badge--easy';
      case 'Médio':
        return 'simulado-card-badge--medium';
      case 'Difícil':
        return 'simulado-card-badge--hard';
      default:
        return '';
    }
  };

  const handleIniciarSimulado = (id: string) => {
    const simulado = SIMULADOS_EXEMPLO.find((item) => item.id === id);
    if (!simulado) return;

    router.push(`/simulados/${encodeURIComponent(simulado.titulo)}/${levelToPathSegment(simulado.nivel)}`);
  };

  return (
    <div className="simulados-page">
      <ChatSidebar />

      <main className="simulados-shell">
        <section className="simulados-hero">
          <div>
            <p className="simulados-kicker">Simulados pré-prontos</p>
            <h1>Escolha um simulado e comece a praticar</h1>
            <p className="simulados-description">
              Encontre atividades organizadas por tema e nível, seguindo o visual leve e limpo do restante da plataforma.
            </p>
          </div>
        </section>

        <div className="simulados-controls">
          <section className="simulados-toolbar" aria-label="Busca e filtros de simulados">
            <div className="simulados-searchbox">
              <SearchIcon />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Busque pelo simulado que deseja"
                aria-label="Buscar simulados"
              />
              <button
                type="button"
                className="simulados-icon-button"
                aria-label="Abrir filtros"
                onClick={() => setIsFilterModalOpen(true)}
              >
                <FilterIcon />
              </button>
              <button
                type="button"
                className="simulados-icon-button"
                aria-label="Limpar filtros"
                onClick={clearFilters}
              >
                <ClearIcon />
              </button>
            </div>

            <div className="simulados-level-filters" role="tablist" aria-label="Filtrar por nível">
              {NIVEL_OPTIONS.map((nivel) => (
                <button
                  key={nivel}
                  type="button"
                  role="tab"
                  aria-selected={filtroNivel === nivel}
                  className={`simulados-level-pill ${filtroNivel === nivel ? 'simulados-level-pill--active' : ''}`}
                  onClick={() => setFiltroNivel(nivel)}
                >
                  {nivel}
                </button>
              ))}
            </div>
          </section>

          <div className="simulados-stats">
            <article>
              <span>{totalFiltrados}</span>
              <p>Simulados visíveis</p>
            </article>
            <article>
              <span>{totalMaterias}</span>
              <p>Temas diferentes</p>
            </article>
            <article>
              <span>{totalQuestoes}</span>
              <p>Questões na lista</p>
            </article>
          </div>
        </div>

        {isFilterModalOpen ? (
          <div className="simulados-filter-modal" role="dialog" aria-modal="true" aria-label="Filtros avançados">
            <button
              type="button"
              className="simulados-filter-backdrop"
              aria-label="Fechar filtros"
              onClick={() => setIsFilterModalOpen(false)}
            />
            <div className="simulados-filter-card">
              <div className="simulados-filter-header">
                <h2 className="simulados-filter-title">Filtros</h2>
                <button
                  type="button"
                  className="simulados-filter-close"
                  aria-label="Fechar filtros"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  <ClearIcon />
                </button>
              </div>
              <div className="simulados-filter-grid">
                <div className="simulados-filter-section">
                  <h3>Categoria</h3>
                  <div className="simulados-filter-chips">
                    {NIVEL_OPTIONS.map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        className={`simulados-filter-chip ${filtroNivel === nivel ? 'simulados-filter-chip--active' : ''}`}
                        onClick={() => setFiltroNivel(nivel)}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="simulados-filter-section">
                  <h3>Tipo de matéria</h3>
                  <select
                    className="simulados-filter-select"
                    aria-label="Filtrar por matéria"
                    value={filtroMateria}
                    onChange={(e) => setFiltroMateria(e.target.value)}
                  >
                    {MATERIA_OPTIONS.map((materia) => (
                      <option key={materia} value={materia}>
                        {materia}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="simulados-filter-section">
                  <h3>Quantidade de questões</h3>
                  <div className="simulados-filter-chips">
                    {QUESTOES_OPTIONS.map((opcao) => (
                      <button
                        key={opcao.value}
                        type="button"
                        className={`simulados-filter-chip ${filtroQuestoes === opcao.value ? 'simulados-filter-chip--active' : ''}`}
                        onClick={() => setFiltroQuestoes(opcao.value)}
                      >
                        {opcao.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="simulados-filter-section">
                  <h3>Tempo de simulado</h3>
                  <div className="simulados-filter-chips">
                    {TEMPO_OPTIONS.map((opcao) => (
                      <button
                        key={opcao.value}
                        type="button"
                        className={`simulados-filter-chip ${filtroTempo === opcao.value ? 'simulados-filter-chip--active' : ''}`}
                        onClick={() => setFiltroTempo(opcao.value)}
                      >
                        {opcao.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="simulados-filter-footer">
                <button
                  type="button"
                  className="simulados-filter-button simulados-filter-button--ghost"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </button>
                <button
                  type="button"
                  className="simulados-filter-button simulados-filter-button--primary"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {simuladosFiltrados.length > 0 ? (
          <section className="simulados-grid" aria-label="Lista de simulados">
            {simuladosFiltrados.map((simulado, index) => (
              <article key={simulado.id} className="simulado-card" style={{ animationDelay: `${index * 45}ms` }}>
                <div className="simulado-card-top">
                  <div className="simulado-card-book">
                    <BookIcon />
                  </div>
                  <span className={`simulado-card-badge ${getNivelClass(simulado.nivel)}`}>{simulado.nivel}</span>
                </div>

                <h2>{simulado.titulo}</h2>
                <p className="simulado-card-text">{simulado.descricao}</p>

                <div className="simulado-card-meta">
                  <div>
                    <QuestionIcon />
                    <span>{simulado.questoes} questões</span>
                  </div>
                  <div>
                    <ClockIcon />
                    <span>{simulado.tempoEstimado} min</span>
                  </div>
                  <div>
                    <BookIcon />
                    <span>{simulado.categoria}</span>
                  </div>
                </div>

                <button type="button" className="simulado-card-action" onClick={() => handleIniciarSimulado(simulado.id)}>
                  Iniciar Simulado
                </button>
              </article>
            ))}
          </section>
        ) : (
          <section className="simulados-empty-state">
            <div className="simulados-empty-icon">
              <SearchIcon />
            </div>
            <h2>Nenhum simulado encontrado</h2>
            <p>Experimente limpar a busca ou trocar o nível selecionado.</p>
          </section>
        )}
      </main>
    </div>
  );
}