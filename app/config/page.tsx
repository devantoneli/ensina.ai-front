'use client';

import { ChangeEvent, startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { authService } from '@/services/authService';
import './config.css';

type ConfigSection = 'profile' | 'notifications' | 'security' | 'appearance' | 'privacy' | 'about';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  avatar?: string;
}

function BackIcon() {
  return (
    <svg className="config-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="config-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19C6.69939 15.9514 9.06953 14.5 12 14.5C14.9305 14.5 17.3006 15.9514 18.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg className="config-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18.5 10.5V9C18.5 5.41015 15.5899 2.5 12 2.5C8.41015 2.5 5.5 5.41015 5.5 9V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 10.5H5C4.44772 10.5 4 10.9477 4 11.5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V11.5C20 10.9477 19.5523 10.5 19 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg className="config-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L3 6.5V11.5C3 19 12 22 12 22C12 22 21 19 21 11.5V6.5L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg className="config-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg className="config-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1L3 5V11C3 18 12 23 12 23C12 23 21 18 21 11V5L12 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg className="config-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function ConfigPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeSection, setActiveSection] = useState<ConfigSection>('profile');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    city: '',
  });
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    // Load user data from localStorage
    if (typeof window !== 'undefined') {
      const userData = window.localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          startTransition(() => {
            setProfile({
              name: parsed.name || '',
              email: parsed.email || '',
              phone: parsed.phone || '',
              city: parsed.city || '',
              avatar: parsed.avatar,
            });
          });
        } catch {
          // ignore invalid stored user data
        }
      }
    }

    startTransition(() => {
      setIsAuthorized(true);
    });
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setHasChanged(true);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const userData = window.localStorage.getItem('user_data');
      const parsed = userData ? JSON.parse(userData) : {};
      const updated = { ...parsed, ...profile };
      window.localStorage.setItem('user_data', JSON.stringify(updated));
      setHasChanged(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const menuItems: Array<{ id: ConfigSection; label: string; icon: React.ReactNode }> = [
    { id: 'profile', label: 'Dados do Perfil', icon: <ProfileIcon /> },
    { id: 'notifications', label: 'Notificações', icon: <NotificationIcon /> },
    { id: 'security', label: 'Segurança', icon: <SecurityIcon /> },
    { id: 'appearance', label: 'Aparência', icon: <AppearanceIcon /> },
    { id: 'privacy', label: 'Privacidade (LGPD)', icon: <PrivacyIcon /> },
    { id: 'about', label: 'Sobre', icon: <AboutIcon /> },
  ];

  return (
    <div className="config-page">
      <ChatSidebar />

      <main className="config-main">
        <div className="config-header">
          <button type="button" className="config-back-button" onClick={handleBack} aria-label="Voltar">
            <BackIcon />
          </button>
          <div className="config-header-content">
            <h1 className="config-title">Configurações</h1>
            <p className="config-subtitle">Gerencie suas preferências e informações pessoais</p>
          </div>
        </div>

        <div className="config-container">
          <aside className="config-sidebar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`config-menu-item ${activeSection === item.id ? 'config-menu-item--active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          <section className="config-content">
            {activeSection === 'profile' && (
              <div className="config-section">
                <h2 className="config-section-title">Dados do Perfil</h2>
                <p className="config-section-subtitle">Atualize suas informações pessoais</p>

                <div className="config-avatar-section">
                  <div className="config-avatar">
                    {profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar} alt="Avatar" />
                    ) : (
                      <span className="config-avatar-initials">{profile.name?.charAt(0).toUpperCase() || 'M'}</span>
                    )}
                  </div>
                  <label htmlFor="avatar-upload" className="config-upload-button">
                    <span>📷 Alterar foto</span>
                    <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} />
                  </label>
                  <p className="config-upload-hint">JPG, PNG ou GIF. Máx 2MB</p>
                </div>

                <div className="config-form">
                  <div className="config-form-row">
                    <div className="config-form-group">
                      <label htmlFor="name">👤 Nome completo</label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="config-form-group">
                      <label htmlFor="email">📧 Email</label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="config-form-row">
                    <div className="config-form-group">
                      <label htmlFor="phone">☎️ Telefone</label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        placeholder="(11) 98765-4321"
                      />
                    </div>
                    <div className="config-form-group">
                      <label htmlFor="city">📍 Cidade</label>
                      <input
                        id="city"
                        type="text"
                        name="city"
                        value={profile.city}
                        onChange={handleInputChange}
                        placeholder="São Paulo, SP"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanged}
                  className="config-save-button"
                >
                  💾 Salvar alterações
                </button>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="config-section">
                <h2 className="config-section-title">Notificações</h2>
                <p className="config-section-subtitle">Controle como você recebe notificações</p>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Notificações por email</h3>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <p>Receba notificações sobre suas atividades e progresso</p>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Atualizações de conteúdo</h3>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <p>Seja notificado quando novo conteúdo for adicionado às suas áreas de interesse</p>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Lembretes de estudo</h3>
                    <input type="checkbox" />
                  </div>
                  <p>Receba lembretes para manter sua sequência de estudos</p>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="config-section">
                <h2 className="config-section-title">Segurança</h2>
                <p className="config-section-subtitle">Proteja sua conta com essas configurações</p>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Alterar senha</h3>
                  </div>
                  <button type="button" className="config-action-button">
                    Alterar
                  </button>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Autenticação de dois fatores</h3>
                    <input type="checkbox" />
                  </div>
                  <p>Adicione uma camada extra de segurança à sua conta</p>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Sessões ativas</h3>
                  </div>
                  <button type="button" className="config-action-button">
                    Gerenciar
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="config-section">
                <h2 className="config-section-title">Aparência</h2>
                <p className="config-section-subtitle">Personalize a interface de acordo com suas preferências</p>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Tema</h3>
                  </div>
                  <select className="config-select">
                    <option>Claro (padrão)</option>
                    <option>Escuro</option>
                    <option>Automático</option>
                  </select>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Tamanho da fonte</h3>
                  </div>
                  <select className="config-select">
                    <option>Pequeno</option>
                    <option>Normal (padrão)</option>
                    <option>Grande</option>
                  </select>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Animações</h3>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <p>Mostrar animações e transições</p>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="config-section">
                <h2 className="config-section-title">Privacidade (LGPD)</h2>
                <p className="config-section-subtitle">Gerencie seus dados de acordo com a Lei Geral de Proteção de Dados</p>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Coleta de dados</h3>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <p>Permitir que coletemos dados para melhorar sua experiência</p>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Análise de dados</h3>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <p>Compartilhar dados anônimos para análise e pesquisa</p>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Solicitar seus dados</h3>
                  </div>
                  <button type="button" className="config-action-button">
                    Download dos dados
                  </button>
                </div>

                <div className="config-option">
                  <div className="config-option-header">
                    <h3>Deletar conta e dados</h3>
                  </div>
                  <button type="button" className="config-action-button config-action-button--danger">
                    Deletar permanentemente
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="config-section">
                <h2 className="config-section-title">Sobre</h2>
                <p className="config-section-subtitle">Informações sobre o Ensina AI</p>

                <div className="config-about-content">
                  <div className="config-about-item">
                    <h3>Versão</h3>
                    <p>1.0.0</p>
                  </div>

                  <div className="config-about-item">
                    <h3>Desenvolvido por</h3>
                    <p>Ensina AI</p>
                  </div>

                  <div className="config-about-item">
                    <h3>Contato</h3>
                    <p>suporte@ensina.ai</p>
                  </div>

                  <div className="config-about-item">
                    <h3>Termos de Serviço</h3>
                    <a href="#" className="config-link">
                      Leia os termos
                    </a>
                  </div>

                  <div className="config-about-item">
                    <h3>Política de Privacidade</h3>
                    <a href="#" className="config-link">
                      Leia a política
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
