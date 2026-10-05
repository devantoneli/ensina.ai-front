# Ensina AI — Arquitetura do Sistema

## Visão Geral

O sistema Ensina AI segue uma **arquitetura em camadas**, separando responsabilidades para facilitar manutenção, escalabilidade e organização do código.

Camadas principais:

* Frontend
* Backend (API)
* Camada de Inteligência Artificial
* Banco de Dados

---

## Frontend

Responsável pela interface com o usuário.

Tecnologias:

* Next.js
* TypeScript
* Tailwind CSS
* Axios
* Vercel (deploy)

Funções do frontend:

* interface do chat
* interface de simulados
* autenticação de usuários
* visualização de métricas de desempenho
* comunicação com a API backend

---

## Backend

Responsável pelas regras de negócio e processamento das requisições.

Tecnologias:

* Python
* FastAPI
* Pydantic
* SQLAlchemy
* Uvicorn

Responsabilidades:

* autenticação
* gerenciamento de usuários
* controle de chats
* gerenciamento de simulados
* integração com IA
* acesso ao banco de dados

---

## Banco de Dados

O sistema utiliza banco de dados relacional.

Tecnologias:

* PostgreSQL
* Supabase

Informações armazenadas:

* usuários
* chats
* mensagens
* simulados
* conteúdos educacionais
* fontes de conhecimento

---

## Camada de Inteligência Artificial

Responsável pela geração das respostas educacionais.

Tecnologias:

* Ollama
* Llama 3 (modelo open source)

A IA é executada **localmente**, garantindo:

* redução de custos
* independência de APIs pagas
* maior controle sobre comportamento do agente

---

## Arquitetura de Comunicação

Fluxo de comunicação:

Frontend → API Backend → Camada de IA → Banco de Dados

1. Usuário envia pergunta no chat
2. Frontend envia requisição para API
3. Backend processa contexto do usuário
4. Backend consulta IA
5. IA gera resposta educacional
6. Backend salva histórico
7. Frontend exibe resposta

---

## Estrutura Recomendada do Frontend

src/

components/
chat/
ui/
layout/

pages/ ou app/

services/
api.ts
authService.ts
chatService.ts

hooks/

types/

utils/

---

## Deploy

Frontend:

* Vercel

Banco de dados:

* Supabase

Backend:

* ambiente cloud ou servidor dedicado
