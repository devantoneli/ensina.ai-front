import { NextRequest, NextResponse } from 'next/server';

type LoginBody = { email?: string; password?: string };

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

  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ message: 'Payload inválido.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ message: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  const attempts: Array<{ headers: HeadersInit; body: BodyInit }> = [
    {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
    {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    },
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    },
  ];

  let lastStatus = 502;
  let lastData: unknown = { message: 'Falha ao autenticar.' };

  for (const attempt of attempts) {
    try {
      const backendResponse = await fetch(`${backendBaseUrl}/auth/login`, {
        method: 'POST',
        headers: attempt.headers,
        body: attempt.body,
        cache: 'no-store',
      });

      const data = await parseResponse(backendResponse);

      if (backendResponse.ok) {
        return NextResponse.json(data, { status: backendResponse.status });
      }

      lastStatus = backendResponse.status;
      lastData = data;

      if (backendResponse.status !== 422) {
        return NextResponse.json(data, { status: backendResponse.status });
      }
    } catch {
      lastStatus = 502;
      lastData = { message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` };
    }
  }

  return NextResponse.json(lastData, { status: lastStatus });
}
