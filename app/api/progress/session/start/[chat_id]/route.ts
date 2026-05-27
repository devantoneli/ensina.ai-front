import { NextRequest, NextResponse } from 'next/server';

async function parseBackendResponse(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || 'Resposta inválida do backend.' };
  }
}

function getBackendUrl() {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chat_id: string }> },
) {
  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token não informado.' }, { status: 401 });
  }

  const { chat_id } = await params;

  try {
    const res = await fetch(`${getBackendUrl()}/progress/session/start/${chat_id}`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await parseBackendResponse(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: `Não foi possível conectar ao backend em ${getBackendUrl()}.` },
      { status: 502 },
    );
  }
}
