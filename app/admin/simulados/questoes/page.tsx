'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { questionService, Question, Alternative } from '@/services/questionService';
import { adminService, Content } from '@/services/adminService';
import { simuladoService } from '@/services/simuladoService';
import { Simulado } from '@/types/simulados';
import MultiSelect from '@/components/MultiSelect';
import AdminAlertModal from '@/components/AdminAlertModal';

const DIFFICULTY_LABELS = ['FÁCIL', 'MÉDIO', 'DIFÍCIL', 'MUITO DIFÍCIL'];

export default function AdminQuestoes() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [exams, setExams] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  // Alert Modal State
  const [alertModal, setAlertModal] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Filter State
  const [filterContentId, setFilterContentId] = useState<number>(0);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected item states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    content_id: 0,
    description: '',
    difficulty: 'MÉDIO' as Question['difficulty'],
    creator_name: 'admin',
    alternatives: [
      { description: '', is_correct: true },
      { description: '', is_correct: false },
      { description: '', is_correct: false },
      { description: '', is_correct: false },
      { description: '', is_correct: false },
    ] as Alternative[],
    exam_ids: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questionsData, contentsData, examsData] = await Promise.all([
        questionService.list(),
        adminService.getContents(),
        simuladoService.list()
      ]);
      setQuestions([...questionsData].sort((a, b) => a.id - b.id));
      setContents([...contentsData].sort((a, b) => a.id - b.id));
      setExams(examsData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setAlertModal({ message: 'Erro ao carregar os dados. Verifique a conexão com o servidor.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const contentsMap = useMemo(() => {
    const map = new Map<number, string>();
    contents.forEach(c => map.set(c.id, c.name));
    return map;
  }, [contents]);

  const contentsSorted = useMemo(
    () => [...contents].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [contents]
  );

  const examsMap = useMemo(() => {
    const map = new Map<number, string>();
    exams.forEach(e => map.set(Number(e.id), e.titulo));
    return map;
  }, [exams]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filterContentId !== 0 && q.content_id !== filterContentId) return false;
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [questions, filterContentId, filterDifficulty]);

  const handleOpenModal = (question?: Question) => {
    if (question) {
      setEditingId(question.id);
      
      // Ensure we have exactly 5 alternatives
      const alts = [...question.alternatives];
      while (alts.length < 5) {
        alts.push({ description: '', is_correct: false });
      }
      const trimmedAlts = alts.slice(0, 5);

      setFormData({
        content_id: question.content_id,
        description: question.description,
        difficulty: question.difficulty,
        creator_name: question.creator_name,
        alternatives: trimmedAlts,
        exam_ids: question.exam_ids || []
      });
    } else {
      setEditingId(null);
      setFormData({
        content_id: contents.length > 0 ? contents[0].id : 0,
        description: '',
        difficulty: 'MÉDIO',
        creator_name: 'admin',
        alternatives: [
          { description: '', is_correct: true },
          { description: '', is_correct: false },
          { description: '', is_correct: false },
          { description: '', is_correct: false },
          { description: '', is_correct: false },
        ],
        exam_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAltTextChange = (index: number, text: string) => {
    const nextAlts = [...formData.alternatives];
    nextAlts[index].description = text;
    setFormData(prev => ({ ...prev, alternatives: nextAlts }));
  };

  const handleSelectCorrectAlt = (selectedIndex: number) => {
    const nextAlts = formData.alternatives.map((alt, idx) => ({
      ...alt,
      is_correct: idx === selectedIndex
    }));
    setFormData(prev => ({ ...prev, alternatives: nextAlts }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.content_id === 0) {
      setAlertModal({ message: 'Por favor, selecione um conteúdo.', type: 'warning' });
      return;
    }
    if (!formData.description.trim()) {
      setAlertModal({ message: 'Por favor, preencha o enunciado.', type: 'warning' });
      return;
    }

    const emptyAlt = formData.alternatives.some(a => !a.description.trim());
    if (emptyAlt) {
      setAlertModal({ message: 'Por favor, preencha as 5 alternativas.', type: 'warning' });
      return;
    }

    const hasCorrect = formData.alternatives.some(a => a.is_correct);
    if (!hasCorrect) {
      setAlertModal({ message: 'Por favor, selecione qual alternativa é a correta.', type: 'warning' });
      return;
    }

    try {
      const payload = {
        content_id: formData.content_id,
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        creator_name: formData.creator_name.trim() || 'admin',
        alternatives: formData.alternatives.map(alt => ({
          description: alt.description.trim(),
          is_correct: alt.is_correct
        })),
        exam_ids: formData.exam_ids
      };

      if (editingId !== null) {
        await questionService.update(editingId, payload);
        handleCloseModal();
        setAlertModal({ message: 'Questão atualizada com sucesso!', type: 'success' });
      } else {
        await questionService.create(payload);
        handleCloseModal();
        setAlertModal({ message: 'Questão criada com sucesso!', type: 'success' });
      }

      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setAlertModal({ message: 'Não foi possível salvar a questão. Tente novamente.', type: 'error' });
    }
  };

  const handleOpenDelete = (question: Question) => {
    setDeletingQuestion(question);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuestion) return;
    try {
      await questionService.remove(deletingQuestion.id);
      setIsDeleteOpen(false);
      setDeletingQuestion(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setAlertModal({ message: 'Erro ao excluir a questão.', type: 'error' });
    }
  };

  const handleOpenPreview = (question: Question) => {
    setPreviewQuestion(question);
    setIsPreviewOpen(true);
  };

  const getDifficultyClass = (diff: string) => {
    switch (diff) {
      case 'FÁCIL':
        return 'admin-simulado-card-badge--easy';
      case 'MÉDIO':
        return 'admin-simulado-card-badge--medium';
      case 'DIFÍCIL':
      case 'MUITO DIFÍCIL':
        return 'admin-simulado-card-badge--hard';
      default:
        return '';
    }
  };

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Gerenciar Questões</h2>
        <div className="flex items-center gap-3">
          {/* Filter button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => setIsFilterOpen(prev => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filtros
              {(filterContentId !== 0 || filterDifficulty) && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#138ecc', flexShrink: 0 }} />
              )}
            </button>

            {isFilterOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 19 }}
                  onClick={() => setIsFilterOpen(false)}
                />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#fff', borderRadius: 14,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0',
                  padding: '16px', minWidth: 240, zIndex: 20,
                }}>
                  <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Filtros</p>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Conteúdo</label>
                    <select
                      value={filterContentId}
                      onChange={e => setFilterContentId(Number(e.target.value))}
                      className="admin-select"
                    >
                      <option value={0}>Todos</option>
                      {contentsSorted.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Dificuldade</label>
                    <select
                      value={filterDifficulty}
                      onChange={e => setFilterDifficulty(e.target.value)}
                      className="admin-select"
                    >
                      <option value="">Todas</option>
                      {DIFFICULTY_LABELS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {(filterContentId !== 0 || filterDifficulty) && (
                    <button
                      type="button"
                      onClick={() => { setFilterContentId(0); setFilterDifficulty(''); }}
                      style={{ marginTop: 12, fontSize: '0.82rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            className="admin-btn-primary"
            onClick={() => handleOpenModal()}
            disabled={contents.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova Questão
          </button>
        </div>
      </header>

      <div className="admin-content-area">
        {contents.length === 0 && !loading && (
          <div className="mb-6 rounded-xl bg-[#fff8e6] p-4 text-[#b45309] border border-[#fde68a]">
            <strong>Atenção:</strong> É necessário cadastrar ao menos um Conteúdo antes de criar Questões.
          </div>
        )}

        <div className="admin-card">
          {loading ? (
            <div className="py-12 text-center text-[#64748b]">Carregando questões...</div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhuma questão cadastrada ainda.</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhuma questão encontrada com os filtros selecionados.</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Enunciado</th>
                    <th>Conteúdo</th>
                    <th>Dificuldade</th>
                    <th style={{ width: '220px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map(q => (
                    <tr key={q.id}>
                      <td>#{q.id}</td>
                      <td>
                        <div 
                          className="font-medium text-[#1e293b] cursor-pointer hover:text-[#138ecc] transition-colors"
                          style={{
                            maxWidth: '350px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          onClick={() => handleOpenPreview(q)}
                          title="Clique para visualizar a questão"
                        >
                          {q.description}
                        </div>
                      </td>
                      <td>
                        <span className="inline-block rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold text-[#334155]">
                          {contentsMap.get(q.content_id) || `ID: ${q.content_id}`}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-simulado-card-badge ${getDifficultyClass(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => handleOpenPreview(q)} 
                            className="admin-btn-edit"
                            style={{ background: '#e2e8f0', color: '#475569' }}
                          >
                            Visualizar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleOpenModal(q)} 
                            className="admin-btn-edit"
                          >
                            Editar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleOpenDelete(q)} 
                            className="admin-btn-danger"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {alertModal && (
        <AdminAlertModal
          message={alertModal.message}
          type={alertModal.type}
          onClose={() => setAlertModal(null)}
        />
      )}

      {/* Creation / Edition Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div 
            className="admin-modal" 
            style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-6 text-xl font-bold text-[#1e293b]">
              {editingId ? 'Editar Questão' : 'Nova Questão'}
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Conteúdo *</label>
                  <select
                    className="admin-select"
                    value={formData.content_id}
                    onChange={e => setFormData({ ...formData, content_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0} disabled>Selecione um conteúdo...</option>
                    {contentsSorted.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Dificuldade *</label>
                  <select
                    className="admin-select"
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value as Question['difficulty'] })}
                    required
                  >
                    {DIFFICULTY_LABELS.map(lbl => (
                      <option key={lbl} value={lbl}>{lbl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Criador da Questão *</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Nome do criador"
                  value={formData.creator_name}
                  onChange={e => setFormData({ ...formData, creator_name: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Enunciado / Descrição *</label>
                <textarea
                  className="admin-input"
                  rows={4}
                  placeholder="Digite o enunciado completo da questão..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Vincular a Simulados (Opcional)</label>
                <MultiSelect
                  options={exams.map(e => ({
                    id: Number(e.id),
                    label: e.titulo,
                    subLabel: `[${e.nivel}]`
                  }))}
                  selectedIds={formData.exam_ids}
                  onChange={(ids) => setFormData({ ...formData, exam_ids: ids })}
                  placeholder="Selecione um ou mais simulados..."
                />
                <p className="mt-1 text-xs text-[#64748b]">Selecione os simulados aos quais esta questão pertence.</p>
              </div>

              <div className="admin-form-group">
                <label className="admin-label font-bold text-[#1e293b] mb-3">
                  Alternativas (Preencha as 5 opções e marque a correta) *
                </label>
                
                <div className="flex flex-col gap-3">
                  {formData.alternatives.map((alt, idx) => {
                    const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D, E
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex items-center h-10">
                          <input
                            type="radio"
                            name="correct-alternative"
                            id={`correct-${idx}`}
                            checked={alt.is_correct}
                            onChange={() => handleSelectCorrectAlt(idx)}
                            className="h-5 w-5 cursor-pointer accent-[#16a34a]"
                            title={`Marcar a alternativa ${optionLetter} como correta`}
                          />
                        </div>
                        <span className="flex items-center justify-center font-bold text-sm bg-[#e2e8f0] text-[#475569] h-10 w-10 rounded-lg">
                          {optionLetter}
                        </span>
                        <input
                          type="text"
                          className="admin-input flex-1"
                          placeholder={`Texto da alternativa ${optionLetter}...`}
                          value={alt.description}
                          onChange={e => handleAltTextChange(idx, e.target.value)}
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Criar Questão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewQuestion && (
        <div className="admin-modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div 
            className="admin-modal" 
            style={{ maxWidth: '820px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#e2e8f0]">
              <span className="text-xs font-mono text-[#94a3b8]">Questão #{previewQuestion.id}</span>
              <span className={`admin-simulado-card-badge ${getDifficultyClass(previewQuestion.difficulty)}`}>
                {previewQuestion.difficulty}
              </span>
            </div>

            <div className="mb-5">
              <p className="text-sm text-[#475569] font-medium mb-1">Enunciado:</p>
              <h4 className="text-base font-semibold text-[#1e293b] leading-relaxed whitespace-pre-wrap">
                {previewQuestion.description}
              </h4>
            </div>

            <div className="mb-5">
              <p className="text-sm text-[#475569] font-medium mb-2.5">Simulados Vinculados:</p>
              <div className="flex flex-wrap gap-1.5">
                {previewQuestion.exam_ids && previewQuestion.exam_ids.length > 0 ? (
                  previewQuestion.exam_ids.map(eId => (
                    <span key={eId} className="inline-block rounded-md bg-[#e0f2fe] px-2.5 py-1 text-xs font-semibold text-[#0369a1] border border-[#bae6fd]">
                      {examsMap.get(eId) || `Simulado ID: ${eId}`}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#94a3b8] italic">Nenhum simulado vinculado</span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-[#475569] font-medium mb-3">Alternativas:</p>
              <div className="flex flex-col gap-2.5">
                {previewQuestion.alternatives.map((alt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div 
                      key={alt.id ?? idx} 
                      className={`flex items-start gap-3 p-3 rounded-xl border ${
                        alt.is_correct 
                          ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]' 
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#475569]'
                      }`}
                    >
                      <span className={`flex items-center justify-center font-bold text-xs h-6 w-6 rounded-md ${
                        alt.is_correct ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#e2e8f0] text-[#64748b]'
                      }`}>
                        {letter}
                      </span>
                      <p className="text-sm leading-normal flex-1">{alt.description}</p>
                      {alt.is_correct && (
                        <span className="text-xs font-bold text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Correta
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                type="button" 
                onClick={() => setIsPreviewOpen(false)} 
                className="admin-btn-secondary"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && deletingQuestion && (
        <div className="admin-modal-overlay" onClick={() => setIsDeleteOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-[#ef4444] flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Confirmar Exclusão
            </h3>

            <p className="text-sm text-[#475569] mb-6 leading-relaxed">
              Você tem certeza de que deseja excluir esta questão? Essa ação é permanente e todas as suas 5 alternativas associadas também serão apagadas.
            </p>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsDeleteOpen(false)} 
                className="admin-btn-secondary"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDelete} 
                className="admin-card-action-btn admin-card-action-btn--delete"
                style={{ width: 'auto', padding: '0 20px' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
