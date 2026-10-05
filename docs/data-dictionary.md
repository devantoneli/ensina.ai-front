# Ensina AI - Dicionario de Dados

Fonte principal: schema_oracle_12c.sql (Oracle 12c).
Observacao: schema_atualizado.ts esta vazio no repositorio.

Convencoes
- PK: chave primaria
- FK: chave estrangeira
- NN: not null
- UQ: unico
- BOOL: NUMBER(1) com 0/1
- TIMESTAMP: data/hora

Tabelas

1) alembic_version
- version_num: VARCHAR2(32) (PK, NN)

2) alternative
- id: NUMBER (PK)
- question_id: NUMBER (FK -> question.id, NN)
- description: VARCHAR2(4000) (NN)
- is_correct: NUMBER(1) (BOOL)

3) answer_question
- execution_id: NUMBER (PK, FK -> performed_exam.id, NN)
- question_id: NUMBER (PK, FK -> question.id, NN)
- answer_alternative_id: NUMBER (FK -> alternative.id)
- is_correct: NUMBER(1) (BOOL)

4) chat
- id: NUMBER (PK)
- user_id: NUMBER (FK -> user.id, NN)
- name: VARCHAR2(255) (NN)
- created_at: TIMESTAMP
- last_interaction: TIMESTAMP
- is_active: NUMBER(1) (BOOL)
- mode: VARCHAR2(50) (NN, CHECK: reinforcement|enem|competition|free)

5) chat_content
- id: NUMBER (PK)
- chat_id: NUMBER (FK -> chat.id, NN)
- content_id: NUMBER (FK -> content.id, NN)
- added_at: TIMESTAMP
- detected_by_ai: NUMBER(1) (BOOL)
- confirmed_by_user: NUMBER(1) (BOOL)

6) content
- id: NUMBER (PK)
- discipline_id: NUMBER (FK -> discipline.id, NN)
- name: VARCHAR2(255) (NN)
- description: VARCHAR2(4000)
- is_active: NUMBER(1) (BOOL)
- linked_at: TIMESTAMP
- slug: VARCHAR2(255) (UQ)

7) content_source
- content_id: NUMBER (PK, FK -> content.id, NN)
- source_id: NUMBER (PK, FK -> knowledge_source.id, NN)

8) discipline
- id: NUMBER (PK)
- name: VARCHAR2(255) (NN)
- description: VARCHAR2(4000)

9) exam
- id: NUMBER (PK)
- name: VARCHAR2(255) (NN)
- description: VARCHAR2(4000)
- created_at: TIMESTAMP
- creator_name: VARCHAR2(255) (NN)
- difficulty: VARCHAR2(50) (NN, CHECK: easy|medium|hard|very_hard)
- time_setting: NUMBER

10) knowledge_source
- id: NUMBER (PK)
- source_type: VARCHAR2(50) (NN, CHECK: archive|video|url|article)
- name: VARCHAR2(255) (NN)
- archive_url: VARCHAR2(255)
- description: VARCHAR2(4000)
- is_validated: NUMBER(1) (BOOL)
- created_at: TIMESTAMP
- knowledge_source_date: TIMESTAMP
- admin_validator_id: NUMBER (FK -> user.id)

11) learning_trace
- id: NUMBER (PK)
- profile_id: NUMBER (FK -> student_profile.id, NN)
- content_id: NUMBER (FK -> content.id, NN)
- interactions_count: NUMBER
- correct_answers_count: NUMBER
- wrong_answers_count: NUMBER
- last_interaction: TIMESTAMP
- mastery_percentage: FLOAT

12) message
- id: NUMBER (PK)
- chat_id: NUMBER (FK -> chat.id, NN)
- sender: VARCHAR2(50) (NN, CHECK: ia|user)
- content: VARCHAR2(4000) (NN)
- sent_at: TIMESTAMP
- prompt_tokens: NUMBER
- response_tokens: NUMBER
- total_tokens: NUMBER

13) performed_exam
- id: NUMBER (PK)
- exam_id: NUMBER (FK -> exam.id, NN)
- user_id: NUMBER (FK -> user.id, NN)
- started_at: TIMESTAMP
- concluded_at: TIMESTAMP
- status: VARCHAR2(50) (CHECK: in_progress|concluded|paused)
- score: NUMBER
- score_percentage: FLOAT
- performed_time: NUMBER

14) question
- id: NUMBER (PK)
- content_id: NUMBER (FK -> content.id, NN)
- description: VARCHAR2(4000) (NN)
- difficulty: VARCHAR2(50) (NN, CHECK: easy|medium|hard|very_hard)
- creator_name: VARCHAR2(255) (NN)

15) question_exam
- exam_id: NUMBER (PK, FK -> exam.id, NN)
- question_id: NUMBER (PK, FK -> question.id, NN)
- disposal_order: NUMBER (NN)

16) student_interactions
- id: NUMBER (PK)
- created_at: TIMESTAMP (NN)
- user_id: NUMBER (FK -> user.id, NN)
- chat_id: NUMBER (FK -> chat.id, NN)
- content_id: NUMBER (FK -> content.id)
- interaction_type: VARCHAR2(255) (NN)
- is_correct: NUMBER(1) (BOOL)
- topic: VARCHAR2(255)
- difficulty: VARCHAR2(50)
- notes: VARCHAR2(4000)

17) student_profile
- id: NUMBER (PK)
- user_id: NUMBER (FK -> user.id, NN, UQ)
- education_level: VARCHAR2(50) (NN, CHECK: none|elementary|high_school|graduated)
- focus_area: VARCHAR2(50) (NN, CHECK: reinforcement|enem|competition|free)
- methodology: VARCHAR2(255)
- updated_at: TIMESTAMP

18) study_sessions
- id: NUMBER (PK)
- user_id: NUMBER (FK -> user.id, NN)
- chat_id: NUMBER (FK -> chat.id, NN)
- started_at: TIMESTAMP (NN)
- ended_at: TIMESTAMP
- messages_count: NUMBER (NN)
- topics_covered: VARCHAR2(4000) (NN)

19) user
- id: NUMBER (PK)
- email: VARCHAR2(255) (NN, UQ)
- password: VARCHAR2(255) (NN)
- role: VARCHAR2(50) (CHECK: student|admin)
- name: VARCHAR2(255)
- created_at: TIMESTAMP
- is_active: NUMBER(1) (BOOL)

Relacionamentos principais (resumo)
- user 1:N chat
- chat 1:N message
- discipline 1:N content
- content N:N knowledge_source (content_source)
- exam N:N question (question_exam)
- user 1:N performed_exam
- performed_exam N:N question (answer_question)
- user 1:1 student_profile
- student_profile 1:N learning_trace
- user 1:N study_sessions
- chat 1:N study_sessions
