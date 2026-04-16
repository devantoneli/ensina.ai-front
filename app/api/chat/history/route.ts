import { NextRequest, NextResponse } from 'next/server';

async function parseBackendResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || 'Resposta invalida do backend.' };
  }
}

export async function GET(req: NextRequest) {
  const backendBaseUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:8000';

  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token de autenticacao nao informado.' }, { status: 401 });
  }

  const endpoint = `${backendBaseUrl}/chat/history`;

  try {
    const backendResponse = await fetch(endpoint, {
      method: 'GET',
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
