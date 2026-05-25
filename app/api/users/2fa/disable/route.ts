import { NextRequest, NextResponse } from 'next/server';

async function parseResponse(response: Response) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Payload inválido.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendBaseUrl}/users/me/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await parseResponse(response);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` },
      { status: 502 },
    );
  }
}
