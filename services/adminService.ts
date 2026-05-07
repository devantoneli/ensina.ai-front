import api from './api';

export interface Discipline {
  id: int;
  name: string;
  description?: string;
}

export interface Content {
  id: number;
  discipline_id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export type SourceType = 'ARCHIVE' | 'VIDEO' | 'URL' | 'ARTICLE';

export interface KnowledgeSource {
  id: number;
  source_type: SourceType;
  name: string;
  archive_url?: string;
  description?: string;
  is_validated: boolean;
  created_at: string;
  knowledge_source_date?: string;
}

export const adminService = {
  // --- Disciplines ---
  async getDisciplines(): Promise<Discipline[]> {
    const response = await api.get<Discipline[]>('/disciplines/');
    return response.data;
  },

  async createDiscipline(data: { name: string; description?: string }): Promise<Discipline> {
    const response = await api.post<Discipline>('/disciplines/', data);
    return response.data;
  },

  async updateDiscipline(id: number, data: { name?: string; description?: string }): Promise<Discipline> {
    const response = await api.put<Discipline>(`/disciplines/${id}`, data);
    return response.data;
  },

  async deleteDiscipline(id: number): Promise<void> {
    await api.delete(`/disciplines/${id}`);
  },

  // --- Contents ---
  async getContents(): Promise<Content[]> {
    const response = await api.get<Content[]>('/contents/');
    return response.data;
  },

  async createContent(data: { discipline_id: number; name: string; slug: string; description?: string }): Promise<Content> {
    const response = await api.post<Content>('/contents/', data);
    return response.data;
  },

  async updateContent(id: number, data: { name?: string; slug?: string; description?: string; is_active?: boolean }): Promise<Content> {
    const response = await api.put<Content>(`/contents/${id}`, data);
    return response.data;
  },

  async deleteContent(id: number, force: boolean = false): Promise<void> {
    await api.delete(`/contents/${id}?force=${force}`);
  },

  // --- Knowledge Sources ---
  async getKnowledgeSources(): Promise<KnowledgeSource[]> {
    const response = await api.get<KnowledgeSource[]>('/knowledge-sources/');
    return response.data;
  },

  async createKnowledgeSource(data: { source_type: SourceType; name: string; archive_url?: string; description?: string; is_validated?: boolean }): Promise<KnowledgeSource> {
    const response = await api.post<KnowledgeSource>('/knowledge-sources/', data);
    return response.data;
  },

  async updateKnowledgeSource(id: number, data: { source_type?: SourceType; name?: string; archive_url?: string; description?: string; is_validated?: boolean }): Promise<KnowledgeSource> {
    const response = await api.put<KnowledgeSource>(`/knowledge-sources/${id}`, data);
    return response.data;
  },

  async uploadKnowledgeSource(file: File, name: string, description?: string, is_validated: boolean = false): Promise<KnowledgeSource> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) formData.append('description', description);
    formData.append('is_validated', String(is_validated));

    const response = await api.post<KnowledgeSource>('/knowledge-sources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteKnowledgeSource(id: number): Promise<void> {
    await api.delete(`/knowledge-sources/${id}`);
  },

  // --- Content <-> Source Linking ---
  async getContentSources(content_id: number): Promise<KnowledgeSource[]> {
    const response = await api.get<KnowledgeSource[]>(`/contents/${content_id}/sources`);
    return response.data;
  },

  async linkSourceToContent(content_id: number, source_id: number): Promise<void> {
    await api.post(`/contents/${content_id}/sources/${source_id}`);
  },

  async unlinkSourceFromContent(content_id: number, source_id: number): Promise<void> {
    await api.delete(`/contents/${content_id}/sources/${source_id}`);
  },
};
