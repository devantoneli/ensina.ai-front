'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatSidebar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsLoggedIn(Boolean(window.localStorage.getItem('auth_token')));
  }, []);

  const handleProfile = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setIsProfileOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ...existing code...
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth_token');
        window.sessionStorage.removeItem('registered_email');
        window.sessionStorage.removeItem('last_login_email');
        window.sessionStorage.removeItem('just_registered');
      }
      setIsProfileOpen(false);
      router.push('/login');
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-[88px] bg-[#ef7c4d]">
      <div className="relative flex h-full flex-col items-center py-4">
        {/* Topo */}
        <button type="button" className="h-10 w-10 rounded-full bg-white/20 text-white" aria-label="Voltar">
          ‹
        </button>

        {/* Ações */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button type="button" className="h-10 w-10 rounded-full bg-white/20 text-white" aria-label="Nova conversa">＋</button>
          <button type="button" className="h-10 w-10 rounded-full bg-white/20 text-white" aria-label="Mensagens">◦</button>
          <button type="button" className="h-10 w-10 rounded-full bg-white/20 text-white" aria-label="Conteúdos">≡</button>
        </div>

        {/* Rodapé */}
        <div className="mt-auto relative flex flex-col items-center gap-4">
          <button type="button" className="h-10 w-10 rounded-full bg-white/20 text-white" aria-label="Configurações">⚙</button>

          <button
            type="button"
            onClick={handleProfile}
            className="h-10 w-10 rounded-full bg-white text-[#ef7c4d]"
            aria-label="Perfil"
          >
            ☺
          </button>

          {isProfileOpen && (
            <div className="absolute left-[72px] bottom-0 w-52 rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#b42318] hover:bg-[#fff1f3]"
              >
                Finalizar sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}