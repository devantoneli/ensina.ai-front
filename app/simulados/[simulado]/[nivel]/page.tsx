'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import '../../simulados.css';

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

export default function SimuladoDetalhePage() {
  const params = useParams<{ simulado: string; nivel: string }>();
  const simulado = Array.isArray(params.simulado) ? params.simulado[0] : params.simulado;
  const nivel = Array.isArray(params.nivel) ? params.nivel[0] : params.nivel;

  const titulo = simulado ? safeDecode(simulado) : 'Simulado';
  const nivelExibido = nivel ? levelLabel(safeDecode(nivel)) : 'Nível';

  return (
    <div className="simulados-page">
      <ChatSidebar />

      <main className="simulados-shell simulados-detail">
        <section className="mx-auto flex max-w-4xl flex-col gap-6 rounded-[28px] border border-white/70 bg-white/75 p-8 shadow-[0_18px_40px_rgba(71,145,223,0.14)] backdrop-blur-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#4d8bd2]">Simulado pré-pronto</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#2f79cb]">{titulo}</h1>
            <p className="mt-2 text-sm leading-6 text-[#5d7fa6]">
              Nível selecionado: <span className="font-semibold text-[#3d89da]">{nivelExibido}</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8ba0bb]">Status</p>
              <p className="mt-2 text-lg font-semibold text-[#3d89da]">Em breve</p>
            </article>
            <article className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8ba0bb]">Estrutura</p>
              <p className="mt-2 text-lg font-semibold text-[#3d89da]">Questões organizadas</p>
            </article>
            <article className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8ba0bb]">Próximo passo</p>
              <p className="mt-2 text-lg font-semibold text-[#3d89da]">Implementar resolução</p>
            </article>
          </div>

          <p className="text-sm leading-7 text-[#5d7fa6]">
            Esta rota já recebe o nome do simulado e o nível na URL. Quando formos ligar o fluxo completo de execução,
            ela pode servir como base para renderizar o conteúdo específico de cada simulado.
          </p>

          <div>
            <Link
              href="/simulados"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#4791df] px-5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Voltar para simulados
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
