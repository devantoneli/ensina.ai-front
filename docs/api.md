# Ensina Aí — API Backend

## Comunicação

O frontend se comunica com o backend utilizando **API REST**.

Formato de dados:

JSON

Métodos HTTP utilizados:

GET → consulta
POST → criação
PUT → atualização
DELETE → remoção

---

## Autenticação

O sistema utiliza:

JWT (JSON Web Token)

Fluxo:

1. usuário faz login
2. backend retorna token JWT
3. frontend envia token em requisições protegidas

Header utilizado:

Authorization: Bearer TOKEN

---

## Endpoints Principais

### Autenticação

POST /auth/register

Cria uma nova conta de usuário.

Campos esperados:

* name
* email
* password

---

POST /auth/login

Realiza login do usuário.

Campos esperados:

* email
* password

Retorna:

* access_token
* user_data

---

### Usuário

GET /users/me

Retorna informações do usuário autenticado.

---

PUT /users/me

Atualiza dados do usuário.

---

DELETE /users/me

Permite que o estudante exclua sua própria conta.

---

### Chat

POST /chat

Envia mensagem para o agente de IA.

Campos:

* chat_id
* message

Retorno:

* resposta gerada pela IA

---

GET /chat/history

Retorna histórico de conversas do usuário.

---

DELETE /chat

Remove uma conversa do histórico.

---

### Simulados

GET /simulations

Lista simulados disponíveis.

---

POST /simulations/start

Inicia um simulado.

---

POST /simulations/answer

Envia resposta de uma questão.

---

GET /simulations/result

Retorna resultado do simulado.

---

## Resposta padrão da API

Formato:

{
"success": true,
"data": {},
"message": ""
}
