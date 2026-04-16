'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ChatSidebarProps {
  onNewChat?: () => void;
}

export default function ChatSidebar({ onNewChat }: ChatSidebarProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const iconButton = 'flex h-14 w-14 items-center justify-center transition-all duration-200 hover:scale-[1.18] hover:drop-shadow-lg';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsLoggedIn(
      Boolean(window.localStorage.getItem('access_token') || window.localStorage.getItem('auth_token')),
    );
  }, []);

  const handleProfile = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setIsProfileOpen((prev) => !prev);
  };

  const handleConfig = () => {
    router.push('/config');
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
      <div className="relative flex h-full flex-col items-center py-6">
        <button type="button" className={iconButton} aria-label="Voltar">
          <Image src="/assets/chat/Group%2021.png" alt="Voltar" width={52} height={52} />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <button type="button" className={iconButton} aria-label="Nova conversa" onClick={onNewChat}>
            <Image src="/assets/chat/new-chat.png" alt="Nova conversa" width={52} height={52} />
          </button>
          <button type="button" className={iconButton} aria-label="Mensagens">
            <Image src="/assets/chat/chat.png" alt="Mensagens" width={52} height={52} />
          </button>
          <button type="button" className={iconButton} aria-label="Conteudos">
            <Image src="/assets/chat/triagem.png" alt="Conteudos" width={52} height={52} />
          </button>
        </div>

        <div className="mt-auto relative flex flex-col items-center gap-4 pb-2">
          <button type="button" onClick={handleConfig} className={iconButton} aria-label="Configuracoes">
            <Image src="/assets/chat/config.png" alt="Configuracoes" width={52} height={52} />
          </button>

          <button type="button" onClick={handleProfile} className={iconButton} aria-label="Perfil">
            <Image src="/assets/chat/Perfil.png" alt="Perfil" width={52} height={52} />
          </button>

          {isProfileOpen && (
            <div className="absolute left-[76px] bottom-0 w-52 rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-xl">
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
    </aside>
  );
}