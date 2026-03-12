import api from './api';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types/auth';

export const authService = {
  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Salvar token no localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user_data));
    }
    
    return response.data;
  },

  /**
   * Realiza cadastro de novo usuário
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', data);
    
    // Salvar token no localStorage após registro
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user_data));
    }
    
    return response.data;
  },

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  },

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Retorna dados do usuário logado
   */
  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Busca informações atualizadas do usuário
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>('/users/me');
    localStorage.setItem('user_data', JSON.stringify(response.data));
    return response.data;
  },
};
