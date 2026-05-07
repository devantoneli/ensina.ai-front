import api from './api';
import { ApiResponse } from '@/types/auth';
import { Simulado } from '@/types/simulados';

type SimuladoApiItem = Partial<{
  id: string | number;
  titulo: string;
  title: string;
  name: string;
  descricao: string;
  description: string;
  nivel: string;
  level: string;
  difficulty: string;
  questoes: number | string;
  questions: number | string;
  question_count: number | string;
  tempoEstimado: number | string;
  estimated_time: number | string;
  duration_minutes: number | string;
  categoria: string;
  category: string;
  subject: string;
  imagem: string;
  image: string;
  feito: boolean;
  completed: boolean;
  is_completed: boolean;
}>;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function normalizeNivel(value: unknown): Simulado['nivel'] {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('fac') || normalized.includes('easy')) {
    return 'Fácil';
  }

  if (normalized.includes('dif') || normalized.includes('hard')) {
    return 'Difícil';
  }

  return 'Médio';
}

function normalizeSimulado(item: SimuladoApiItem): Simulado {
  const titulo = item.titulo ?? item.title ?? item.name ?? 'Simulado';
  const descricao = item.descricao ?? item.description ?? '';
  const nivel = normalizeNivel(item.nivel ?? item.level ?? item.difficulty);
  const questoes = toNumber(item.questoes ?? item.questions ?? item.question_count);
  const tempoEstimado = toNumber(item.tempoEstimado ?? item.estimated_time ?? item.duration_minutes);
  const categoria = item.categoria ?? item.category ?? item.subject ?? 'Geral';

  return {
    id: String(item.id ?? crypto.randomUUID()),
    titulo,
    descricao,
    nivel,
    questoes,
    tempoEstimado,
    categoria,
    imagem: item.imagem ?? item.image,
    feito: item.feito ?? item.completed ?? item.is_completed,
  };
}

function extractSimulados(payload: unknown): SimuladoApiItem[] {
  if (Array.isArray(payload)) {
    return payload as SimuladoApiItem[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.exams, record.simulations, record.simulados, record.items, record.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as SimuladoApiItem[];
    }
  }

  return [];
}

function unwrapApiPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  return record.data ?? record.exams ?? record.simulations ?? record.simulados ?? record.items ?? payload;
}

export const simuladoService = {
  async list(): Promise<Simulado[]> {
    const response = await api.get<unknown>('/exams');
    return extractSimulados(unwrapApiPayload(response.data)).map(normalizeSimulado);
  },

  async getById(examId: string | number): Promise<Simulado | null> {
    const response = await api.get<unknown>(`/exams/${examId}`);
    const payload = unwrapApiPayload(response.data);
    const extracted = extractSimulados(payload)[0] ?? (payload as SimuladoApiItem);

    return extracted ? normalizeSimulado(extracted) : null;
  },

  async create(payload: { name: string; creator_name?: string; difficulty?: string; description?: string }): Promise<unknown> {
    const response = await api.post('/exams', payload);
    return response.data;
  },

  async update(examId: string | number, payload: { name?: string; difficulty?: string; description?: string }): Promise<unknown> {
    const response = await api.put(`/exams/${examId}`, payload);
    return response.data;
  },

  async remove(examId: string | number): Promise<void> {
    await api.delete(`/exams/${examId}`);
  },
};