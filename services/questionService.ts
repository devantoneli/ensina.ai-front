import api from './api';

export interface Alternative {
  id?: number;
  description: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  content_id: number;
  description: string;
  difficulty: 'FÁCIL' | 'MÉDIO' | 'DIFÍCIL' | 'MUITO DIFÍCIL';
  creator_name: string;
  alternatives: Alternative[];
  exam_ids?: number[];
}

export const questionService = {
  async list(): Promise<Question[]> {
    const response = await api.get<Question[]>('/questions');
    return response.data;
  },

  async getById(id: number): Promise<Question> {
    const response = await api.get<Question>(`/questions/${id}`);
    return response.data;
  },

  async create(payload: {
    content_id: number;
    description: string;
    difficulty: string;
    creator_name: string;
    alternatives: Alternative[];
    exam_ids: number[];
  }): Promise<Question> {
    const response = await api.post<Question>('/questions/', payload);
    return response.data;
  },

  async update(
    id: number,
    payload: {
      content_id?: number;
      description?: string;
      difficulty?: string;
      alternatives?: Alternative[];
      exam_ids?: number[];
    }
  ): Promise<Question> {
    const response = await api.put<Question>(`/questions/${id}`, payload);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/questions/${id}`);
  },
};
