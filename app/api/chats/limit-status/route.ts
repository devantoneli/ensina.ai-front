import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl() {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
}

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token não informado.' }, { status: 401 });
  }

  try {
    const res = await fetch(`${getBackendUrl()}/chats/limit-status`, {
      headers: { Authorization: authorization },
      cache: 'no-store',
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Não foi possível conectar ao backend.' }, { status: 502 });
  }
}
