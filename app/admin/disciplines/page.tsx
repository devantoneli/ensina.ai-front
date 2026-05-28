'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { adminService, Discipline } from '@/services/adminService';
import AdminAlertModal from '@/components/AdminAlertModal';

const SORT_OPTIONS = [
  { field: 'id',   label: 'ID'   },
  { field: 'name', label: 'Nome' },
] as const;
type SortField = typeof SORT_OPTIONS[number]['field'];

export default function AdminDisciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);

  const [alertModal, setAlertModal] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => { fetchDisciplines(); }, []);

  const fetchDisciplines = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDisciplines();
      setDisciplines([...data].sort((a, b) => a.id - b.id));
    } catch (error) {
      setAlertModal({ message: 'Erro ao buscar disciplinas. Tente novamente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...disciplines]
      .filter(d =>
        !q ||
        String(d.id).includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'id')   cmp = a.id - b.id;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'pt-BR');
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [disciplines, searchQuery, sortField, sortDir]);

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
      setAlertModal({ message: 'Erro ao salvar disciplina. Verifique os dados e tente novamente.', type: 'error' });
    }
  };

  const handleDelete = (id: number, name: string) => setDeleteConfirm({ id, name });

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminService.deleteDiscipline(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchDisciplines();
    } catch {
      setDeleteConfirm(null);
      setAlertModal({ message: 'Não foi possível excluir a disciplina. Ela pode estar sendo usada por outros registros.', type: 'error' });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setIsSortOpen(false);
  };

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Gerenciar Disciplinas</h2>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Disciplina
        </button>
      </header>

      <div className="admin-content-area">
        <div className="admin-card">
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Buscar por ID, nome, descrição..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="admin-input" style={{ paddingLeft: 34, height: 38 }} />
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

          {loading ? (
            <div className="py-12 text-center text-[#64748b]">Carregando disciplinas...</div>
          ) : disciplines.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhuma disciplina cadastrada ainda.</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-[#64748b]">Nenhum resultado para "<strong>{searchQuery}</strong>".</div>
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
                  {filtered.map(discipline => (
                    <tr key={discipline.id}>
                      <td>#{discipline.id}</td>
                      <td className="font-medium text-[#1e293b]">{discipline.name}</td>
                      <td className="text-[#64748b]">{discipline.description || '-'}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenModal(discipline)} className="admin-btn-edit">Editar</button>
                          <button onClick={() => handleDelete(discipline.id, discipline.name)} className="admin-btn-danger">Excluir</button>
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

      {alertModal && <AdminAlertModal message={alertModal.message} type={alertModal.type} onClose={() => setAlertModal(null)} />}

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-[#ef4444] flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-[#475569] mb-6 leading-relaxed">Você tem certeza de que deseja excluir a disciplina <strong>"{deleteConfirm.name}"</strong>? Essa ação afetará todos os conteúdos ligados a ela.</p>
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
            <h3 className="mb-6 text-xl font-bold text-[#1e293b]">{editingId ? 'Editar Disciplina' : 'Nova Disciplina'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label className="admin-label">Nome da Disciplina</label>
                <input type="text" className="admin-input" placeholder="Ex: Biologia, Matemática" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Descrição (Opcional)</label>
                <textarea className="admin-input" rows={4} placeholder="Breve descrição sobre a disciplina..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">Cancelar</button>
                <button type="submit" className="admin-btn-primary">{editingId ? 'Salvar Alterações' : 'Criar Disciplina'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
