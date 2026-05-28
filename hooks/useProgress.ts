/**
 * hooks/useProgress.ts
 * ---------------------
 * Hook que busca o dashboard de progresso do aluno.
 * Usado nas páginas de histórico e progresso.
 */

import { useEffect, useState } from 'react';
import { progressService, ProgressDashboard } from '@/services/progressService';
import { authService } from '@/services/authService';

interface UseProgressResult {
  dashboard: ProgressDashboard | null;
  isLoading: boolean;
  error: string | null;
}

export function useProgress(): UseProgressResult {
  const [dashboard, setDashboard] = useState<ProgressDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(() => authService.isAuthenticated());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      return;
    }

    progressService
      .getDashboard()
      .then(setDashboard)
      .catch(() => setError('Não foi possível carregar o progresso.'))
      .finally(() => setIsLoading(false));
  }, []);

  return { dashboard, isLoading, error };
}
