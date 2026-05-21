'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { simuladoService } from '@/services/simuladoService';
import { Simulado } from '@/types/simulados';

const NIVEL_TO_DIFFICULTY: Record<string, string> = {
  'Fácil':   'FÁCIL',
  'Médio':   'MÉDIO',
  'Difícil': 'DIFÍCIL',
};

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
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    nivel: 'Médio' as 'Fácil' | 'Médio' | 'Difícil',
    questoes: '',
    tempoEstimado: '',
    materia: '',
  });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState('');

  useEffect(() => {
    fetchSimulados();
  }, []);

  const fetchSimulados = async () => {
    setLoading(true);
    try {
      const data = await simuladoService.list();
      setSimulados(data);
    } catch (error) {
      console.error('Erro ao buscar simulados:', error);
      alert('Erro ao buscar simulados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (simulado?: Simulado) => {
    if (simulado) {
      setEditingId(simulado.id);
      setFormData({
        titulo: simulado.titulo,
        descricao: simulado.descricao,
        nivel: simulado.nivel,
        questoes: String(simulado.questoes),
        tempoEstimado: String(simulado.tempoEstimado),
        materia: simulado.materia,
      });
    } else {
      setEditingId(null);
      setFormData({
        titulo: '',
        descricao: '',
        nivel: 'Médio',
        questoes: '',
        tempoEstimado: '',
        materia: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      titulo: '',
      descricao: '',
      nivel: 'Médio',
      questoes: '',
      tempoEstimado: '',
      materia: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      alert('Por favor, preencha o título.');
      return;
    }

    try {
      // Payload exato que o backend aceita (POST /exams/)
      const payload = {
        name:         formData.titulo.trim(),
        description:  formData.descricao.trim() || undefined,
        difficulty:   NIVEL_TO_DIFFICULTY[formData.nivel] ?? 'MÉDIO',
        creator_name: 'admin'
    };

      if (editingId) {
        await simuladoService.update(editingId, payload);
      } else {
        await simuladoService.create(payload);
      }

      alert(editingId ? 'Simulado atualizado com sucesso!' : 'Simulado criado com sucesso!');
      handleCloseModal();
      fetchSimulados();
    } catch (error: any) {
      console.error('Erro completo:', error);
      const detail = error?.response?.data?.detail;

      // 422: mostra exatamente quais campos o backend rejeitou
      if (error?.response?.status === 422 && Array.isArray(detail)) {
        const msgs = detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('\n');
        alert(`Dados inválidos:\n${msgs}`);
      } else {
        alert(`Erro: ${detail ?? error?.message ?? 'Tente novamente.'}`);
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
      console.error('Erro ao excluir simulado:', error);
      alert('Não foi possível excluir o simulado.');
    }
  };

  const getNivelClass = (nivel: string) => {
    switch (nivel) {
      case 'Fácil':
        return 'admin-simulado-card-badge--easy';
      case 'Médio':
        return 'admin-simulado-card-badge--medium';
      case 'Difícil':
        return 'admin-simulado-card-badge--hard';
      default:
        return '';
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Novo Simulado
          </button>
        </div>
      </header>

      <div className="admin-content-area">
        {loading ? (
          <div className="admin-loading">Carregando simulados...</div>
        ) : simulados.length === 0 ? (
          <div className="admin-empty-state">Nenhum simulado cadastrado ainda.</div>
        ) : (
          <section className="admin-simulados-grid" aria-label="Lista de simulados">
            {simulados.map((simulado) => (
              <article key={simulado.id} className="admin-simulado-card">
                <div className="admin-simulado-card-top">
                  <div className="admin-simulado-card-book">
                    <BookIcon />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[11px] font-mono text-[#94a3b8]">ID: {simulado.id.slice(0, 8)}</span>
                    <span className={`admin-simulado-card-badge ${getNivelClass(simulado.nivel)}`}>{simulado.nivel}</span>
                  </div>
                </div>

                <h2>{simulado.titulo}</h2>
                <p className="admin-simulado-card-text">{simulado.descricao}</p>

                <div className="admin-simulado-card-meta">
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
                    <span>{simulado.materia}</span>
                  </div>
                </div>

                <div className="admin-simulado-card-actions">
                  <button
                    type="button"
                    className="admin-card-action-btn admin-card-action-btn--edit"
                    onClick={() => handleOpenModal(simulado)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-card-action-btn admin-card-action-btn--delete"
                    onClick={() => handleOpenDeleteModal(simulado.id, simulado.titulo)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-6 text-xl font-bold text-[#1e293b]">
              {editingId ? 'Editar Simulado' : 'Novo Simulado'}
            </h3>

            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label htmlFor="titulo" className="admin-label">
                  Título *
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  placeholder="Ex: Simulado de Português"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="admin-input"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="descricao" className="admin-label">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  placeholder="Descreva o simulado..."
                  value={formData.descricao}
                  onChange={handleChange}
                  className="admin-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-form-group">
                  <label htmlFor="nivel" className="admin-label">
                    Nível *
                  </label>
                  <select
                    id="nivel"
                    name="nivel"
                    value={formData.nivel}
                    onChange={handleChange}
                    className="admin-input"
                    required
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="materia" className="admin-label">
                    Matéria *
                  </label>
                  <input
                    id="materia"
                    name="materia"
                    type="text"
                    placeholder="Ex: Português"
                    value={formData.materia}
                    onChange={handleChange}
                    className="admin-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="admin-form-group">
                  <label htmlFor="questoes" className="admin-label">
                    Número de Questões *
                  </label>
                  <input
                    id="questoes"
                    name="questoes"
                    type="number"
                    placeholder="Ex: 50"
                    value={formData.questoes}
                    onChange={handleChange}
                    className="admin-input"
                    min="1"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="tempoEstimado" className="admin-label">
                    Tempo Estimado (min) *
                  </label>
                  <input
                    id="tempoEstimado"
                    name="tempoEstimado"
                    type="number"
                    placeholder="Ex: 120"
                    value={formData.tempoEstimado}
                    onChange={handleChange}
                    className="admin-input"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                >
                  {editingId ? 'Atualizar' : 'Criar'} Simulado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-[#ef4444] flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Confirmar Exclusão
            </h3>
            
            <p className="text-sm text-[#475569] mb-6 leading-relaxed">
              Você tem certeza de que deseja excluir o simulado <strong>"{deletingTitle}"</strong>? Essa ação é permanente e todas as questões associadas também serão excluídas.
            </p>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-card-action-btn admin-card-action-btn--delete"
                style={{ width: 'auto', padding: '0 20px' }}
                onClick={handleConfirmDelete}
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