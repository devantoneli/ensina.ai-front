/**
 * services/progressService.ts
 * ----------------------------
 * Conecta o frontend com os endpoints de progresso do backend.
 * Endpoints: GET /progress/dashboard
 */

import api from './api';

export interface StudyTime {
  total_messages: number;
  total_sessions: number;
  last_studied_at: string | null;
}

export interface TopicAccuracy {
  topic: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy_pct: number;
}

export interface Accuracy {
  total: number;
  correct: number;
  wrong: number;
  accuracy_pct: number;
  by_topic: TopicAccuracy[];
}

export interface StudiedContent {
  content_id: number;
  content_name: string;
  interactions: number;
  last_studied_at: string;
  correct: number;
  wrong: number;
}

export interface ProgressDashboard {
  study_time: StudyTime;
  accuracy: Accuracy;
  studied_contents: StudiedContent[];
  weak_topics: TopicAccuracy[];
}

export const progressService = {
  /**
   * Retorna o painel completo de progresso do aluno logado.
   */
  async getDashboard(): Promise<ProgressDashboard> {
    const response = await api.get<ProgressDashboard>('/progress/dashboard');
    return response.data;
  },

  /**
   * Inicia uma sessão de estudo ao abrir um chat.
   */
  async startSession(chatId: number): Promise<{ session_id: number; messages_count: number }> {
    const response = await api.post(`/progress/session/start/${chatId}`);
    return response.data;
  },

  /**
   * Encerra a sessão ao fechar o chat.
   */
  async endSession(chatId: number): Promise<void> {
    await api.post(`/progress/session/end/${chatId}`);
  },

  /**
   * Registra que o aluno estudou um conteúdo no chat.
   */
  async recordContentStudied(chatId: number, contentId: number, topic: string): Promise<void> {
    await api.post(`/progress/interaction/content/${contentId}`, {
      chat_id: chatId,
      topic,
    });
  },

  /**
   * Envia a resposta do aluno para avaliação pela IA.
   * Retorna o feedback da IA (acerto/erro + observação).
   */
  async recordAnswer(params: {
    chatId: number;
    question: string;
    answer: string;
    topic: string;
    contentId?: number;
  }): Promise<{ is_correct: boolean; difficulty: string; notes: string }> {
    const response = await api.post('/progress/interaction/question', {
      chat_id: params.chatId,
      question: params.question,
      answer: params.answer,
      topic: params.topic,
      content_id: params.contentId,
    });
    return response.data;
  },
};
