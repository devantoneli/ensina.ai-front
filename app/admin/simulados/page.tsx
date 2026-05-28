'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { simuladoService } from '@/services/simuladoService';
import { questionService, Question } from '@/services/questionService';
import { Simulado } from '@/types/simulados';
import AdminAlertModal from '@/components/AdminAlertModal';

type ApiErrorDetail = {
  loc?: Array<string | number>;
  msg?: string;
};

type ApiError = {
  response?: {
    status?: number;
    data?: {
      detail?: unknown;
    };
  };
  message?: string;
};

function isApiErrorDetailArray(detail: unknown): detail is ApiErrorDetail[] {
  return Array.isArray(detail);
}

const NIVEL_TO_DIFFICULTY: Record<string, string> = {
  'Fácil':   'FÁCIL',
  'Médio':   'MÉDIO',
  'Difícil': 'DIFÍCIL',
};

const NIVEL_ORDER: Record<string, number> = { 'Fácil': 0, 'Médio': 1, 'Difícil': 2 };

const SORT_OPTIONS = [
  { field: 'id',      label: 'ID'       },
  { field: 'titulo',  label: 'Título'   },
  { field: 'nivel',   label: 'Nível'    },
  { field: 'questoes', label: 'Questões' },
  { field: 'tempo',   label: 'Tempo'    },
] as const;
type SortField = typeof SORT_OPTIONS[number]['field'];

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
      <path d="M6 4.5H18.5C19.3284 4.5 20 5.17157 20 6V19.5H7.5C6.11929 19.5 5 18.3807 5 17V6.5C5 5.39543 5.89543 4.5 7 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.5 19.5H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 8.5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 11.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
      <path d="M9.5 9.5C9.5 7.567 11.067 6 13 6C14.933 6 16.5 7.567 16.5 9.5C16.5 11.1055 15.4164 12.4747 13.9 12.8719C12.7923 13.1622 12 14.162 12 15.3077V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

