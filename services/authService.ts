import axios from 'axios';
import api from './api';
import { LoginRequest, LoginResponse, RegisterRequest, User, UserRole } from '@/types/auth';

interface MockStoredUser extends User {
  password: string;
}

const ACCESS_TOKEN_KEY = 'access_token';
const USER_DATA_KEY = 'user_data';
const MOCK_USERS_KEY = 'mock_users';

function isMockAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';
}

function generateMockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readMockUsers(): MockStoredUser[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawUsers = localStorage.getItem(MOCK_USERS_KEY);
  if (!rawUsers) {
    return [];
  }

  try {
    return JSON.parse(rawUsers) as MockStoredUser[];
  } catch {
    return [];
  }
}

function writeMockUsers(users: MockStoredUser[]): void {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function sanitizeMockUser(user: MockStoredUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function persistSession(user: User): LoginResponse {
  const accessToken = `mock-token-${user.id}`;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

  return {
    success: true,
    access_token: accessToken,
    user_data: user,
  };
}

function getMockRole(role?: UserRole): UserRole {
  return role === 'admin' ? 'admin' : 'student';
}

async function loginWithMock(credentials: LoginRequest): Promise<LoginResponse> {
  const users = readMockUsers();
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const user = users.find((storedUser) => storedUser.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== credentials.password) {
    throw new Error('Email ou senha inválidos.');
  }

  return persistSession(sanitizeMockUser(user));
}

async function registerWithMock(data: RegisterRequest): Promise<LoginResponse> {
  const users = readMockUsers();
  const normalizedEmail = data.email.trim().toLowerCase();
  const existingUser = users.find((storedUser) => storedUser.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    throw new Error('Já existe uma conta cadastrada com este email.');
  }

  const timestamp = new Date().toISOString();
  const newUser: MockStoredUser = {
    id: generateMockId(),
    name: data.name.trim(),
    email: normalizedEmail,
    password: data.password,
    role: getMockRole(data.role),
    created_at: timestamp,
    updated_at: timestamp,
  };

  writeMockUsers([...users, newUser]);

  return persistSession(sanitizeMockUser(newUser));
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // mantém explícito no console para facilitar debug
  // (erro de tela já tratado no register.tsx)
  console.warn('NEXT_PUBLIC_API_URL não definida');
}

type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'student' | 'admin';
};

export const authService = {
  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (isMockAuthEnabled()) {
      return loginWithMock(credentials);
    }

    try {
      const formData = new URLSearchParams({
        username: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

      const response = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      });

      const accessToken = response.data.access_token ?? response.data.token;

      if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem('auth_token', accessToken);
      }

      const currentUser = response.data.user_data ?? (accessToken ? await this.getMe() : null);

      if (currentUser) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(currentUser));
      }

      return {
        success: true,
        access_token: accessToken ?? '',
        user_data: currentUser ?? ({} as User),
        message: response.data.message,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error('Backend indisponível. Ative o modo mock com NEXT_PUBLIC_USE_MOCK_AUTH=true.');
      }

      throw error;
    }
  },

  /**
   * Realiza cadastro de novo usuário
   */
  async register(payload: RegisterPayload): Promise<LoginResponse> {
    if (isMockAuthEnabled()) {
      return registerWithMock(payload);
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register`, payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error('Backend indisponível. Ative o modo mock com NEXT_PUBLIC_USE_MOCK_AUTH=true.');
      }

      throw error;
    }
  },

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Retorna dados do usuário logado
   */
  getCurrentUser(): User | null {
    const userData = localStorage.getItem(USER_DATA_KEY);

    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  },

  /**
   * Busca informações atualizadas do usuário
   */
  async getMe(): Promise<User> {
    if (isMockAuthEnabled()) {
      const currentUser = this.getCurrentUser();

      if (!currentUser) {
        throw new Error('Nenhum usuário autenticado no modo mock.');
      }

      return currentUser;
    }

    const response = await api.get<User>('/users/me');
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Altera a senha do usuário autenticado
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (isMockAuthEnabled()) {
      const users = readMockUsers();
      const currentUser = this.getCurrentUser();
      if (!currentUser) throw new Error('Nenhum usuário autenticado.');
      const userIndex = users.findIndex((u) => u.id === currentUser.id);
      if (userIndex === -1) throw new Error('Usuário não encontrado.');
      if (users[userIndex].password !== currentPassword) throw new Error('Senha atual incorreta.');
      users[userIndex].password = newPassword;
      writeMockUsers(users);
      return;
    }

    await api.post('/users/me/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};
