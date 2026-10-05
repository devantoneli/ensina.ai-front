# Copilot Instructions — Projeto Ensina AI

## Contexto do Projeto

Este repositório é o **FRONTEND** do projeto **Ensina AI**, um agente de Inteligência Artificial educacional desenvolvido como Trabalho de Conclusão de Curso (TCC).

**IMPORTANTE:** O backend está em um **repositório separado**. Este repositório contém **apenas o frontend**.

O objetivo do sistema é criar um **assistente educacional baseado em IA** que auxilie estudantes no processo de aprendizado.

Diferente de assistentes tradicionais, o sistema não deve fornecer respostas diretamente.
Ele deve estimular o estudante a pensar, utilizando explicações progressivas e perguntas.

A IA segue uma estratégia pedagógica baseada em **método socrático**, conduzindo o estudante até a solução.

---

# Tecnologias Utilizadas

## Frontend (este repositório):

* Next.js
* TypeScript
* Tailwind CSS
* Axios

## Backend (repositório separado - apenas para integração):

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL (Supabase)
* Ollama + Llama 3 (IA)

**Nota:** Não desenvolvemos o backend neste repositório. As informações sobre o backend servem apenas para entender como nos conectar à API.

---

# Objetivo do Frontend

O frontend é responsável por:

* interface do chat com IA
* interface de simulados
* autenticação de usuários
* visualização de histórico de chats
* visualização de desempenho em simulados
* comunicação com a API backend

---

# Estrutura Esperada do Projeto

Sempre gerar código respeitando a seguinte organização:

src/

components/
chat/
ui/
layout/

services/

hooks/

types/

utils/

pages/ ou app/

---

# Padrões de Código

## TypeScript

Sempre utilizar tipagem forte.

Exemplo:

interface Message {
id: string
content: string
sender: "user" | "ai"
createdAt: string
}

---

## Services

Todas as chamadas de API devem ficar na pasta:

services/

Exemplo:

authService.ts
chatService.ts

Não fazer chamadas HTTP diretamente nos componentes.

---

## API Client

Utilizar **Axios** para comunicação com a API.

Criar um cliente base:

services/api.ts

Com configuração de:

* baseURL
* interceptors
* autenticação JWT

---

## Componentes

Os componentes devem ser:

* pequenos
* reutilizáveis
* organizados por responsabilidade

Exemplo:

components/chat

ChatWindow.tsx
ChatMessage.tsx
ChatInput.tsx

---

# Padrões de Interface

Utilizar **Tailwind CSS**.

Boas práticas:

* componentes limpos
* responsividade
* design simples
* boa experiência para chat

---

# Chat do Sistema

O chat é a principal funcionalidade do sistema.

Ele deve permitir:

* envio de mensagens
* resposta da IA
* histórico de conversas
* atualização em tempo real

Cada mensagem possui:

* autor (user ou ai)
* conteúdo
* data
* tokens utilizados

---

# Comportamento Esperado da IA

A IA não deve entregar respostas prontas imediatamente.

Ela deve:

1. verificar o nível de conhecimento do estudante
2. explicar conceitos necessários
3. fazer perguntas
4. incentivar raciocínio
5. corrigir erros do usuário

Esse comportamento é parte fundamental do projeto educacional.

---

# Integração com Backend

O frontend se comunica com a **API REST do backend** (repositório separado).

**Apenas consumimos a API**, não desenvolvemos o backend neste repositório.

Endpoints principais:

POST /auth/login
POST /auth/register
GET /users/me

POST /chat
GET /chat/history

Autenticação: **JWT** via header `Authorization: Bearer TOKEN`

---

# Boas Práticas

Ao gerar código:

* manter organização modular
* separar lógica de UI
* usar TypeScript corretamente
* evitar código duplicado
* seguir arquitetura do projeto

Sempre assumir que este projeto é um **sistema educacional baseado em IA**.
