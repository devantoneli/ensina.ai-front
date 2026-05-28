'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { adminService, Content, Discipline, KnowledgeSource } from '@/services/adminService';
import MultiSelect from '@/components/MultiSelect';
import AdminAlertModal from '@/components/AdminAlertModal';

const SORT_OPTIONS = [
  { field: 'id',         label: 'ID'        },
  { field: 'name',       label: 'Nome'      },
  { field: 'discipline', label: 'Disciplina'},
  { field: 'status',     label: 'Status'    },
] as const;
type SortField = typeof SORT_OPTIONS[number]['field'];

export default function AdminContents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [allSources, setAllSources] = useState<KnowledgeSource[]>([]);
  const [contentSourcesMap, setContentSourcesMap] = useState<Map<number, KnowledgeSource[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const [alertModal, setAlertModal] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ discipline_id: 0, name: '', slug: '', description: '', is_active: true, source_ids: [] as number[] });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisciplineId, setFilterDisciplineId] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
  const [filterHasSources, setFilterHasSources] = useState<'' | 'yes' | 'no'>('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contentsData, disciplinesData, sourcesData] = await Promise.all([
        adminService.getContents(),
        adminService.getDisciplines(),
        adminService.getKnowledgeSources()
      ]);
      setContents([...contentsData].sort((a, b) => a.id - b.id));
      setDisciplines(disciplinesData);
      setAllSources(sourcesData);
      const map = new Map<number, KnowledgeSource[]>();
      await Promise.all(contentsData.map(async (content) => {
        try { const ls = await adminService.getContentSources(content.id); map.set(content.id, ls); } catch {}
      }));
      setContentSourcesMap(map);
    } catch {
      setAlertModal({ message: 'Erro ao carregar dados da página.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const disciplinesMap = useMemo(() => {
    const map = new Map<number, string>();
    disciplines.forEach(d => map.set(d.id, d.name));
    return map;
  }, [disciplines]);

  const hasActiveFilters = filterDisciplineId !== 0 || filterStatus !== '' || filterHasSources !== '';

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...contents]
      .filter(c => {
        if (filterDisciplineId !== 0 && c.discipline_id !== filterDisciplineId) return false;
        if (filterStatus === 'active' && !c.is_active) return false;
        if (filterStatus === 'inactive' && c.is_active) return false;
        if (filterHasSources === 'yes' && !(contentSourcesMap.get(c.id)?.length)) return false;
        if (filterHasSources === 'no' && (contentSourcesMap.get(c.id)?.length || 0) > 0) return false;
        if (!q) return true;
        const discName = (disciplinesMap.get(c.discipline_id) || '').toLowerCase();
        return (
          String(c.id).includes(q) ||
          (c.name || '').toLowerCase().includes(q) ||
          (c.slug || '').toLowerCase().includes(q) ||
          discName.includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'id')         cmp = a.id - b.id;
        if (sortField === 'name')       cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR');
        if (sortField === 'discipline') cmp = (disciplinesMap.get(a.discipline_id) || '').localeCompare(disciplinesMap.get(b.discipline_id) || '', 'pt-BR');
        if (sortField === 'status')     cmp = Number(b.is_active) - Number(a.is_active);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [contents, searchQuery, filterDisciplineId, filterStatus, filterHasSources, sortField, sortDir, disciplinesMap, contentSourcesMap]);

  const handleOpenModal = (content?: Content) => {
    if (content) {
      setEditingId(content.id);
      const linkedSourceIds = contentSourcesMap.get(content.id)?.map(s => s.id) || [];
      setFormData({ discipline_id: content.discipline_id, name: content.name || '', slug: content.slug || '', description: content.description || '', is_active: content.is_active, source_ids: linkedSourceIds });
    } else {
      setEditingId(null);
      setFormData({ discipline_id: disciplines.length > 0 ? disciplines[0].id : 0, name: '', slug: '', description: '', is_active: true, source_ids: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim() || formData.discipline_id === 0) return;
    try {
      const wasEditing = !!editingId;
      let contentId = editingId;
      if (editingId) {
        await adminService.updateContent(editingId, { name: formData.name, slug: formData.slug, description: formData.description, is_active: formData.is_active });
      } else {
        const created = await adminService.createContent({ discipline_id: formData.discipline_id, name: formData.name, slug: formData.slug, description: formData.description });
        contentId = created.id;
      }
      if (contentId) {
        const oldIds = editingId ? (contentSourcesMap.get(editingId)?.map(s => s.id) || []) : [];
        const toAdd = formData.source_ids.filter(id => !oldIds.includes(id));
        const toRemove = oldIds.filter(id => !formData.source_ids.includes(id));
        await Promise.all([
          ...toAdd.map(sId => adminService.linkSourceToContent(contentId!, sId).catch(console.error)),
          ...toRemove.map(sId => adminService.unlinkSourceFromContent(contentId!, sId).catch(console.error))
        ]);
      }
      handleCloseModal();
      setAlertModal({ message: wasEditing ? 'Conteúdo atualizado com sucesso!' : 'Conteúdo criado com sucesso!', type: 'success' });
      fetchData();
    } catch {
      setAlertModal({ message: 'Erro ao salvar conteúdo. Verifique os dados e o slug e tente novamente.', type: 'error' });
    }
  };

  const handleDelete = (id: number, name: string) => setDeleteConfirm({ id, name });

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try { await adminService.deleteContent(deleteConfirm.id); setDeleteConfirm(null); fetchData(); }
    catch { setDeleteConfirm(null); setAlertModal({ message: 'Não foi possível excluir o conteúdo.', type: 'error' }); }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setIsSortOpen(false);
  };

  const SortArrow = ({ field }: { field: SortField }) => sortField !== field ? null : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {sortDir === 'asc' ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></> : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}
    </svg>
  );

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Gerenciar Conteúdos</h2>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()} disabled={disciplines.length === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Buscar por ID, nome, slug, disciplina..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="admin-input" style={{ paddingLeft: 34, height: 38 }} />
            </div>

            {/* Filter */}
            <div style={{ position: 'relative' }}>
              <button type="button" className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38 }} onClick={() => { setIsFilterOpen(p => !p); setIsSortOpen(false); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filtros
                {hasActiveFilters && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#138ecc' }} />}
              </button>
              {isFilterOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setIsFilterOpen(false)} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0', padding: 14, minWidth: 230, zIndex: 20 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Filtros</p>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Disciplina</label>
                      <select value={filterDisciplineId} onChange={e => setFilterDisciplineId(Number(e.target.value))} className="admin-select">
                        <option value={0}>Todas</option>
                        {[...disciplines].sort((a,b) => a.name.localeCompare(b.name,'pt-BR')).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Status</label>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="admin-select">
                        <option value="">Todos</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Fontes</label>
                      <select value={filterHasSources} onChange={e => setFilterHasSources(e.target.value as any)} className="admin-select">
                        <option value="">Todas</option>
                        <option value="yes">Com fontes</option>
                        <option value="no">Sem fontes</option>
                      </select>
                    </div>
                    {hasActiveFilters && (
                      <button type="button" onClick={() => { setFilterDisciplineId(0); setFilterStatus(''); setFilterHasSources(''); }} style={{ marginTop: 12, fontSize: '0.82rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>Limpar filtros</button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sort */}
            <div style={{ position: 'relative' }}>
              <button type="button" className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38 }} onClick={() => { setIsSortOpen(p => !p); setIsFilterOpen(false); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
                Ordenar
              </button>
              {isSortOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setIsSortOpen(false)} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0', padding: 6, minWidth: 180, zIndex: 20 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 8px' }}>Ordenar por</p>
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.field} type="button" onClick={() => toggleSort(opt.field)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 10px', border: 'none', background: sortField === opt.field ? '#f0f9ff' : 'transparent', color: sortField === opt.field ? '#138ecc' : '#475569', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: sortField === opt.field ? 600 : 400 }}>
                        {opt.label} <SortArrow field={opt.field} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#64748b]">Carregando conteúdos...</div>
          ) : contents.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhum conteúdo cadastrado ainda.</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-[#64748b]">Nenhum resultado encontrado para os filtros aplicados.</div>
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
                  {filtered.map(content => (
                    <tr key={content.id}>
                      <td>#{content.id}</td>
                      <td>
                        <div className="font-medium text-[#1e293b]">{content.name}</div>
                        <div className="text-[12px] text-[#64748b]">/{content.slug}</div>
                      </td>
                      <td><span className="inline-block rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold">{disciplinesMap.get(content.discipline_id) || `ID: ${content.discipline_id}`}</span></td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {contentSourcesMap.get(content.id)?.map(s => (
                            <span key={s.id} className="inline-block rounded-md bg-[#e0f2fe] px-2 py-0.5 text-xs text-[#0284c7] border border-[#bae6fd]" title={s.name}>{s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name}</span>
                          )) || <span className="text-xs text-[#94a3b8] italic">Nenhuma</span>}
                        </div>
                      </td>
                      <td>
                        {content.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]"/> Ativo</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold text-[#475569]"><span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]"/> Inativo</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenModal(content)} className="admin-btn-edit">Editar</button>
                          <button onClick={() => handleDelete(content.id, content.name)} className="admin-btn-danger">Excluir</button>
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
            <p className="text-sm text-[#475569] mb-6 leading-relaxed">Você tem certeza de que deseja excluir o conteúdo <strong>"{deleteConfirm.name}"</strong>? Essa ação é irreversível.</p>
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
            <h3 className="mb-6 text-xl font-bold text-[#1e293b]">{editingId ? 'Editar Conteúdo' : 'Novo Conteúdo'}</h3>
            <form onSubmit={handleSave}>
              {!editingId && (
                <div className="admin-form-group">
                  <label className="admin-label">Disciplina</label>
                  <select className="admin-select" value={formData.discipline_id} onChange={e => setFormData({...formData, discipline_id: Number(e.target.value)})} required>
                    <option value={0} disabled>Selecione uma disciplina...</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="admin-form-group">
                <label className="admin-label">Nome do Conteúdo</label>
                <input type="text" className="admin-input" placeholder="Ex: Fotossíntese, Equações de 2º Grau" value={formData.name} onChange={e => { const name = e.target.value; const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); setFormData({...formData, name, slug: editingId ? formData.slug : slug}); }} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Slug (URL amigável)</label>
                <input type="text" className="admin-input" placeholder="ex: fotossintese" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Descrição (Opcional)</label>
                <textarea className="admin-input" rows={3} placeholder="Resumo do que aborda este conteúdo..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Fontes Atreladas (Opcional)</label>
                <MultiSelect options={allSources.map(s => ({ id: s.id, label: s.name, subLabel: `[${s.source_type}]` }))} selectedIds={formData.source_ids} onChange={(ids) => setFormData({...formData, source_ids: ids})} placeholder="Buscar fontes..." />
                <p className="mt-1 text-xs text-[#64748b]">Selecione as fontes de conhecimento que embasam este conteúdo.</p>
              </div>
              {editingId && (
                <div className="admin-form-group flex items-center gap-3">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="h-4 w-4 cursor-pointer accent-[#138ecc]" />
                  <label htmlFor="is_active" className="cursor-pointer font-medium text-[#475569]">Conteúdo Ativo</label>
                </div>
              )}
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary">Cancelar</button>
                <button type="submit" className="admin-btn-primary">{editingId ? 'Salvar Alterações' : 'Criar Conteúdo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
