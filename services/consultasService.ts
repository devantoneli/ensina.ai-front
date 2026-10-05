import api from './api';

export type KnowledgeSource = {
  id: number;
  name: string;
  source_type: string;
  archive_url: string;
  knowledge_source_date: string | null;
};

export type ContentMaterial = {
  id: number;
  name: string;
  sources: KnowledgeSource[];
};

export type DisciplineMaterial = {
  id: number;
  name: string;
  contents: ContentMaterial[];
};

export const consultasService = {
  async getMaterials(): Promise<DisciplineMaterial[]> {
    const response = await api.get<DisciplineMaterial[]>('/student-profile/materials');
    return response.data;
  },
};
