'use client';

import React, { useEffect, useState } from 'react';
import { adminService, Discipline } from '@/services/adminService';
import AdminAlertModal from '@/components/AdminAlertModal';

export default function AdminDisciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Alert Modal State
  const [alertModal, setAlertModal] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDisciplines();
      setDisciplines([...data].sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
      setAlertModal({ message: 'Erro ao buscar disciplinas. Tente novamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (discipline?: Discipline) => {
    if (discipline) {
      setEditingId(discipline.id);
      setFormData({ name: discipline.name, description: discipline.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const wasEditing = !!editingId;
      if (editingId) {
        await adminService.updateDiscipline(editingId, formData);
      } else {
        await adminService.createDiscipline(formData);
      }
      handleCloseModal();
      setAlertModal({ message: wasEditing ? 'Disciplina atualizada com sucesso!' : 'Disciplina criada com sucesso!', type: 'success' });
      fetchDisciplines();
    } catch (error) {
      console.error('Erro ao salvar disciplina:', error);
      setAlertModal({ message: 'Erro ao salvar disciplina. Verifique os dados e tente novamente.', type: 'error' });
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminService.deleteDiscipline(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchDisciplines();
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
      setDeleteConfirm(null);
      setAlertModal({ message: 'Não foi possível excluir a disciplina. Ela pode estar sendo usada por outros registros.', type: 'error' });
    }
  };

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Gerenciar Disciplinas</h2>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nova Disciplina
        </button>
      </header>

      <div className="admin-content-area">
        <div className="admin-card">
          {loading ? (
            <div className="py-12 text-center text-[#64748b]">Carregando disciplinas...</div>
          ) : disciplines.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhuma disciplina cadastrada ainda.</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplines.map(discipline => (
                    <tr key={discipline.id}>
                      <td>#{discipline.id}</td>
                      <td className="font-medium text-[#1e293b]">{discipline.name}</td>
                      <td className="text-[#64748b]">{discipline.description || '-'}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenModal(discipline)} className="admin-btn-edit">
                            Editar
                          </button>
                          <button onClick={() => handleDelete(discipline.id, discipline.name)} className="admin-btn-danger">
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

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-[#ef4444] flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-[#475569] mb-6 leading-relaxed">
              Você tem certeza de que deseja excluir a disciplina <strong>"{deleteConfirm.name}"</strong>? Essa ação afetará todos os conteúdos ligados a ela.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" className="admin-btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button type="button" className="admin-card-action-btn admin-card-action-btn--delete" style={{ width: 'auto', padding: '0 20px' }} onClick={executeDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3 className="mb-6 text-xl font-bold text-[#1e293b]">
              {editingId ? 'Editar Disciplina' : 'Nova Disciplina'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label className="admin-label">Nome da Disciplina</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Ex: Biologia, Matemática"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Descrição (Opcional)</label>
                <textarea 
                  className="admin-input" 
                  rows={4}
                  placeholder="Breve descrição sobre a disciplina..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Criar Disciplina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
