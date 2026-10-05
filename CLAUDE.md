# Ensina AI: contexto do sistema

## O que é

Sistema web de apoio ao estudo de Língua Portuguesa para o ENEM (TCC de ADS, Fatec Praia Grande, 2026).
O chat com IA deve orientar o estudante por perguntas e dicas progressivas antes de dar a resposta.
Uma primeira versão foi implementada e precisa de refatoração.

## Stack

- Front-end: Next.js, TypeScript, Tailwind CSS, Axios, deploy na Vercel.
- Back-end: Python, FastAPI, Pydantic, Uvicorn, SQLAlchemy, Alembic.
- Banco de dados: PostgreSQL no Supabase.
- Autenticação: JWT e FastAPI Security, perfis `student` e `admin`.
- Arquitetura em camadas: front-end, API, camada de serviços, camada de IA, banco de dados.

## Correções da orientadora que afetam o sistema

### 1. Banco de dados: PostgreSQL, não Oracle

A orientadora apontou como problema grave que o projeto declara PostgreSQL, mas o modelo físico usa tipos do Oracle (VARCHAR2, NUMBER).

- Conferir se os modelos SQLAlchemy e as migrações Alembic usam tipos do PostgreSQL: VARCHAR/TEXT, INTEGER/BIGINT, NUMERIC, BOOLEAN (no lugar de NUMBER(1)), TIMESTAMP.
- Gerar o diagrama do modelo físico a partir do esquema real do banco, com esses tipos.

### 2. Definir o que está implementado

A orientadora exige que fique claro o que já foi implementado, o que está em desenvolvimento e o que é funcionalidade futura. O relatório misturava "foi realizado" com "o sistema implementará".

- Levantar no código a situação real de cada requisito funcional abaixo e classificar como: implementado, em refatoração ou previsto.
- Não marcar como implementado o que não roda de ponta a ponta.

Requisitos funcionais:
- RF01 Cadastro e autenticação, com perfis de estudante e administrador.
- RF02 Chat em tempo real com agente de IA.
- RF03 Dicas e perguntas progressivas antes da resposta conclusiva.
- RF04 Adaptação das respostas ao perfil e ao nível do estudante.
- RF05 Histórico de conversas.
- RF06 Recomendação de materiais (dicas, videoaulas, sites, guias).
- RF07 Simulados com questões de exames anteriores, registro das respostas e cálculo do desempenho.
- RF08 Acompanhamento do desempenho por conteúdo (erros, acertos, pontos de maior dificuldade).
- RF09 Cadastro e validação de fontes por administradores.

### 3. Requisitos não funcionais precisam ser verificáveis

A orientadora rejeitou requisitos genéricos ("o sistema deve ser rápido") e pediu critérios mensuráveis.

- RNF01 Desempenho: páginas carregam em até X segundos, sem contar o tempo da API externa de IA. Medir e propor o valor de X.
- RNF02 Segurança: senhas nunca em texto puro; armazenar como hash. Rotas restritas exigem token JWT.
- RNF03 Responsividade: telas principais utilizáveis em computador e celular.

### 4. Diferença em relação ao ChatGPT/Gemini

A orientadora pediu que fique claro em que o Ensina AI difere de simplesmente usar um assistente genérico. O sistema precisa de fato fazer o que o relatório afirma:

- O agente não entrega a resposta de imediato; conduz por dicas progressivas (instruções de sistema do prompt).
- As explicações se apoiam em fontes cadastradas e validadas, para reduzir informações inconsistentes. Não prometer que elimina erros.
- As interações e os simulados alimentam indicadores de desempenho por conteúdo.

### 5. Proteção de dados

A orientadora pediu a viabilidade legal: tratamento de dados dos estudantes, autenticação, históricos de interação e possível coleta de dados de menores.

- Coletar só os dados necessários.
- Informar ao usuário quais dados são coletados e para quê (termo de uso e política de privacidade).
- Considerar que há usuários adolescentes.
- As mensagens do chat vão para uma API externa de IA: não enviar dados pessoais desnecessários.

### 6. Custos

O relatório assume equipe acadêmica com recursos limitados: priorizar serviços gratuitos ou de baixo custo para IA e hospedagem, e controlar o consumo de tokens.

### 7. Material que o relatório precisa e que sai do sistema

A orientadora cobrou capítulos que estavam vazios. Para preenchê-los, o sistema precisa fornecer:

- Projeto técnico: arquitetura completa e integração entre camadas (diagrama, lista de rotas da API, ambiente de implantação).
- Avaliação e testes: demonstrar requisitos atendidos e testes realizados.
- Telas finais: o sistema funcionando, não só protótipos.
- Processos: fluxos principais (estudo pelo chat, simulado, cadastro de fontes).

### 8. Padronização de nomes

- Nome do produto: "Ensina AI" em todas as telas e textos (não "Ensina Aí").
- Termos na interface e na documentação: front-end, back-end, usuário, banco de dados.

## Observações da revisão (não são da orientadora)

- O modelo conceitual não tem as entidades LEARNING_TRACE, STUDENT_INTERACTIONS, STUDY_SESSIONS e CHAT_CONTENT, que aparecem nos modelos lógico e físico. Os três modelos devem bater com o esquema real.
- Só chamar de RAG se o sistema buscar trechos das fontes conforme a pergunta. Enviar sempre as mesmas fontes fixas não é RAG.

## Como trabalhar

- Antes de refatorar, mapear o que existe e confirmar o plano com os autores.
- Não inventar funcionalidades nem resultados de teste para o relatório.
- Alterações de esquema sempre por migração Alembic.