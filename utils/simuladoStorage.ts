import { authService } from '@/services/authService';

const SIMULADO_STORAGE_PREFIX = 'ensina_ai_simulado_v1';

function getUserStorageId(): string {
  if (typeof window === 'undefined') return 'guest';
  const user = authService.getCurrentUser();
  const keyPart = user?.id ?? user?.email;
  return keyPart ? String(keyPart) : 'guest';
}

function getSimuladoStorageBase(): string {
  return `${SIMULADO_STORAGE_PREFIX}:${getUserStorageId()}`;
}

export function getSimuladoKeysStorageKey(): string {
  return `${getSimuladoStorageBase()}:completed_keys`;
}

export function getSimuladoAnswersStorageKey(completionKey: string): string {
  return `${getSimuladoStorageBase()}:answers:${completionKey}`;
}

export function getSimuladoCorrectAnswersStorageKey(completionKey: string): string {
  return `${getSimuladoStorageBase()}:correct_answers:${completionKey}`;
}

export function getSimuladoResultStorageKey(completionKey: string): string {
  return `${getSimuladoStorageBase()}:result:${completionKey}`;
}
