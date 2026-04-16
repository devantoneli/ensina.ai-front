import { NextRequest, NextResponse } from 'next/server';

type DeleteRequestBody = {
  chat_id?: string;
};

async function parseBackendResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || 'Resposta invalida do backend.' };
  }
}

export async function DELETE(req: NextRequest) {
  const backendBaseUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:8000';

  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token de autenticacao nao informado.' }, { status: 401 });
  }

  let body: DeleteRequestBody = {};
  if (req.headers.get('content-length') !== '0') {
    try {
      body = (await req.json()) as DeleteRequestBody;
    } catch {
      body = {};
    }
  }

  const chatId = (req.nextUrl.searchParams.get('chat_id') ?? body.chat_id ?? '').trim();

  if (!chatId) {
    return NextResponse.json({ message: 'chat_id obrigatorio.' }, { status: 400 });
  }

  const endpoint = `${backendBaseUrl}/chat?chat_id=${encodeURIComponent(chatId)}`;

  try {
    const backendResponse = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await parseBackendResponse(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: `Nao foi possivel conectar ao backend em ${backendBaseUrl}.` },
      { status: 502 },
    );
  }
}
