'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { authService } from '@/services/authService';
import { consultasService, DisciplineMaterial } from '@/services/consultasService';
import './consultas.css';

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  );
}

function getSourceIcon(type: string) {
  switch (type.toUpperCase()) {
    case 'VIDEO':
      return <VideoIcon />;
    case 'URL':
    case 'ARTICLE':
      return <LinkIcon />;
    case 'ARCHIVE':
    default:
      return <FileIcon />;
  }
}

function getSourceTypeLabel(type: string) {
  switch (type.toUpperCase()) {
    case 'VIDEO':
      return 'Vídeo';
    case 'URL':
      return 'Link';
    case 'ARTICLE':
      return 'Artigo';
    case 'ARCHIVE':
      return 'Arquivo/PDF';
    default:
      return 'Material';
  }
}

export default function ConsultasPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [materials, setMaterials] = useState<DisciplineMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDisciplines, setOpenDisciplines] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const loadData = async () => {
      try {
        const data = await consultasService.getMaterials();
        setMaterials(data);
        
        // Open the first discipline by default if it exists
        if (data.length > 0) {
          setOpenDisciplines({ [data[0].id]: true });
        }
      } catch (err) {
        console.error('Failed to load materials:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [isAuthorized]);

  const toggleDiscipline = (id: number) => {
    setOpenDisciplines((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isAuthorized) return null;

  return (
    <div className="consultas-page">
      <ChatSidebar />

      <main className="consultas-main">
        <header className="consultas-header">
          <h1 className="consultas-title">Consultas</h1>
          <p className="consultas-subtitle">Acesse as fontes e materiais de estudo organizados por disciplina e conteúdo.</p>
        </header>

        <section className="consultas-content">
          {isLoading ? (
            <div className="empty-state">
              <p className="empty-title">Carregando materiais...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">Nenhum material encontrado</p>
              <p className="empty-subtitle">Ainda não há fontes vinculadas às disciplinas.</p>
            </div>
          ) : (
            materials.map((discipline) => (
              <div key={discipline.id} className="discipline-card">
                <div 
                  className="discipline-header"
                  onClick={() => toggleDiscipline(discipline.id)}
                >
                  <h2 className="discipline-title">{discipline.name}</h2>
                  <ChevronIcon 
                    className={`discipline-icon ${openDisciplines[discipline.id] ? 'open' : ''}`} 
                  />
                </div>
                
                {openDisciplines[discipline.id] && (
                  <div className="contents-list">
                    {discipline.contents.map((content) => (
                      <div key={content.id} className="content-section">
                        <h3 className="content-title">{content.name}</h3>
                        
                        <div className="sources-grid">
                          {content.sources.map((source) => (
                            <a 
                              key={source.id} 
                              href={source.archive_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="source-card"
                            >
                              <div className="source-icon-wrap">
                                {getSourceIcon(source.source_type)}
                              </div>
                              <div className="source-info">
                                <span className="source-name" title={source.name}>
                                  {source.name}
                                </span>
                                <span className="source-meta">
                                  {getSourceTypeLabel(source.source_type)}
                                  {source.knowledge_source_date && ` · ${new Date(source.knowledge_source_date).getFullYear()}`}
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