export default function AdminSimulados() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    nivel: 'Médio' as 'Fácil' | 'Médio' | 'Difícil',
    questoes: '',
    tempoEstimado: '',
    materia: '',
    selectedQuestionIds: [] as number[],
  });

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [searchQuestionText, setSearchQuestionText] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [alertModal, setAlertModal] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterNivel, setFilterNivel] = useState<'' | 'Fácil' | 'Médio' | 'Difícil'>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const hasActiveFilters = filterNivel !== '';

  useEffect(() => { fetchSimulados(); }, []);

  const fetchSimulados = async () => {
    setLoading(true);
    try {
      const data = await simuladoService.list();
      setSimulados([...data].sort((a, b) => Number(a.id) - Number(b.id)));
    } catch (error) {
      setAlertModal({ message: 'Erro ao buscar simulados. Tente novamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...simulados]
      .filter(s => {
        if (filterNivel && s.nivel !== filterNivel) return false;
        if (!q) return true;
        return (
          s.id.toLowerCase().includes(q) ||
          s.titulo.toLowerCase().includes(q) ||
          (s.descricao || '').toLowerCase().includes(q) ||
          s.nivel.toLowerCase().includes(q) ||
          (s.materia || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'id')      cmp = a.id.localeCompare(b.id);
        if (sortField === 'titulo')  cmp = a.titulo.localeCompare(b.titulo, 'pt-BR');
        if (sortField === 'nivel')   cmp = (NIVEL_ORDER[a.nivel] ?? 0) - (NIVEL_ORDER[b.nivel] ?? 0);
        if (sortField === 'questoes') cmp = (a.questoes ?? 0) - (b.questoes ?? 0);
        if (sortField === 'tempo')   cmp = (a.tempoEstimado ?? 0) - (b.tempoEstimado ?? 0);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [simulados, searchQuery, filterNivel, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setIsSortOpen(false);
  };

  const handleOpenModal = async (simulado?: Simulado) => {
    if (simulado) {
      setEditingId(simulado.id);
      let questionIds: number[] = [];
      try {
        const questions = await simuladoService.getQuestions(simulado.id);
        questionIds = questions.map(q => q.id);
      } catch(e) {
        console.error("Erro ao carregar questoes vinculadas", e);
      }
      setFormData({
        titulo: simulado.titulo,
        descricao: simulado.descricao,
        nivel: simulado.nivel,
        questoes: String(simulado.questoes),
        tempoEstimado: String(simulado.tempoEstimado),
        materia: simulado.materia,
        selectedQuestionIds: questionIds,
      });
    } else {
      setEditingId(null);
      setFormData({ titulo: '', descricao: '', nivel: 'Médio', questoes: '', tempoEstimado: '', materia: '', selectedQuestionIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ titulo: '', descricao: '', nivel: 'Médio', questoes: '', tempoEstimado: '', materia: '', selectedQuestionIds: [] });
  };

  const handleOpenQuestionModal = async () => {
    setIsQuestionModalOpen(true);
    if (allQuestions.length === 0) {
      setLoadingQuestions(true);
      try {
        const questions = await questionService.list();
        setAllQuestions(questions);
      } catch (e) {
        console.error("Erro ao carregar questoes", e);
      } finally {
        setLoadingQuestions(false);
      }
    }
  };

  const toggleQuestionSelection = (qId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedQuestionIds: prev.selectedQuestionIds.includes(qId)
        ? prev.selectedQuestionIds.filter(id => id !== qId)
        : [...prev.selectedQuestionIds, qId]
    }));
  };

  const filteredQuestions = useMemo(() => {
    const q = searchQuestionText.toLowerCase().trim();
    if (!q) return allQuestions;
    return allQuestions.filter(question => question.description.toLowerCase().includes(q));
  }, [allQuestions, searchQuestionText]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      setAlertModal({ message: 'Por favor, preencha o título.', type: 'warning' });
      return;
    }

    try {
      const payload = {
        name:         formData.titulo.trim(),
        description:  formData.descricao.trim() || undefined,
        difficulty:   NIVEL_TO_DIFFICULTY[formData.nivel] ?? 'MÉDIO',
        creator_name: 'admin',
        time_setting: formData.tempoEstimado ? Number(formData.tempoEstimado) : undefined,
      };

      const wasEditing = !!editingId;
      if (editingId) {
        await simuladoService.update(editingId, payload);
        await simuladoService.linkQuestions(editingId, formData.selectedQuestionIds);
      } else {
        const created: any = await simuladoService.create(payload);
        if (created && created.id) {
          await simuladoService.linkQuestions(created.id, formData.selectedQuestionIds);
        }
      }

      handleCloseModal();
      setAlertModal({ message: wasEditing ? 'Simulado atualizado com sucesso!' : 'Simulado criado com sucesso!', type: 'success' });
      fetchSimulados();
    } catch (error: unknown) {
      console.error('Erro completo:', error);
      const apiError = error as ApiError;
      const detail = apiError.response?.data?.detail;

      // 422: mostra exatamente quais campos o backend rejeitou
      if (apiError.response?.status === 422 && isApiErrorDetailArray(detail)) {
        const msgs = detail.map((d) => `${d.loc?.join('.') ?? 'campo'}: ${d.msg ?? 'Valor inválido'}`).join('\n');
        alert(`Dados inválidos:\n${msgs}`);
      } else {
        alert(`Erro: ${typeof detail === 'string' ? detail : apiError.message ?? 'Tente novamente.'}`);
      }
    }
  };

  const handleOpenDeleteModal = (id: string, titulo: string) => {
    setDeletingId(id);
    setDeletingTitle(titulo);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await simuladoService.remove(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setDeletingTitle('');
      fetchSimulados();
    } catch (error) {
      setAlertModal({ message: 'Não foi possível excluir o simulado.', type: 'error' });
    }
  };

  const getNivelClass = (nivel: string) => {
    switch (nivel) {
      case 'Fácil':   return 'admin-simulado-card-badge--easy';
      case 'Médio':   return 'admin-simulado-card-badge--medium';
      case 'Difícil': return 'admin-simulado-card-badge--hard';
      default:        return '';
    }
  };

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Gerenciar Simulados</h2>
        <div className="flex gap-3">
          <Link href="/admin/simulados/questoes" className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line><circle cx="12" cy="12" r="10"></circle></svg>
            Gerenciar Questões
          </Link>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Simulado
          </button>
        </div>
      </header>

      <div className="admin-content-area">
        {loading ? (
          <div className="admin-loading">Carregando simulados...</div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="admin-card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input type="text" placeholder="Buscar por título, descrição, nível, matéria..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="admin-input" style={{ paddingLeft: 34, height: 38 }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <button type="button" className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38 }} onClick={() => setIsFilterOpen(p => !p)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    Filtros
                    {hasActiveFilters && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#138ecc', flexShrink: 0 }} />}
                  </button>
                  {isFilterOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setIsFilterOpen(false)} />
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0', padding: 14, minWidth: 210, zIndex: 20 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Filtros</p>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Nível</label>
                          <select value={filterNivel} onChange={e => setFilterNivel(e.target.value as '' | 'Fácil' | 'Médio' | 'Difícil')} className="admin-select" style={{ height: 34 }}>
                            <option value="">Todos</option>
                            <option value="Fácil">Fácil</option>
                            <option value="Médio">Médio</option>
                            <option value="Difícil">Difícil</option>
                          </select>
                        </div>
                        {hasActiveFilters && (
                          <button type="button" onClick={() => setFilterNivel('')} style={{ marginTop: 10, fontSize: '0.82rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <button type="button" className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38 }} onClick={() => setIsSortOpen(p => !p)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
                    Ordenar
                  </button>
                  {isSortOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setIsSortOpen(false)} />
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0', padding: 6, minWidth: 170, zIndex: 20 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 8px' }}>Ordenar por</p>
                        {SORT_OPTIONS.map(opt => (
                          <button key={opt.field} type="button" onClick={() => toggleSort(opt.field)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 10px', border: 'none', background: sortField === opt.field ? '#f0f9ff' : 'transparent', color: sortField === opt.field ? '#138ecc' : '#475569', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: sortField === opt.field ? 600 : 400 }}>
                            {opt.label}
                            {sortField === opt.field && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {sortDir === 'asc' ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></> : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {simulados.length === 0 ? (
              <div className="admin-empty-state">Nenhum simulado cadastrado ainda.</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>
                Nenhum resultado para "<strong>{searchQuery || 'filtro aplicado'}</strong>".
              </div>
            ) : (
              <section className="admin-simulados-grid" aria-label="Lista de simulados">
                {filtered.map((simulado) => (
                  <article key={simulado.id} className="admin-simulado-card">
                    <div className="admin-simulado-card-top">
                      <div className="admin-simulado-card-book"><BookIcon /></div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[11px] font-mono text-[#94a3b8]">ID: {simulado.id.slice(0, 8)}</span>
                        <span className={`admin-simulado-card-badge ${getNivelClass(simulado.nivel)}`}>{simulado.nivel}</span>
                      </div>
                    </div>

                    <h2>{simulado.titulo}</h2>
                    <p className="admin-simulado-card-text">{simulado.descricao}</p>

                    <div className="admin-simulado-card-meta">
                      <div><QuestionIcon /><span>{simulado.questoes} questões</span></div>
                      <div><ClockIcon /><span>{simulado.tempoEstimado} min</span></div>
                      <div><BookIcon /><span>{simulado.materia}</span></div>
                    </div>

                    <div className="admin-simulado-card-actions">
                      <button type="button" className="admin-card-action-btn admin-card-action-btn--edit" onClick={() => handleOpenModal(simulado)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editar
                      </button>
                      <button type="button" className="admin-card-action-btn admin-card-action-btn--delete" onClick={() => handleOpenDeleteModal(simulado.id, simulado.titulo)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-6 text-xl font-bold text-[#1e293b]">{editingId ? 'Editar Simulado' : 'Novo Simulado'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label htmlFor="titulo" className="admin-label">Título *</label>
                <input id="titulo" name="titulo" type="text" placeholder="Ex: Simulado de Português" value={formData.titulo} onChange={handleChange} className="admin-input" required />
              </div>

              <div className="admin-form-group">
                <label htmlFor="descricao" className="admin-label">Descrição</label>
                <textarea id="descricao" name="descricao" placeholder="Descreva o simulado..." value={formData.descricao} onChange={handleChange} className="admin-input" rows={3} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-form-group">
                  <label htmlFor="nivel" className="admin-label">Nível *</label>
                  <select id="nivel" name="nivel" value={formData.nivel} onChange={handleChange} className="admin-input" required>
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label htmlFor="materia" className="admin-label">Matéria *</label>
                  <input id="materia" name="materia" type="text" placeholder="Ex: Português" value={formData.materia} onChange={handleChange} className="admin-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label htmlFor="questoes" className="admin-label" style={{ marginBottom: 0 }}>Questões vinculadas</label>
                    <button type="button" onClick={handleOpenQuestionModal} style={{ fontSize: '0.8rem', color: '#138ecc', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Atrelar Questões</button>
                  </div>
                  <input id="questoes" name="questoes" type="text" value={`${formData.selectedQuestionIds.length} selecionada(s)`} className="admin-input" disabled />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="tempoEstimado" className="admin-label">Tempo Estimado (min) *</label>
                  <input id="tempoEstimado" name="tempoEstimado" type="number" placeholder="Ex: 120" value={formData.tempoEstimado} onChange={handleChange} className="admin-input" min="1" required />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" className="admin-btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="admin-btn-primary">{editingId ? 'Atualizar' : 'Criar'} Simulado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuestionModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsQuestionModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
            <h3 className="mb-4 text-xl font-bold text-[#1e293b]">Selecionar Questões</h3>
            <div style={{ marginBottom: '16px' }}>
              <input type="text" placeholder="Buscar no enunciado..." value={searchQuestionText} onChange={(e) => setSearchQuestionText(e.target.value)} className="admin-input" />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
              {loadingQuestions ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Carregando questões...</div>
              ) : filteredQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Nenhuma questão encontrada.</div>
              ) : (
                filteredQuestions.map(q => (
                  <label key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.selectedQuestionIds.includes(q.id)} onChange={() => toggleQuestionSelection(q.id)} style={{ marginTop: '4px' }} />
                    <div style={{ flex: 1, fontSize: '0.9rem', color: '#334155' }}>
                      <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, color: '#138ecc', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', marginRight: '6px' }}>{q.difficulty}</span>
                      {q.description}
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>{formData.selectedQuestionIds.length} selecionada(s)</span>
              <div className="flex gap-3">
                <button type="button" className="admin-btn-secondary" onClick={() => setIsQuestionModalOpen(false)}>Pronto</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {alertModal && <AdminAlertModal message={alertModal.message} type={alertModal.type} onClose={() => setAlertModal(null)} />}

      {isDeleteModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-[#ef4444] flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-[#475569] mb-6 leading-relaxed">
              Você tem certeza de que deseja excluir o simulado <strong>&quot;{deletingTitle}&quot;</strong>? Essa ação é permanente e todas as questões associadas também serão excluídas.
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" className="admin-btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button type="button" className="admin-card-action-btn admin-card-action-btn--delete" style={{ width: 'auto', padding: '0 20px' }} onClick={handleConfirmDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
