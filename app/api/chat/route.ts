import { NextRequest, NextResponse } from 'next/server';

type ChatRequestBody = {
  messages?: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>;
  mode?: string;
};

async function parseBackendResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || 'Resposta inválida do backend.' };
  }
}

export async function POST(req: NextRequest) {
  const backendBaseUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:8000';

  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token de autenticação não informado.' }, { status: 401 });
  }

  let body: ChatRequestBody = {};
  if (req.headers.get('content-length') !== '0') {
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      body = {};
    }
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ message: 'messages é obrigatório.' }, { status: 400 });
  }

  const endpoint = `${backendBaseUrl}/free-mode`;

  try {
    const backendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: body.messages, mode: body.mode }),
      cache: 'no-store',
    });

    const data = await parseBackendResponse(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` },
      { status: 502 },
    );
  }
}