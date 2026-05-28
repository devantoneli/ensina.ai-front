'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { adminService, KnowledgeSource, SourceType, Content } from '@/services/adminService';
import MultiSelect from '@/components/MultiSelect';
import AdminAlertModal from '@/components/AdminAlertModal';

const SORT_OPTIONS = [
  { field: 'id',   label: 'ID'   },
  { field: 'name', label: 'Nome' },
  { field: 'type', label: 'Tipo' },
] as const;
type SortField = typeof SORT_OPTIONS[number]['field'];

const SOURCE_TYPES: SourceType[] = ['URL', 'VIDEO', 'ARTICLE', 'ARCHIVE'];

export default function AdminSources() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);

  const [alertModal, setAlertModal] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [allContents, setAllContents] = useState<Content[]>([]);
  const [sourceContentsMap, setSourceContentsMap] = useState<Map<number, Content[]>>(new Map());

  const [formData, setFormData] = useState<{
    source_type: SourceType;
    name: string;
    description: string;
    archive_url: string;
    is_validated: boolean;
    file: File | null;
    content_ids: number[];
  }>({
    source_type: 'URL',
    name: '',
    description: '',
    archive_url: '',
    is_validated: true,
    file: null,
    content_ids: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSourceType, setFilterSourceType] = useState<SourceType | ''>('');
  const [filterIsValidated, setFilterIsValidated] = useState<'' | 'true' | 'false'>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const hasActiveFilters = filterSourceType !== '' || filterIsValidated !== '';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sourcesData, contentsData] = await Promise.all([
        adminService.getKnowledgeSources(),
        adminService.getContents()
      ]);
      setSources([...sourcesData].sort((a, b) => a.id - b.id));
      setAllContents(contentsData);

      const map = new Map<number, Content[]>();
      await Promise.all(contentsData.map(async (content) => {
        try {
          const linkedSources = await adminService.getContentSources(content.id);
          linkedSources.forEach(ls => {
            if (!map.has(ls.id)) map.set(ls.id, []);
            map.get(ls.id)!.push(content);
          });
        } catch (e) { /* ignore */ }
      }));

      setSourceContentsMap(map);
    } catch (error) {
      setAlertModal({ message: 'Erro ao carregar fontes de conhecimento.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...sources]
      .filter(s => {
        if (filterSourceType && s.source_type !== filterSourceType) return false;
        if (filterIsValidated === 'true' && !s.is_validated) return false;
        if (filterIsValidated === 'false' && s.is_validated) return false;
        if (!q) return true;
        return (
          String(s.id).includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.archive_url || '').toLowerCase().includes(q) ||
          s.source_type.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'id')   cmp = a.id - b.id;
        if (sortField === 'name') cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR');
        if (sortField === 'type') cmp = a.source_type.localeCompare(b.source_type);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [sources, searchQuery, filterSourceType, filterIsValidated, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setIsSortOpen(false);
  };

  const handleOpenModal = (source?: KnowledgeSource) => {
    if (source) {
      setEditingId(source.id);
      const linkedContentIds = sourceContentsMap.get(source.id)?.map(c => c.id) || [];
      setFormData({
        source_type: source.source_type,
        name: source.name || '',
        description: source.description || '',
        archive_url: source.archive_url || '',
        is_validated: source.is_validated,
        file: null,
        content_ids: linkedContentIds
      });
    } else {
      setEditingId(null);
      setFormData({
        source_type: 'URL',
        name: '',
        description: '',
        archive_url: '',
        is_validated: true,
        file: null,
        content_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        file: selectedFile,
        name: prev.name || selectedFile.name
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!editingId && formData.source_type === 'ARCHIVE' && !formData.file) {
      setAlertModal({ message: 'Por favor, selecione um arquivo para fazer upload.', type: 'warning' });
      return;
    }

    if (formData.source_type !== 'ARCHIVE' && !formData.archive_url.trim()) {
      setAlertModal({ message: 'Por favor, preencha o link (URL) da fonte.', type: 'warning' });
      return;
    }

    const wasEditing = !!editingId;
    setIsUploading(true);
    try {
      let createdSourceId = editingId;

      if (editingId) {
        await adminService.updateKnowledgeSource(editingId, {
          source_type: formData.source_type,
          name: formData.name,
          archive_url: formData.archive_url,
          description: formData.description,
          is_validated: formData.is_validated
        });

        const oldContentIds = sourceContentsMap.get(editingId)?.map(c => c.id) || [];
        const toAdd = formData.content_ids.filter(id => !oldContentIds.includes(id));
        const toRemove = oldContentIds.filter(id => !formData.content_ids.includes(id));

        await Promise.all([
          ...toAdd.map(cId => adminService.linkSourceToContent(cId, editingId).catch(console.error)),
          ...toRemove.map(cId => adminService.unlinkSourceFromContent(cId, editingId).catch(console.error))
        ]);
      } else {
        let createdSource: KnowledgeSource;

        if (formData.source_type === 'ARCHIVE') {
          createdSource = await adminService.uploadKnowledgeSource(
            formData.file!,
            formData.name,
            formData.description,
            formData.is_validated
          );
        } else {
          createdSource = await adminService.createKnowledgeSource({
            source_type: formData.source_type,
            name: formData.name,
            archive_url: formData.archive_url,
            description: formData.description,
            is_validated: formData.is_validated
          });
        }

        createdSourceId = createdSource.id;

        if (formData.content_ids.length > 0) {
          await Promise.all(formData.content_ids.map(contentId =>
            adminService.linkSourceToContent(contentId, createdSourceId!)
              .catch(err => console.error(`Erro ao vincular conteúdo ${contentId}`, err))
          ));
        }
      }

      handleCloseModal();
      setAlertModal({ message: wasEditing ? 'Fonte atualizada com sucesso!' : 'Fonte adicionada com sucesso!', type: 'success' });
      fetchData();
    } catch (error) {
      setAlertModal({ message: 'Erro ao processar a fonte. Verifique os logs para mais detalhes.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: number, name: string) => setDeleteConfirm({ id, name });

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminService.deleteKnowledgeSource(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      setDeleteConfirm(null);
      setAlertModal({ message: 'Não foi possível excluir a fonte.', type: 'error' });
    }
  };

  return (
    <>
      <header className="admin-main-header">
        <h2 className="admin-title">Fontes de Conhecimento</h2>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Fonte
        </button>
      </header>

      <div className="admin-content-area">
        <div className="admin-card">
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Buscar por ID, nome, URL, tipo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="admin-input" style={{ paddingLeft: 34, height: 38 }} />
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
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0', padding: 14, minWidth: 230, zIndex: 20 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Filtros</p>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Tipo</label>
                      <select value={filterSourceType} onChange={e => setFilterSourceType(e.target.value as SourceType | '')} className="admin-select" style={{ height: 34 }}>
                        <option value="">Todos</option>
                        {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#475569', fontWeight: 500, marginBottom: 4 }}>Processamento IA</label>
                      <select value={filterIsValidated} onChange={e => setFilterIsValidated(e.target.value as '' | 'true' | 'false')} className="admin-select" style={{ height: 34 }}>
                        <option value="">Todos</option>
                        <option value="true">Base Alimentada</option>
                        <option value="false">Aguardando</option>
                      </select>
                    </div>
                    {hasActiveFilters && (
                      <button type="button" onClick={() => { setFilterSourceType(''); setFilterIsValidated(''); }} style={{ marginTop: 10, fontSize: '0.82rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
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

          {loading ? (
            <div className="py-12 text-center text-[#64748b]">Carregando fontes...</div>
          ) : sources.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">Nenhuma fonte cadastrada ainda.</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-[#64748b]">Nenhum resultado para "<strong>{searchQuery || 'filtro aplicado'}</strong>".</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Tipo</th>
                    <th>Nome / Link</th>
                    <th>Conteúdos Atrelados</th>
                    <th>Processamento IA</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(source => (
                    <tr key={source.id}>
                      <td>#{source.id}</td>
                      <td>
                        <span className="inline-block rounded bg-[#e0f2fe] px-2 py-1 text-xs font-bold text-[#0284c7]">
                          {source.source_type}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium text-[#1e293b]">{source.name}</div>
                        {source.archive_url && (
                          <div className="text-[12px] text-[#3b82f6] max-w-xs truncate" title={source.archive_url}>
                            <a href={source.archive_url} target="_blank" rel="noreferrer" className="hover:underline">
                              {source.archive_url}
                            </a>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {sourceContentsMap.get(source.id)?.map(c => (
                            <span key={c.id} className="inline-block rounded-md bg-[#f1f5f9] px-2 py-0.5 text-xs text-[#475569] border border-[#e2e8f0]">
                              {c.name}
                            </span>
                          )) || <span className="text-xs text-[#94a3b8] italic">Nenhum</span>}
                        </div>
                      </td>
                      <td>
                        {source.is_validated ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]"></span> Base Alimentada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef9c3] px-2.5 py-1 text-xs font-semibold text-[#a16207]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]"></span> Aguardando
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenModal(source)} className="admin-btn-edit">Editar</button>
                          <button onClick={() => handleDelete(source.id, source.name)} className="admin-btn-danger">Excluir</button>
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
            <p className="text-sm text-[#475569] mb-6 leading-relaxed">
              Você tem certeza de que deseja excluir a fonte <strong>"{deleteConfirm.name}"</strong>? Se ela estiver processada pela IA, será removida da base de conhecimento.
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
              {editingId ? 'Editar Fonte' : 'Adicionar Nova Fonte'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label className="admin-label">Tipo da Fonte</label>
                <select
                  className="admin-select"
                  value={formData.source_type}
                  onChange={e => setFormData(prev => ({ ...prev, source_type: e.target.value as SourceType }))}
                  required
                >
                  <option value="URL">Página da Web (URL)</option>
                  <option value="ARTICLE">Artigo (Texto/Link)</option>
                  <option value="VIDEO">Vídeo (YouTube)</option>
                  <option value="ARCHIVE">Arquivo (PDF, Upload)</option>
                </select>
              </div>

              {formData.source_type === 'ARCHIVE' ? (
                <div key="archive-group" className="admin-form-group">
                  <label className="admin-label">Arquivo (PDF recomendado)</label>
                  <input type="file" className="admin-input" onChange={handleFileChange} accept=".pdf,.txt,.docx" required={!editingId} />
                  {formData.file ? (
                    <p className="mt-2 text-sm text-[#0ea5e9]">Arquivo selecionado: {formData.file.name}</p>
                  ) : editingId ? (
                    <p className="mt-2 text-sm text-[#64748b]">Deixe em branco para manter o arquivo atual.</p>
                  ) : null}
                </div>
              ) : (
                <div key="url-group" className="admin-form-group">
                  <label className="admin-label">Link (URL)</label>
                  <input type="url" className="admin-input" placeholder="https://..." value={formData.archive_url || ''} onChange={e => setFormData(prev => ({ ...prev, archive_url: e.target.value }))} required />
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Nome de Exibição</label>
                <input type="text" className="admin-input" placeholder="Ex: Introdução à Genética" value={formData.name || ''} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descrição Breve</label>
                <textarea className="admin-input" rows={2} placeholder="Sobre o que é este documento..." value={formData.description || ''} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Conteúdos Atrelados (Opcional)</label>
                <MultiSelect
                  options={allContents.map(c => ({ id: c.id, label: c.name, subLabel: `(${c.slug})` }))}
                  selectedIds={formData.content_ids}
                  onChange={(ids) => setFormData(prev => ({ ...prev, content_ids: ids }))}
                  placeholder="Buscar conteúdos..."
                />
                <p className="mt-1 text-xs text-[#64748b]">Selecione os conteúdos onde esta fonte será usada como base de conhecimento.</p>
              </div>

              <div className="admin-form-group flex items-center gap-3 rounded-lg bg-[#f0f9ff] p-4 border border-[#bae6fd]">
                <input type="checkbox" id="is_validated" checked={formData.is_validated} onChange={e => setFormData(prev => ({ ...prev, is_validated: e.target.checked }))} className="h-5 w-5 cursor-pointer accent-[#138ecc]" />
                <div>
                  <label htmlFor="is_validated" className="cursor-pointer font-bold text-[#0369a1]">Processar IA Automaticamente</label>
                  <p className="text-xs text-[#0c4a6e] mt-1">Ao marcar, o sistema irá ler e injetar o conhecimento na IA (RAG) em background.</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="admin-btn-secondary" disabled={isUploading}>Cancelar</button>
                <button type="submit" className="admin-btn-primary" disabled={isUploading}>
                  {isUploading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>Processando...</>
                  ) : (
                    editingId ? 'Salvar Alterações' : 'Adicionar Fonte'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
