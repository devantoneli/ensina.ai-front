import api from './api';
import type { ChatResponse } from '@/types/chat';

export const chatService = {
  async sendMessage(question: string): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/free-mode/', null, {
        params: { question },
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o chat:', error);
      throw error;
    }
  },
};
