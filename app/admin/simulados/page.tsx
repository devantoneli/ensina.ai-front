'use client';

import React, { useEffect, useState } from 'react';
import { simuladoService } from '@/services/simuladoService';
import { Simulado } from '@/types/simulados';

const NIVEL_TO_DIFFICULTY: Record<string, string> = {
  'Fácil':   'FÁCIL',
  'Médio':   'MÉDIO',
  'Difícil': 'DIFÍCIL',
};

export default function AdminSimulados() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    nivel: 'Médio' as const,
    questoes: '',
    tempoEstimado: '',
    categoria: '',
  });

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
        categoria: simulado.categoria,
      });
    } else {
      setEditingId(null);
      setFormData({
        titulo: '',
        descricao: '',
        nivel: 'Médio',
        questoes: '',
        tempoEstimado: '',
        categoria: '',
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
      categoria: '',
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este simulado? Essa ação não pode ser desfeita.')) return;
    
    try {
      await simuladoService.remove(id);
      fetchSimulados();
    } catch (error) {
      console.error('Erro ao excluir simulado:', error);
      alert('Não foi possível excluir o simulado.');
    }
  };

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Gerenciar Simulados</h2>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Simulado
        </button>
      </header>

      <div className="admin-content-area">
        <div className="admin-card">
          {loading ? (
            <div className="py-12 text-center text-[#64748b]">Carregando simulados...</div>
          ) : simulados.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhum simulado cadastrado ainda.</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>ID</th>
                    <th>Título</th>
                    <th style={{ width: '100px' }}>Nível</th>
                    <th style={{ width: '100px' }}>Questões</th>
                    <th style={{ width: '100px' }}>Tempo (min)</th>
                    <th style={{ width: '120px' }}>Categoria</th>
                    <th style={{ width: '100px' }} className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {simulados.map((simulado) => (
                    <tr key={simulado.id}>
                      <td className="text-[#64748b] font-mono text-sm">{simulado.id.slice(0, 8)}</td>
                      <td>
                        <div className="font-medium text-[#1e293b]">{simulado.titulo}</div>
                        <div className="text-sm text-[#64748b]">{simulado.descricao}</div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          simulado.nivel === 'Fácil' ? 'bg-green-100 text-green-700' :
                          simulado.nivel === 'Médio' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {simulado.nivel}
                        </span>
                      </td>
                      <td className="text-center">{simulado.questoes}</td>
                      <td className="text-center">{simulado.tempoEstimado}</td>
                      <td className="text-[#64748b]">{simulado.categoria}</td>
                      <td>
                        <div className="flex gap-2 justify-center">
                          <button
                            className="admin-btn-secondary"
                            onClick={() => handleOpenModal(simulado)}
                            title="Editar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button
                            className="admin-btn-danger"
                            onClick={() => handleDelete(simulado.id)}
                            title="Deletar"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
                  <label htmlFor="categoria" className="admin-label">
                    Categoria *
                  </label>
                  <input
                    id="categoria"
                    name="categoria"
                    type="text"
                    placeholder="Ex: Português"
                    value={formData.categoria}
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
    </>
  );
}