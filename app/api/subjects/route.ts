import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl() {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
}

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token não informado.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  try {
    const res = await fetch(`${getBackendUrl()}/disciplines/${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: authorization },
      cache: 'no-store',
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    // Normalize: if backend returns plain array, wrap it
    const normalized = Array.isArray(data) ? { items: data, total: data.length } : data;
    return NextResponse.json(normalized, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Não foi possível conectar ao backend.' }, { status: 502 });
  }
}
