'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { getSimuladoKeysStorageKey } from '@/utils/simuladoStorage';
import { simuladoService } from '@/services/simuladoService';
import { adminService } from '@/services/adminService';
import '../../simulados.css';

const NIVEL_TO_DIFFICULTY: Record<string, string> = {
  facil:   'FÁCIL',
  medio:   'MÉDIO',
  dificil: 'DIFÍCIL',
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function levelLabel(value: string): string {
  switch (value.toLowerCase()) {
    case 'facil':
      return 'Fácil';
    case 'medio':
      return 'Médio';
    case 'dificil':
      return 'Difícil';
    default:
      return safeDecode(value);
  }
}

function normalizeCompletionKey(title: string, level: string): string {
  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const normalizedLevel = level
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return `${normalizedTitle}::${normalizedLevel}`;
}

export default function SimuladoDetalhePage() {
  const router = useRouter();
  const params = useParams<{ simulado: string; nivel: string }>();
  const simulado = Array.isArray(params.simulado) ? params.simulado[0] : params.simulado;
  const nivel = Array.isArray(params.nivel) ? params.nivel[0] : params.nivel;

  const titulo = simulado ? safeDecode(simulado) : 'Simulado';
  const nivelExibido = nivel ? levelLabel(safeDecode(nivel)) : 'Nível';
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false);

  const simuladoCompletionKey = useMemo(() => normalizeCompletionKey(titulo, nivelExibido), [titulo, nivelExibido]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(getSimuladoKeysStorageKey());
      const keys = raw ? (JSON.parse(raw) as string[]) : [];
      queueMicrotask(() => {
        setHasCompletedBefore(Array.isArray(keys) && keys.includes(simuladoCompletionKey));
      });
    } catch {
      queueMicrotask(() => {
        setHasCompletedBefore(false);
      });
    }
  }, [simuladoCompletionKey]);

  const [coveredContents, setCoveredContents] = useState<string[]>([]);
  const [contentsLoading, setContentsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadContents = async () => {
      try {
        setContentsLoading(true);
        const examsList = await simuladoService.list();
        const foundExam = examsList.find(
          (e) => e.titulo.toLowerCase().trim() === titulo.toLowerCase().trim()
        );

        if (foundExam && isMounted) {
          const difficulty = nivel ? NIVEL_TO_DIFFICULTY[safeDecode(nivel).toLowerCase()] : undefined;
          const apiQuestions = await simuladoService.getQuestions(foundExam.id, difficulty);
          
          if (apiQuestions && apiQuestions.length > 0) {
            const contentIds = Array.from(new Set(apiQuestions.map(q => q.content_id).filter(Boolean)));
            const allContents = await adminService.getContents();
            
            const matchedContents = contentIds.map(id => {
              const c = allContents.find(content => content.id === id);
              return c ? c.name : `Conteúdo #${id}`;
            });
            
            if (isMounted) {
              setCoveredContents(matchedContents);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar conteúdos:', err);
      } finally {
        if (isMounted) setContentsLoading(false);
      }
    };
    loadContents();
    return () => { isMounted = false; };
  }, [titulo, nivel]);

  const handleIniciar = () => {
    router.push(`/simulados/${encodeURIComponent(titulo)}/${encodeURIComponent(nivel ?? 'medio')}/resolver`);
  };

  return (
    <div className="simulados-page">
      <ChatSidebar />

      <main className="simulados-shell simulados-detail">
        <section className="simulado-detail-card">
          <header className="simulado-detail-header">
            <div>
              <p className="simulado-runner-kicker">Detalhes do simulado</p>
              <h1>{titulo}</h1>
              <p>
                Nível selecionado: <strong>{nivelExibido}</strong>
              </p>
            </div>

            <div className="simulado-detail-status" aria-live="polite">
              <span>{hasCompletedBefore ? 'Concluído' : 'Pendente'}</span>
              <p>Status do aluno</p>
            </div>
          </header>

          <div className="simulado-detail-info">
            <article>
              <p>Formato</p>
              <strong>Múltipla escolha</strong>
            </article>
            <article>
              <p>Alternativas</p>
              <strong>A, B, C, D e E</strong>
            </article>
            <article>
              <p>Retentativa</p>
              <strong>Liberada</strong>
            </article>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <h3 className="mb-3 text-[16px] font-semibold text-[#1f2937]">Conteúdos abordados</h3>
            {contentsLoading ? (
              <p className="text-[14px] text-[#9aa9bb]">Verificando questões...</p>
            ) : coveredContents.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {coveredContents.map((c, i) => (
                  <li key={i} className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[13px] font-medium text-[#475569]">
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-[#9aa9bb]">Nenhum conteúdo específico associado.</p>
            )}
          </div>

          <footer className="simulado-detail-footer">
            <p>
              Você poderá iniciar agora e, se já tiver concluído anteriormente, também refazer este simulado.
            </p>

            <div className="simulado-detail-actions">
              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--ghost"
                onClick={() => router.push('/simulados')}
              >
                Voltar para simulados
              </button>

              <button
                type="button"
                className="simulado-runner-button simulado-runner-button--primary"
                onClick={handleIniciar}
              >
                Iniciar simulado
              </button>
              {hasCompletedBefore ? (
                <button
                  type="button"
                  className="simulado-runner-button simulado-runner-button--primary"
                  onClick={handleIniciar}
                >
                  Refazer simulado
                </button>
              ) : null}
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
