import { NextRequest, NextResponse } from 'next/server';

type Attempt = {
  method: 'POST' | 'PUT' | 'PATCH';
  path: string;
  fieldName: 'avatar' | 'file' | 'image';
};

const ATTEMPTS: Attempt[] = [
  { method: 'POST', path: '/users/me/avatar', fieldName: 'avatar' },
  { method: 'PUT', path: '/users/me/avatar', fieldName: 'avatar' },
  { method: 'POST', path: '/users/avatar', fieldName: 'avatar' },
  { method: 'PUT', path: '/users/avatar', fieldName: 'avatar' },
  { method: 'POST', path: '/users/upload-avatar', fieldName: 'avatar' },
  { method: 'POST', path: '/users/me/upload-avatar', fieldName: 'avatar' },
  { method: 'PATCH', path: '/users/me', fieldName: 'avatar' },
  { method: 'PUT', path: '/users/me', fieldName: 'avatar' },
  { method: 'POST', path: '/users/me/avatar', fieldName: 'file' },
  { method: 'PUT', path: '/users/me/avatar', fieldName: 'file' },
  { method: 'POST', path: '/users/avatar', fieldName: 'file' },
  { method: 'POST', path: '/users/me/avatar', fieldName: 'image' },
  { method: 'PUT', path: '/users/me/avatar', fieldName: 'image' },
];

async function parseBackendResponse(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || 'Resposta inválida do backend.' };
  }
}

function shouldTryNext(status: number): boolean {
  return status === 400 || status === 404 || status === 405 || status === 415 || status === 422 || status >= 500;
}

function buildAvatarPayload(file: File, fieldName: Attempt['fieldName']): FormData {
  const formData = new FormData();
  formData.append(fieldName, file);
  return formData;
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ message: 'Payload inválido para upload.' }, { status: 400 });
  }

  const avatar = formData.get('avatar');
  if (!(avatar instanceof File)) {
    return NextResponse.json({ message: 'Arquivo de avatar é obrigatório.' }, { status: 400 });
  }

  let lastStatus = 502;
  let lastData: unknown = { message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` };
  let hadNotFound = false;

  for (const attempt of ATTEMPTS) {
    try {
      const response = await fetch(`${backendBaseUrl}${attempt.path}`, {
        method: attempt.method,
        headers: {
          Authorization: authorization,
          Accept: 'application/json',
        },
        body: buildAvatarPayload(avatar, attempt.fieldName),
        cache: 'no-store',
      });

      const data = await parseBackendResponse(response);

      if (response.ok) {
        return NextResponse.json(data, { status: response.status });
      }

      if (response.status === 404) {
        hadNotFound = true;
      }

      lastStatus = response.status;
      lastData = data;

      if (!shouldTryNext(response.status)) {
        return NextResponse.json(data, { status: response.status });
      }
    } catch {
      lastStatus = 502;
      lastData = { message: `Não foi possível conectar ao backend em ${backendBaseUrl}.` };
    }
  }

  if (hadNotFound) {
    return NextResponse.json(
      {
        message:
          'Seu backend não possui endpoint de upload de avatar. No OpenAPI atual existe apenas PUT /users/me com JSON (name, email, password).',
      },
      { status: 400 },
    );
  }

  return NextResponse.json(lastData, { status: lastStatus });
}
