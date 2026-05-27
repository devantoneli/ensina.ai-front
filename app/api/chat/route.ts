import { NextRequest, NextResponse } from 'next/server';

type ChatRequestBody = {
  messages?: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>;
  mode?: 'responde' | 'ensino' | string;
  content_id?: number | null;
  chat_id?: number | null;
  exam_id?: number | null;
  question_id?: number | null;
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

  const endpoint = `${backendBaseUrl}/chat-tutor/`;

  const requestBody = {
    messages: body.messages,
    mode: body.mode,
    content_id: body.content_id,
    chat_id: body.chat_id,
    exam_id: body.exam_id,
    question_id: body.question_id,
  };
  console.log('[chat/route] payload →', JSON.stringify(requestBody));

  try {
    const backendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    });
    console.log('[chat/route] backend status →', backendResponse.status, backendResponse.headers.get('content-type'));

    const contentType = backendResponse.headers.get('content-type') ?? '';

    if (contentType.includes('text/event-stream') && backendResponse.body) {
      return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await parseBackendResponse(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` },
      { status: 502 },
    );
  }
}