'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { adminService, Content, Discipline, KnowledgeSource } from '@/services/adminService';
import MultiSelect from '@/components/MultiSelect';

export default function AdminContents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [allSources, setAllSources] = useState<KnowledgeSource[]>([]);
  const [contentSourcesMap, setContentSourcesMap] = useState<Map<number, KnowledgeSource[]>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    discipline_id: 0, 
    name: '', 
    slug: '', 
    description: '',
    is_active: true,
    source_ids: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contentsData, disciplinesData, sourcesData] = await Promise.all([
        adminService.getContents(),
        adminService.getDisciplines(),
        adminService.getKnowledgeSources()
      ]);
      setContents(contentsData);
      setDisciplines(disciplinesData);
      setAllSources(sourcesData);

      const map = new Map<number, KnowledgeSource[]>();
      await Promise.all(contentsData.map(async (content) => {
        try {
          const linkedSources = await adminService.getContentSources(content.id);
          map.set(content.id, linkedSources);
        } catch (e) {
          // Ignorar erro silenciosamente para não quebrar a página
        }
      }));
      setContentSourcesMap(map);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      alert('Erro ao carregar dados da página.');
    } finally {
      setLoading(false);
    }
  };

  const disciplinesMap = useMemo(() => {
    const map = new Map<number, string>();
    disciplines.forEach(d => map.set(d.id, d.name));
    return map;
  }, [disciplines]);

  const handleOpenModal = (content?: Content) => {
    if (content) {
      setEditingId(content.id);
      const linkedSourceIds = contentSourcesMap.get(content.id)?.map(s => s.id) || [];
      setFormData({ 
        discipline_id: content.discipline_id,
        name: content.name, 
        slug: content.slug,
        description: content.description || '',
        is_active: content.is_active,
        source_ids: linkedSourceIds
      });
    } else {
      setEditingId(null);
      setFormData({ 
        discipline_id: disciplines.length > 0 ? disciplines[0].id : 0, 
        name: '', 
        slug: '',
        description: '',
        is_active: true,
        source_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim() || formData.discipline_id === 0) return;

    try {
      let contentId = editingId;

      if (editingId) {
        await adminService.updateContent(editingId, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          is_active: formData.is_active
        });
      } else {
        const createdContent = await adminService.createContent({
          discipline_id: formData.discipline_id,
          name: formData.name,
          slug: formData.slug,
          description: formData.description
        });
        contentId = createdContent.id;
      }

      // Tratar desvinculação e vinculação de fontes
      if (contentId) {
        const oldSourceIds = editingId ? (contentSourcesMap.get(editingId)?.map(s => s.id) || []) : [];
        const toAdd = formData.source_ids.filter(id => !oldSourceIds.includes(id));
        const toRemove = oldSourceIds.filter(id => !formData.source_ids.includes(id));

        await Promise.all([
          ...toAdd.map(sId => adminService.linkSourceToContent(contentId!, sId).catch(console.error)),
          ...toRemove.map(sId => adminService.unlinkSourceFromContent(contentId!, sId).catch(console.error))
        ]);
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      alert('Erro ao salvar conteúdo. Verifique os dados e o slug e tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja inativar/excluir este conteúdo?')) return;
    
    try {
      await adminService.deleteContent(id);
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir conteúdo:', error);
      alert('Não foi possível excluir o conteúdo.');
    }
  };

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Gerenciar Conteúdos</h2>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()} disabled={disciplines.length === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Conteúdo
        </button>
      </header>

      <div className="admin-content-area">
        {disciplines.length === 0 && !loading && (
          <div className="mb-6 rounded-xl bg-[#fff8e6] p-4 text-[#b45309] border border-[#fde68a]">
            <strong>Atenção:</strong> Você precisa cadastrar pelo menos uma Disciplina antes de criar Conteúdos.
          </div>
        )}

        <div className="admin-card">
          {loading ? (
            <div className="py-12 text-center text-[#64748b]">Carregando conteúdos...</div>
          ) : contents.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhum conteúdo cadastrado ainda.</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Nome / Slug</th>
                    <th>Disciplina</th>
                    <th>Fontes Atreladas</th>
                    <th>Status</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map(content => (
                    <tr key={content.id}>
                      <td>#{content.id}</td>
                      <td>
                        <div className="font-medium text-[#1e293b]">{content.name}</div>
                        <div className="text-[12px] text-[#64748b]">/{content.slug}</div>
                      </td>
                      <td className="text-[#334155]">
                        <span className="inline-block rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold">
                          {disciplinesMap.get(content.discipline_id) || `ID: ${content.discipline_id}`}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {contentSourcesMap.get(content.id)?.map(s => (
                            <span key={s.id} className="inline-block rounded-md bg-[#e0f2fe] px-2 py-0.5 text-xs text-[#0284c7] border border-[#bae6fd]" title={s.name}>
                              {s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name}
                            </span>
                          )) || <span className="text-xs text-[#94a3b8] italic">Nenhuma</span>}
                        </div>
                      </td>
                      <td>
                        {content.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]"></span> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold text-[#475569]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]"></span> Inativo
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenModal(content)} className="admin-btn-edit">
                            Editar
                          </button>
                          <button onClick={() => handleDelete(content.id)} className="admin-btn-danger">
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

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3 className="mb-6 text-xl font-bold text-[#1e293b]">
              {editingId ? 'Editar Conteúdo' : 'Novo Conteúdo'}
            </h3>
            <form onSubmit={handleSave}>
              
              {!editingId && (
                <div className="admin-form-group">
                  <label className="admin-label">Disciplina</label>
                  <select 
                    className="admin-select"
                    value={formData.discipline_id}
                    onChange={e => setFormData({...formData, discipline_id: Number(e.target.value)})}
                    required
                  >
                    <option value={0} disabled>Selecione uma disciplina...</option>
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Nome do Conteúdo</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Ex: Fotossíntese, Equações de 2º Grau"
                  value={formData.name}
                  onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    setFormData({...formData, name, slug: editingId ? formData.slug : slug});
                  }}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Slug (URL amigável)</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="ex: fotossintese"
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descrição (Opcional)</label>
                <textarea 
                  className="admin-input" 
                  rows={3}
                  placeholder="Resumo do que aborda este conteúdo..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Fontes Atreladas (Opcional)</label>
                <MultiSelect 
                  options={allSources.map(s => ({
                    id: s.id,
                    label: s.name,
                    subLabel: `[${s.source_type}]`
                  }))}
                  selectedIds={formData.source_ids}
                  onChange={(ids) => setFormData({...formData, source_ids: ids})}
                  placeholder="Buscar fontes..."
                />
                <p className="mt-1 text-xs text-[#64748b]">Selecione as fontes de conhecimento que embasam este conteúdo.</p>
              </div>

              {editingId && (
                <div className="admin-form-group flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 cursor-pointer accent-[#138ecc]"
                  />
                  <label htmlFor="is_active" className="cursor-pointer font-medium text-[#475569]">Conteúdo Ativo</label>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Criar Conteúdo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
