function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token');
}

export type Subject = {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
};

export type ContentItem = {
  id: string;
  title: string;
  type?: 'lesson' | 'video' | 'article' | string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  estimated_minutes?: number;
  preview?: string;
};

export type LimitStatus = {
  at_limit: boolean;
  count?: number;
  limit?: number;
  oldest_chat?: { id: number; name: string };
};

export const subjectService = {
  async getSubjects(params?: {
    q?: string;
    limit?: number;
    page?: number;
  }): Promise<{ items: Subject[]; total: number }> {
    const token = getStoredToken();
    if (!token) return { items: [], total: 0 };

    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    qs.set('limit', String(params?.limit ?? 20));
    if (params?.page) qs.set('page', String(params.page));

    try {
      const res = await fetch(`/api/subjects?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return { items: [], total: 0 };
      return (await res.json()) as { items: Subject[]; total: number };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async getContents(
    subjectId: string,
    params?: { q?: string; difficulty?: string; type?: string; limit?: number },
  ): Promise<{ items: ContentItem[]; total: number }> {
    const token = getStoredToken();
    if (!token) return { items: [], total: 0 };

    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.difficulty) qs.set('difficulty', params.difficulty);
    if (params?.type) qs.set('type', params.type);
    qs.set('limit', String(params?.limit ?? 20));

    try {
      const res = await fetch(`/api/subjects/${subjectId}/contents?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return { items: [], total: 0 };
      return (await res.json()) as { items: ContentItem[]; total: number };
    } catch {
      return { items: [], total: 0 };
    }
  },

  async getLimitStatus(): Promise<LimitStatus | null> {
    const token = getStoredToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/chats/limit-status', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      return (await res.json()) as LimitStatus;
    } catch {
      return null;
    }
  },
};
