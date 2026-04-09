import { NextResponse } from 'next/server';

export async function POST() {
  const backendBaseUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:8000';

  try {
    const response = await fetch(`${backendBaseUrl}/auth/logout`, {
      method: 'POST',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Falha ao finalizar sessão.' }, { status: response.status });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Backend indisponível no logout.' }, { status: 502 });
  }
}
