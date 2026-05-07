import api from './api';
import type { ChatMessageRequest, ChatResponse } from '@/types/chat';

export const chatService = {
  async sendMessage(messages: ChatMessageRequest[], mode: string): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/free-mode', {
        messages,
        mode,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o chat:', error);
      throw error;
    }
  },
};
