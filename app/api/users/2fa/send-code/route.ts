import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const backendBaseUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:8000';

  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token de autenticação não informado.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${backendBaseUrl}/users/me/2fa/send-code`, {
      method: 'POST',
      headers: { Authorization: authorization },
      cache: 'no-store',
    });

    if (response.status === 204) return new NextResponse(null, { status: 204 });

    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` },
      { status: 502 },
    );
  }
}
