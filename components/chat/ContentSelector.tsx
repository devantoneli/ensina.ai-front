'use client';

import { useEffect, useRef, useState } from 'react';
import { subjectService } from '@/services/subjectService';
import type { ContentItem, Subject } from '@/services/subjectService';

type Props = {
  onSelect: (subject: Subject, content: ContentItem) => void;
  loading?: boolean;
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

const TYPE_ICONS: Record<string, string> = {
  lesson: '📖',
  video: '🎥',
  article: '📄',
};

export default function ContentSelector({ onSelect, loading = false }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectQ, setSubjectQ] = useState('');

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [contentQ, setContentQ] = useState('');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const subjectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (subjectTimer.current) clearTimeout(subjectTimer.current);
    subjectTimer.current = setTimeout(async () => {
      setSubjectsLoading(true);
      const result = await subjectService.getSubjects({ q: subjectQ || undefined });
      setSubjects(result.items);
      setSubjectsLoading(false);
    }, subjectQ ? 300 : 0);
    return () => { if (subjectTimer.current) clearTimeout(subjectTimer.current); };
  }, [subjectQ]);

  useEffect(() => {
    if (!selectedSubject) {
      return;
    }
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(async () => {
      setContentsLoading(true);
      const result = await subjectService.getContents(selectedSubject.id, {
        q: contentQ || undefined,
      });
      setContents(result.items);
      setContentsLoading(false);
    }, contentQ ? 300 : 0);
    return () => { if (contentTimer.current) clearTimeout(contentTimer.current); };
  }, [selectedSubject, contentQ]);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedContent(null);
    setContentQ('');
  };

  return (
    <div className="mx-auto w-full max-w-[680px] px-2">
      {/* Busca de disciplinas */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa9bb]" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={subjectQ}
          onChange={(e) => setSubjectQ(e.target.value)}
          placeholder="Buscar disciplina..."
          className="w-full rounded-2xl border border-white/80 bg-white py-3 pl-10 pr-4 text-sm text-[#1f2937] shadow-[0_8px_18px_rgba(34,67,111,0.1)] outline-none focus:border-[#2f90e5]/40 placeholder:text-[#9aa9bb]"
        />
      </div>

      {/* Cards de disciplinas */}
      {subjectsLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2f90e5] border-t-transparent" />
        </div>
      ) : subjects.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#9aa9bb]">
          {subjectQ ? 'Nenhuma disciplina encontrada' : 'Nenhuma disciplina disponível'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {subjects.map((subject) => {
            const isSelected = selectedSubject?.id === subject.id;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => handleSubjectSelect(subject)}
                className={`rounded-2xl border px-4 py-3.5 text-left shadow-[0_8px_18px_rgba(34,67,111,0.1)] transition hover:shadow-[0_12px_24px_rgba(34,67,111,0.15)] hover:-translate-y-0.5 ${
                  isSelected
                    ? 'border-[#2f90e5]/40 bg-[#e8f4fe] text-[#1d6db5]'
                    : 'border-white/80 bg-white text-[#1f2937]'
                }`}
              >
                <p className="text-sm font-semibold">{subject.name}</p>
                {subject.description && (
                  <p className="mt-0.5 truncate text-xs text-[#9aa9bb]">{subject.description}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Conteúdos da disciplina selecionada */}
      {selectedSubject && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa9bb]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                value={contentQ}
                onChange={(e) => setContentQ(e.target.value)}
                placeholder={`Buscar em ${selectedSubject.name}...`}
                className="w-full rounded-xl border border-white/80 bg-white py-2 pl-9 pr-3 text-sm text-[#1f2937] shadow-[0_4px_12px_rgba(34,67,111,0.08)] outline-none focus:border-[#2f90e5]/40 placeholder:text-[#9aa9bb]"
              />
            </div>
          </div>

          {contentsLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2f90e5] border-t-transparent" />
            </div>
          ) : contents.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#9aa9bb]">
              {contentQ ? 'Nenhum conteúdo encontrado' : 'Nenhum conteúdo disponível'}
            </p>
          ) : (
            <div className="space-y-2">
              {contents.map((content) => {
                const isSelected = selectedContent?.id === content.id;
                return (
                  <button
                    key={content.id}
                    type="button"
                    onClick={() => setSelectedContent(isSelected ? null : content)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left shadow-[0_8px_18px_rgba(34,67,111,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(34,67,111,0.13)] ${
                      isSelected
                        ? 'border-[#2f90e5]/40 bg-[#e8f4fe]'
                        : 'border-white/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{TYPE_ICONS[content.type ?? ''] ?? '📄'}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${isSelected ? 'text-[#1d6db5]' : 'text-[#1f2937]'}`}>
                          {content.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {content.difficulty && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[content.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                              {DIFFICULTY_LABELS[content.difficulty] ?? content.difficulty}
                            </span>
                          )}
                          {content.estimated_minutes != null && (
                            <span className="text-xs text-[#9aa9bb]">{content.estimated_minutes} min</span>
                          )}
                          {content.preview && (
                            <span className="truncate text-xs text-[#9aa9bb]">{content.preview}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <svg className="h-5 w-5 shrink-0 text-[#2f90e5]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Botão de confirmação */}
          {selectedContent && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#d0eaff] bg-[#f0f7ff] px-4 py-3">
              <span className="truncate text-sm">
                <span className="text-[#6b7280]">{selectedSubject.name} ›</span>{' '}
                <span className="font-medium text-[#1f2937]">{selectedContent.title}</span>
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() => onSelect(selectedSubject, selectedContent)}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-[#138ecc] px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(19,142,204,0.25)] transition hover:bg-[#1078b0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Iniciar
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
