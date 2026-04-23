'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

interface ChatSidebarProps {
  onNewChat?: () => void;
}

const USER_DATA_UPDATED_EVENT = 'ensina_ai_user_data_updated';

function getStoredAvatar(): string {
  if (typeof window === 'undefined') return '';

  try {
    const raw = window.localStorage.getItem('user_data');
    if (!raw) return '';

    const parsed = JSON.parse(raw) as { avatar?: string };
    return parsed.avatar?.trim() ?? '';
  } catch {
    return '';
  }
}

export default function ChatSidebar({ onNewChat }: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const quickMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const quickMenuRef = useRef<HTMLDivElement | null>(null);

  const iconButton = 'flex h-[56px] w-[56px] items-center justify-center transition-all duration-200 hover:scale-[1.18] hover:drop-shadow-lg';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentRouteKey = 'ensina_ai_current_route';
    const previousRouteKey = 'ensina_ai_previous_route';
    const previousRoute = window.sessionStorage.getItem(currentRouteKey);

    if (previousRoute && previousRoute !== pathname) {
      window.sessionStorage.setItem(previousRouteKey, previousRoute);
    }

    window.sessionStorage.setItem(currentRouteKey, pathname);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncUserData = () => {
      setIsLoggedIn(
        Boolean(window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token')),
      );
      setAvatarUrl(getStoredAvatar());
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'user_data' || event.key === 'access_token' || event.key === 'auth_token') {
        syncUserData();
      }
    };

    const handleUserDataUpdated = () => {
      syncUserData();
    };

    syncUserData();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdated);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (profileMenuRef.current?.contains(target)) return;
      if (profileButtonRef.current?.contains(target)) return;
      setIsProfileOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    if (!isQuickMenuOpen) return;

    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (quickMenuRef.current?.contains(target)) return;
      if (quickMenuButtonRef.current?.contains(target)) return;
      setIsQuickMenuOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsQuickMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isQuickMenuOpen]);

  const handleProfile = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setIsQuickMenuOpen(false);
    setIsProfileOpen((prev) => !prev);
  };

  const handleQuickMenu = () => {
    setIsProfileOpen(false);
    setIsQuickMenuOpen((prev) => !prev);
  };

  const handleConfig = () => {
    router.push('/config');
  };

  const handleNewChatClick = () => {
    setIsQuickMenuOpen(false);

    if (pathname === '/chat' && onNewChat) {
      onNewChat();
      return;
    }

    router.push('/chat?new=1');
  };

  const handleHistory = () => {
    setIsQuickMenuOpen(false);
    router.push('/history');
  };

  const handleSimulados = () => {
    setIsQuickMenuOpen(false);
    router.push('/simulados');
  };

  const handleChat = () => {
    setIsQuickMenuOpen(false);
    router.push('/chat');
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const previousRoute = window.sessionStorage.getItem('ensina_ai_previous_route');
      if (previousRoute && previousRoute !== pathname) {
        router.push(previousRoute);
        return;
      }

      if (window.history.length > 1) {
        router.back();
        return;
      }
    }

    router.push('/chat');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ...existing code...
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('access_token');
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('user_data');
        window.dispatchEvent(new Event(USER_DATA_UPDATED_EVENT));
        window.sessionStorage.removeItem('registered_email');
        window.sessionStorage.removeItem('last_login_email');
        window.sessionStorage.removeItem('just_registered');
      }
      setIsProfileOpen(false);
      router.push('/login');
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-[80px] bg-[linear-gradient(180deg,#F6FAFD_0%,#C7E7FF_100%)]">
      <div className="relative flex h-full flex-col items-center py-[24px]">
        <button type="button" className={iconButton} aria-label="Voltar" onClick={handleBack}>
          <Image src="/assets/chat/Group%2021.png" alt="Voltar" width={52} height={52} />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center gap-[20px]">
          <button type="button" className={iconButton} aria-label="Nova conversa" onClick={handleNewChatClick}>
            <Image src="/assets/chat/new-chat.png" alt="Nova conversa" width={52} height={52} />
          </button>
          <button type="button" className={iconButton} aria-label="Mensagens" onClick={handleChat}>
            <Image src="/assets/chat/chat.png" alt="Mensagens" width={52} height={52} />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label="Conteudos"
            onClick={handleQuickMenu}
            ref={quickMenuButtonRef}
          >
            <Image src="/assets/chat/triagem.png" alt="Conteudos" width={52} height={52} />
          </button>
        </div>

        <div className="mt-auto relative flex flex-col items-center gap-[16px] pb-[8px]">
          <button type="button" onClick={handleConfig} className={iconButton} aria-label="Configuracoes">
            <Image src="/assets/chat/config.png" alt="Configuracoes" width={52} height={52} />
          </button>

          <button
            type="button"
            onClick={handleProfile}
            className={iconButton}
            aria-label="Perfil"
            ref={profileButtonRef}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar do perfil"
                className="h-[52px] w-[52px] rounded-full object-cover"
              />
            ) : (
              <Image src="/assets/chat/Perfil.png" alt="Perfil" width={52} height={52} />
            )}
          </button>

          {isProfileOpen && (
            <div
              ref={profileMenuRef}
              className="absolute left-[76px] bottom-0 w-52 rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-xl"
            >
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#b42318] hover:bg-[#fff1f3]"
              >
                Finalizar sessao
              </button>
            </div>
          )}
        </div>
      </div>

      {isQuickMenuOpen && (
        <div
          ref={quickMenuRef}
          className="absolute left-[86px] top-1/2 z-40 w-[260px] -translate-y-1/2 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_16px_30px_rgba(34,67,111,0.2)]"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8a9bb2]">Acesso rapido</p>
          <div className="mt-[12px] space-y-[8px]">
            <button
              type="button"
              onClick={handleSimulados}
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-left text-sm font-semibold text-[#1f2937] transition hover:bg-[#f3f6fb]"
            >
              Simulados
            </button>
            <button
              type="button"
              onClick={handleHistory}
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-left text-sm font-semibold text-[#1f2937] transition hover:bg-[#f3f6fb]"
            >
              Historico de conversas
            </button>
            <button
              type="button"
              onClick={handleChat}
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-left text-sm font-semibold text-[#1f2937] transition hover:bg-[#f3f6fb]"
            >
              Desempenho
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}