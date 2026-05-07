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

  try {
    const backendResponse = await fetch(`${backendBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
      cache: 'no-store',
    });

    const data = await parseResponse(backendResponse);
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` }, { status: 502 });
  }
}
