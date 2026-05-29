import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl() {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subject_id: string }> },
) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Token não informado.' }, { status: 401 });
  }

  const { subject_id } = await params;
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  try {
    const res = await fetch(
      `${getBackendUrl()}/contents/discipline/${subject_id}${qs ? `?${qs}` : ''}`,
      {
        headers: { Authorization: authorization },
        cache: 'no-store',
      },
    );
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    // Normalize: if backend returns plain array, wrap it
    const raw = Array.isArray(data) ? { items: data, total: data.length } : data;
    // Normalize content items: map 'name' → 'title' if title is missing
    if (Array.isArray(raw.items)) {
      raw.items = raw.items.map((item: Record<string, unknown>) => ({
        ...item,
        title: item.title ?? item.name ?? '',
      }));
    }
    return NextResponse.json(raw, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Não foi possível conectar ao backend.' }, { status: 502 });
  }
}
