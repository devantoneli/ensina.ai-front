'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './simulados.css';
import { Simulado } from '@/types/simulados';
import ChatSidebar from '@/components/chat/ChatSidebar';

// Dados de exemplo - substituir por chamada à API
const SIMULADOS_EXEMPLO: Simulado[] = [
  {
    id: '1',
    titulo: 'Gramática - Crase e Preposições',
    descricao: 'Teste seus conhecimentos sobre crase e preposições',
    nivel: 'Médio',
    questoes: 10,
    tempoEstimado: 30,
    categoria: 'Gramática',
  },
  {
    id: '2',
    titulo: 'Pontuação - Vírgulas e Pontos',
    descricao: 'Aprenda os usos corretos de pontuação',
    nivel: 'Fácil',
    questoes: 8,
    tempoEstimado: 20,
    categoria: 'Pontuação',
  },
  {
    id: '3',
    titulo: 'Ortografia - Palavras Difíceis',
    descricao: 'Domine as palavras mais desafiadoras',
    nivel: 'Difícil',
    questoes: 15,
    tempoEstimado: 45,
    categoria: 'Ortografia',
  },
  {
    id: '4',
    titulo: 'Acentuação Gráfica',
    descricao: 'Regras de acentuação da língua portuguesa',
    nivel: 'Médio',
    questoes: 12,
    tempoEstimado: 35,
    categoria: 'Acentuação',
  },
  {
    id: '5',
    titulo: 'Concordância Verbal e Nominal',
    descricao: 'Aprenda sobre concordância na língua portuguesa',
    nivel: 'Difícil',
    questoes: 14,
    tempoEstimado: 40,
    categoria: 'Gramática',
  },
  {
    id: '6',
    titulo: 'Interpretação de Textos',
    descricao: 'Desenvolva suas habilidades de leitura e compreensão',
    nivel: 'Médio',
    questoes: 10,
    tempoEstimado: 30,
    categoria: 'Interpretação',
  },
  {
    id: '7',
    titulo: 'Verbos - Conjugação Completa',
    descricao: 'Domine a conjugação verbal em português',
    nivel: 'Médio',
    questoes: 16,
    tempoEstimado: 45,
    categoria: 'Gramática',
  },
  {
    id: '8',
    titulo: 'Pronomes e suas Funções',
    descricao: 'Entenda todos os tipos de pronomes',
    nivel: 'Fácil',
    questoes: 10,
    tempoEstimado: 25,
    categoria: 'Gramática',
  },
  {
    id: '9',
    titulo: 'Figuras de Linguagem',
    descricao: 'Identifique e compreenda recursos estilísticos',
    nivel: 'Difícil',
    questoes: 12,
    tempoEstimado: 40,
    categoria: 'Literatura',
  },
  {
    id: '10',
    titulo: 'Semântica - Sinônimos e Antônimos',
    descricao: 'Amplie seu vocabulário',
    nivel: 'Fácil',
    questoes: 10,
    tempoEstimado: 20,
    categoria: 'Semântica',
  },
];

export default function SimuladosPage() {
  const router = useRouter();
  const [simulados, setSimulados] = useState<Simulado[]>(SIMULADOS_EXEMPLO);
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Filtrar simulados baseado em busca e nível
  const simuladosFiltrados = simulados.filter((sim) => {
    const matchBusca =
      sim.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      sim.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      sim.categoria.toLowerCase().includes(busca.toLowerCase());

    const matchNivel = !filtroNivel || sim.nivel === filtroNivel;

    return matchBusca && matchNivel;
  });

  const handleIniciarSimulado = (id: string) => {
    // Aqui você pode adicionar lógica de navegação para o simulado específico
    router.push(`/simulados/${id}`);
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Fácil':
        return '#10b981';
      case 'Médio':
        return '#4791DF';
      case 'Difícil':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#E1F0FC_-14.48%,#79B3E0_109.23%)]">
      <ChatSidebar />
      <main className="ml-[80px] min-h-screen">
        <div className="simulados-content">
          {/* Header */}
          <div className="simulados-header">
            <h1>Simulados</h1>
            <p>Teste seus conhecimentos com simulados personalizados</p>
          </div>

        {/* Search e Filters */}
        <div className="simulados-search-section">
          <div className="simulados-search-wrapper">
            <span className="simulados-search-icon">🔍</span>
            <input
              type="text"
              className="simulados-search-input"
              placeholder="Busque pelo simulado que deseja"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="simulados-filter-buttons">
            <button
              className={`simulados-filter-btn ${!filtroNivel ? 'active' : ''}`}
              onClick={() => setFiltroNivel('')}
            >
              Todos
            </button>
            <button
              className={`simulados-filter-btn ${filtroNivel === 'Fácil' ? 'active' : ''}`}
              onClick={() => setFiltroNivel('Fácil')}
            >
              Fácil
            </button>
            <button
              className={`simulados-filter-btn ${filtroNivel === 'Médio' ? 'active' : ''}`}
              onClick={() => setFiltroNivel('Médio')}
            >
              Médio
            </button>
            <button
              className={`simulados-filter-btn ${filtroNivel === 'Difícil' ? 'active' : ''}`}
              onClick={() => setFiltroNivel('Difícil')}
            >
              Difícil
            </button>
          </div>
        </div>

        {/* Grid de Simulados */}
        {simuladosFiltrados.length > 0 ? (
          <div className="simulados-grid">
            {simuladosFiltrados.map((simulado) => (
              <div key={simulado.id} className="simulado-card">
                <div className="simulado-card-header">
                  <div className="simulado-card-icon">📄</div>
                  <div className="simulado-card-nivel" style={{ color: getNivelColor(simulado.nivel) }}>
                    {simulado.nivel}
                  </div>
                </div>

                <h3 className="simulado-card-titulo">{simulado.titulo}</h3>

                <div className="simulado-card-info">
                  <div className="simulado-card-info-item">
                    <span className="simulado-card-info-icon">📋</span>
                    <span>{simulado.questoes} questões</span>
                  </div>
                  <div className="simulado-card-info-item">
                    <span className="simulado-card-info-icon">⏱️</span>
                    <span>{simulado.tempoEstimado} min</span>
                  </div>
                  <div className="simulado-card-info-item">
                    <span className="simulado-card-info-icon">📚</span>
                    <span>{simulado.categoria}</span>
                  </div>
                </div>

                <button
                  className="simulado-card-button"
                  onClick={() => handleIniciarSimulado(simulado.id)}
                  disabled={isLoading}
                >
                  Iniciar Simulado
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="simulados-empty">
            <div className="simulados-empty-icon">🔍</div>
            <h3 className="simulados-empty-title">Nenhum simulado encontrado</h3>
            <p className="simulados-empty-text">
              Tente ajustar seus filtros de busca ou nível
            </p>
          </div>
        )}
      </div>
    </main>
  </div>
);
}
