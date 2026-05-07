'use client';

import { startTransition, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { chatService } from '@/services/chatService';
import type { SidebarItem, ChatMessageRequest, ChatClassification, KnowledgeSourceRef } from '@/types/chat';
import ReactMarkdown from 'react-markdown';

interface UIMessage {
  role: 'user' | 'model';
  content: string;
  sources?: KnowledgeSourceRef[];
}
import './chat.css';

const sidebarItems: SidebarItem[] = [
  { id: 'chat', label: 'Chat', active: true },
  { id: 'simulados', label: 'Simulados' },
  { id: 'perfil', label: 'Meu Perfil' },
  { id: 'historico', label: 'Histórico' },
  { id: 'desempenho', label: 'Desempenho' },
  { id: 'configuracao', label: 'Configuração' },
];

function ChatIcon() {
  return (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 18L3.5 20V6.5C3.5 5.39543 4.39543 4.5 5.5 4.5H18.5C19.6046 4.5 20.5 5.39543 20.5 6.5V15.5C20.5 16.6046 19.6046 17.5 18.5 17.5H6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SimuladoIcon() {
  return (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4.5H16L19 7.5V18.5C19 19.0523 18.5523 19.5 18 19.5H6C5.44772 19.5 5 19.0523 5 18.5V5.5C5 4.94772 5.44772 4.5 6 4.5H8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 10H15.5M8.5 13.5H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19C6.69939 15.9514 9.06953 14.5 12 14.5C14.9305 14.5 17.3006 15.9514 18.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12A8 8 0 1012 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4V9H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8V12L15 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PerformanceIcon() {
  return (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18.5V10.5M12 18.5V6.5M19 18.5V13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 18.5H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8.5A3.5 3.5 0 1012 15.5A3.5 3.5 0 0012 8.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 12C19 11.4562 18.9335 10.928 18.808 10.4226L20.5 9.25L18.75 6.25L16.75 7C16.0175 6.36074 15.1378 5.88734 14.1743 5.625L13.75 3.5H10.25L9.82574 5.625C8.8622 5.88734 7.9825 6.36074 7.25 7L5.25 6.25L3.5 9.25L5.19202 10.4226C5.06649 10.928 5 11.4562 5 12C5 12.5438 5.06649 13.072 5.19202 13.5774L3.5 14.75L5.25 17.75L7.25 17C7.9825 17.6393 8.8622 18.1127 9.82574 18.375L10.25 20.5H13.75L14.1743 18.375C15.1378 18.1127 16.0175 17.6393 16.75 17L18.75 17.75L20.5 14.75L18.808 13.5774C18.9335 13.072 19 12.5438 19 12Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="user-icon user-icon--small" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 7V5.5C10 4.94772 10.4477 4.5 11 4.5H18.5C19.0523 4.5 19.5 4.94772 19.5 5.5V18.5C19.5 19.0523 19.0523 19.5 18.5 19.5H11C10.4477 19.5 10 19.0523 10 18.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 12H4.5M8 8.5L4.5 12L8 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="user-icon user-icon--small" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 4L10.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 4L14 20L10.5 13.5L4 10L20 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="user-icon user-icon--small" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="user-icon user-icon--small" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg className="user-icon user-icon--small" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19V11M12 19V5M19 19V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="6" width="15" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10.5H16M8 13.5H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function UserChatPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  // Estados do Chat
  const [mode, setMode] = useState<'chat_responde' | 'modo_ensino'>('chat_responde');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trail, setTrail] = useState<string>('');
  const [classification, setClassification] = useState<ChatClassification | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    startTransition(() => {
      setIsAuthorized(true);
    });
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  const showOverlay = isSidebarOpen || isResultsOpen;

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const closePanels = () => {
    setIsSidebarOpen(false);
    setIsResultsOpen(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    const newMessages: UIMessage[] = [
      ...messages,
      { role: 'user', content: userMsg }
    ];
    setMessages(newMessages);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatService.sendMessage(apiMessages, mode);
      
      setMessages([
        ...newMessages,
        { role: 'model', content: response.message, sources: response.sources }
      ]);

      if (response.trail) {
        setTrail(response.trail);
        // Quando recebe trilha, abre o painel automaticamente (se não for mobile pequeno)
        if (window.innerWidth > 1023) {
           setIsResultsOpen(true);
        }
      }
      if (response.classification) {
        setClassification(response.classification);
      }
    } catch (error) {
      console.error('Falha ao enviar mensagem', error);
      // Aqui você poderia adicionar um toast de erro ou mensagem de sistema
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-page">
      <div className="user-mobile-bar">
        <button
          type="button"
          className="user-mobile-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir menu lateral"
        >
          <MenuIcon />
          <span>Menu</span>
        </button>

        <div className="user-mobile-brand">
          <Image
            src="/assets/login/8449060e38dcb948c8eccbc3c8aaac60f16a99f0.png"
            alt="Logo Ensina Aí"
            width={34}
            height={30}
          />
          <span>Ensina AI</span>
        </div>

        <button
          type="button"
          className="user-mobile-toggle"
          onClick={() => setIsResultsOpen(true)}
          aria-label="Abrir painel de resultados"
        >
          <ResultsIcon />
          <span>Resultados</span>
        </button>
      </div>

      {showOverlay && (
        <button
          type="button"
          className="user-overlay"
          onClick={closePanels}
          aria-label="Fechar painéis laterais"
        />
      )}

      <div className="user-layout">
        <aside className={`user-sidebar ${isSidebarOpen ? 'user-sidebar--open' : ''}`}>
          <div className="user-sidebar-header">
            <div className="user-brand">
              <Image
                src="/assets/login/8449060e38dcb948c8eccbc3c8aaac60f16a99f0.png"
                alt="Logo Ensina Aí"
                width={55}
                height={47}
              />
              <span className="user-brand-title">Ensina AI</span>
            </div>
          </div>

          <div className="user-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`user-nav-button ${item.active ? 'user-nav-button--active' : ''}`}
                title={item.active ? item.label : 'Disponível em breve'}
              >
                {item.id === 'chat' && <ChatIcon />}
                {item.id === 'simulados' && <SimuladoIcon />}
                {item.id === 'perfil' && <ProfileIcon />}
                {item.id === 'historico' && <HistoryIcon />}
                {item.id === 'desempenho' && <PerformanceIcon />}
                {item.id === 'configuracao' && <SettingsIcon />}
                <span>{item.label}</span>
              </button>
            ))}

            <p className="user-section-title">Conversas anteriores</p>

            <div className="user-empty-panel user-empty-panel--sidebar">
              <p className="user-empty-panel-title">Nenhuma conversa carregada</p>
              <p className="user-empty-panel-text">
                As conversas aparecerão aqui quando o backend enviar as sessões do usuário.
              </p>
            </div>

            <div className="user-spacer" />
          </div>

          <button type="button" className="user-logout" onClick={handleLogout}>
            <LogoutIcon />
            <span>Sair</span>
          </button>
        </aside>

        <main className="user-main">
          <header className="user-main-header">
            <div className="user-main-heading">
              <h1 className="user-main-title">Chat</h1>
              <p className="user-main-subtitle">Aguardando integração com backend</p>
            </div>
          </header>

          <section className="user-message-area">
            {messages.length === 0 ? (
              <div className="user-empty-chat">
                <div className="user-empty-chat-icon">
                  <EmptyStateIcon />
                </div>
                <h2 className="user-empty-chat-title">Como posso ajudar?</h2>
                <p className="user-empty-chat-text">
                  Selecione o modo "Tira-Dúvidas" para respostas rápidas ou "Modo Ensina" para gerar uma trilha de aprendizado personalizada baseada na sua dúvida.
                </p>
              </div>
            ) : (
              <div className="user-message-stack">
                {messages.map((msg, index) => (
                  <div key={index} className={`user-message-row ${msg.role === 'user' ? 'user-message-row--user' : ''}`}>
                    {msg.role === 'model' && (
                      <div className="user-avatar user-avatar--assistant">
                        <Image src="/assets/login/8449060e38dcb948c8eccbc3c8aaac60f16a99f0.png" width={24} height={20} alt="AI" />
                      </div>
                    )}
                    <div className={`user-bubble ${msg.role === 'user' ? 'user-bubble--user' : 'user-bubble--assistant'}`}>
                      {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          {msg.sources.map((src, i) => (
                            <div key={i} style={{ backgroundColor: 'white', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.85rem', flex: '1 1 auto', minWidth: '200px' }}>
                              <div style={{ fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                {src.url ? (
                                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0284c7' }} onMouseOver={e => e.currentTarget.style.textDecoration='underline'} onMouseOut={e => e.currentTarget.style.textDecoration='none'}>{src.name}</a>
                                ) : (
                                  <span>{src.name}</span>
                                )}
                              </div>
                              {src.contents && src.contents.length > 0 && (
                                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {src.contents.map((c, j) => (
                                    <span key={j} style={{ fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="user-bubble-text">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="user-avatar user-avatar--user">
                        <ProfileIcon />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="user-message-row">
                    <div className="user-avatar user-avatar--assistant">
                      <Image src="/assets/login/8449060e38dcb948c8eccbc3c8aaac60f16a99f0.png" width={24} height={20} alt="AI" />
                    </div>
                    <div className="user-bubble user-bubble--assistant">
                      <div className="user-bubble-text">
                        <p>Digitando...</p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </section>

          <footer className="user-input-bar">
            <div className="user-mode-selector">
              <button
                type="button"
                className={`user-mode-button ${mode === 'chat_responde' ? 'user-mode-button--active' : ''}`}
                onClick={() => setMode('chat_responde')}
              >
                Chat Responde
              </button>
              <button
                type="button"
                className={`user-mode-button ${mode === 'modo_ensino' ? 'user-mode-button--active modo-ensina' : ''}`}
                onClick={() => setMode('modo_ensino')}
              >
                Modo Ensina
              </button>
            </div>
            <form className="user-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="user-input"
                placeholder={mode === 'chat_responde' ? "Faça uma pergunta rápida..." : "Sobre o que você quer aprender hoje?"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="user-send-button"
                disabled={!inputValue.trim() || isLoading}
                aria-label="Enviar mensagem"
              >
                <SendIcon />
              </button>
            </form>
          </footer>
        </main>

        <aside className={`user-results ${isResultsOpen ? 'user-results--open' : ''}`}>
          <div className="user-results-header">
            <h2 className="user-results-title">Resultados do chat</h2>
            <button type="button" className="user-primary-button" disabled>
              <PlusIcon />
              <span>Novo Chat</span>
            </button>
          </div>

          <div className="user-results-section">
            <p className="user-results-label">Conteúdos</p>
            {classification && classification.contents && classification.contents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>
                  Disciplina: <strong>{classification.discipline}</strong>
                </div>
                {classification.contents.map((content, idx) => (
                  <div key={idx} className="user-content-card" style={{ marginTop: 0 }}>
                    <div className="user-content-header">
                      <div className="user-content-badge">📚</div>
                      <div>
                        <div className="user-content-subject">{classification.discipline}</div>
                        <div className="user-content-topic" style={{ fontSize: '1rem', fontWeight: 600, opacity: 1, marginTop: '2px' }}>
                          {content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="user-empty-panel user-empty-panel--results">
                <p className="user-empty-panel-title">Sem conteúdos ainda</p>
                <p className="user-empty-panel-text">
                  Os cards de conteúdo aparecerão aqui quando você iniciar o Modo Ensina.
                </p>
              </div>
            )}
          </div>

          <div className="user-trails">
            <p className="user-results-label">Trilhas</p>
            {trail ? (
              <div style={{ marginTop: '12px', fontSize: '0.9rem', lineHeight: 1.6, color: '#444' }}>
                 <div className="user-bubble-text" style={{ background: 'rgba(255,255,255,0.4)', padding: '16px', borderRadius: '12px' }}>
                   <ReactMarkdown>{trail}</ReactMarkdown>
                 </div>
              </div>
            ) : (
              <div className="user-empty-panel user-empty-panel--results">
                <p className="user-empty-panel-title">Sem trilhas vinculadas</p>
                <p className="user-empty-panel-text">
                  As trilhas serão listadas aqui assim que você enviar uma dúvida no Modo Ensina.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
