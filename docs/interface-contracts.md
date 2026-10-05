# Ensina AI - Contratos de Interface (Frontend <-> Backend)

Base URL (dev): http://127.0.0.1:8000
- Pode ser sobrescrito por API_URL ou NEXT_PUBLIC_API_URL
- O frontend usa rotas proxy em /api/* (Next.js) que encaminham para o backend

Autenticacao
- Header: Authorization: Bearer <token>
- Formato padrao: JSON (exceto login que usa form-url-encoded)

Observacoes gerais
- Algumas respostas chegam como array direto ou { data: [...] }.
- O frontend normaliza respostas quando necessario (ver services/*.ts).

=======================
1) Autenticacao
=======================

POST /auth/login
- Content-Type: application/x-www-form-urlencoded
- Body: username=<email> & password=<senha>
- Response (exemplos):
  - { access_token, user_data }
  - { token, user_data }
  - { requires_2fa: true, temp_token }

POST /auth/register
- Content-Type: application/json
- Body: { name, email, phone?, password }
- Response: objeto do backend (pode retornar id, access_token ou user_data)

POST /auth/2fa/login
- Content-Type: application/json
- Body: { temp_token, code }
- Response: { access_token }

POST /auth/logout
- Sem body
- Response: { ok: true }

=======================
2) Usuario e Perfil
=======================

GET /users/me
- Response: { id, name, email, phone?, role, two_factor_enabled?, created_at?, updated_at? }

PUT /users/me
- Body (JSON): { name?, phone?, email?, password? }
- Response: usuario atualizado

POST /users/me/change-password
- Body (JSON): { current_password, new_password }

Upload de avatar (backend pode variar)
- Recomendado: POST /users/me/avatar
- Content-Type: multipart/form-data
- Field: avatar (file)
- Fallbacks usados pelo frontend: /users/avatar, /users/me/avatar (POST/PUT), /users/upload-avatar, /users/me/upload-avatar, /users/me (PUT/PATCH com avatar)

=======================
3) 2FA
=======================

POST /users/me/2fa/setup
- Body: { method: "email" | "phone" }
- Response: { method, contact, message }

POST /users/me/2fa/verify
- Body: { code }
- Response: 204 (sem body) ou JSON

POST /users/me/2fa/send-code
- Response: 204 (sem body) ou JSON

POST /users/me/2fa/disable
- Body: { code }
- Response: 204 (sem body) ou JSON

=======================
4) Chat e IA
=======================

POST /chats
- Body: { name, mode: "REFORCO"|"ENEM"|"CONCURSO"|"LIVRE" }
- Response: { id, name, mode, created_at, last_interaction, is_active, last_message }

GET /chats/{chat_id}
- Response: { id, name, mode, created_at, last_interaction, messages: [...] }

GET /chat/history
- Response: lista de chats do usuario

DELETE /chat?chat_id=<id>
- Response: 204 ou JSON

POST /chat-tutor/
- Content-Type: application/json
- Body:
  {
    messages: [{ role: "user"|"assistant", content }],
    mode?: "responde" | "ensino",
    chat_id?: number,
    content_id?: number,
    exam_id?: number,
    question_id?: number
  }
- Response (streaming SSE):
  - data: <token>
  - data: [DONE]
  - eventos meta podem conter: { type: "meta", sources, sources_consulted, grounded, mode, intent, scope }

POST /free-mode/
- Body: { messages, mode }
- Response: ChatResponse (ver types/chat.ts)

GET /chats/limit-status
- Response: payload do backend (limites/estado do usuario)

=======================
5) Progresso
=======================

GET /progress/dashboard
- Response: { study_time, accuracy, studied_contents, weak_topics }

POST /progress/session/start/{chat_id}
- Response: { session_id, messages_count }

POST /progress/session/end/{chat_id}
- Response: { message? }

POST /progress/interaction/content/{content_id}
- Body: { chat_id, topic }

POST /progress/interaction/question
- Body: { chat_id, question, answer, topic, content_id? }
- Response: { is_correct, difficulty, notes }

=======================
6) Disciplinas e Conteudos
=======================

GET /disciplines/
POST /disciplines/
PUT /disciplines/{id}
DELETE /disciplines/{id}

GET /contents/
POST /contents/
PUT /contents/{id}
DELETE /contents/{id}?force=true|false

GET /contents/discipline/{discipline_id}

GET /contents/{content_id}/sources
POST /contents/{content_id}/sources/{source_id}
DELETE /contents/{content_id}/sources/{source_id}

=======================
7) Fontes de Conhecimento
=======================

GET /knowledge-sources/
POST /knowledge-sources/
PUT /knowledge-sources/{id}
DELETE /knowledge-sources/{id}

POST /knowledge-sources/upload
- Content-Type: multipart/form-data
- Fields: file, name, description?, is_validated?

=======================
8) Questoes
=======================

GET /questions
GET /questions/{id}
POST /questions/
PUT /questions/{id}
DELETE /questions/{id}

Payload (criar/editar)
- { content_id, description, difficulty, creator_name?, alternatives: [{ description, is_correct }], exam_ids? }

=======================
9) Simulados (exams)
=======================

GET /exams
GET /exams/{id}
POST /exams
PUT /exams/{id}
DELETE /exams/{id}

GET /exams/{id}/questions?difficulty=<easy|medium|hard|very_hard>

Campos usados pelo frontend (normalizados)
- id, titulo/name, descricao/description, nivel/difficulty, questoes/question_count,
  tempoEstimado/time_setting, materia/category
