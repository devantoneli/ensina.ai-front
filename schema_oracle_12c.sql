CREATE TABLE "alembic_version" (
    version_num VARCHAR2(32) NOT NULL PRIMARY KEY
);

CREATE TABLE "alternative" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    question_id NUMBER NOT NULL,
    description VARCHAR2(4000) NOT NULL,
    is_correct NUMBER(1)
);

CREATE TABLE "answer_question" (
    execution_id NUMBER NOT NULL,
    question_id NUMBER NOT NULL,
    answer_alternative_id NUMBER,
    is_correct NUMBER(1),
    PRIMARY KEY (execution_id, question_id)
);

CREATE TABLE "chat" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL,
    name VARCHAR2(255) NOT NULL,
    created_at TIMESTAMP,
    last_interaction TIMESTAMP,
    is_active NUMBER(1),
    mode VARCHAR2(50) NOT NULL CHECK (mode IN ('reinforcement', 'enem', 'competition', 'free'))
);

CREATE TABLE "chat_content" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    chat_id NUMBER NOT NULL,
    content_id NUMBER NOT NULL,
    added_at TIMESTAMP,
    detected_by_ai NUMBER(1),
    confirmed_by_user NUMBER(1)
);

CREATE TABLE "content" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    discipline_id NUMBER NOT NULL,
    name VARCHAR2(255) NOT NULL,
    description VARCHAR2(4000),
    is_active NUMBER(1),
    linked_at TIMESTAMP,
    slug VARCHAR2(255) UNIQUE
);

CREATE TABLE "content_source" (
    content_id NUMBER NOT NULL,
    source_id NUMBER NOT NULL,
    PRIMARY KEY (content_id, source_id)
);

CREATE TABLE "discipline" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    description VARCHAR2(4000)
);

CREATE TABLE "exam" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    description VARCHAR2(4000),
    created_at TIMESTAMP,
    creator_name VARCHAR2(255) NOT NULL,
    difficulty VARCHAR2(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    time_setting NUMBER
);

CREATE TABLE "knowledge_source" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    source_type VARCHAR2(50) NOT NULL CHECK (source_type IN ('archive', 'video', 'url', 'article')),
    name VARCHAR2(255) NOT NULL,
    archive_url VARCHAR2(255),
    description VARCHAR2(4000),
    is_validated NUMBER(1),
    created_at TIMESTAMP,
    knowledge_source_date TIMESTAMP,
    admin_validator_id NUMBER
);

CREATE TABLE "learning_trace" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    profile_id NUMBER NOT NULL,
    content_id NUMBER NOT NULL,
    interactions_count NUMBER,
    correct_answers_count NUMBER,
    wrong_answers_count NUMBER,
    last_interaction TIMESTAMP,
    mastery_percentage FLOAT
);

CREATE TABLE "message" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    chat_id NUMBER NOT NULL,
    sender VARCHAR2(50) NOT NULL CHECK (sender IN ('ia', 'user')),
    content VARCHAR2(4000) NOT NULL,
    sent_at TIMESTAMP,
    prompt_tokens NUMBER,
    response_tokens NUMBER,
    total_tokens NUMBER
);

CREATE TABLE "performed_exam" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    exam_id NUMBER NOT NULL,
    user_id NUMBER NOT NULL,
    started_at TIMESTAMP,
    concluded_at TIMESTAMP,
    status VARCHAR2(50) CHECK (status IN ('in_progress', 'concluded', 'paused')),
    score NUMBER,
    score_percentage FLOAT,
    performed_time NUMBER
);

CREATE TABLE "question" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    content_id NUMBER NOT NULL,
    description VARCHAR2(4000) NOT NULL,
    difficulty VARCHAR2(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    creator_name VARCHAR2(255) NOT NULL
);

CREATE TABLE "question_exam" (
    exam_id NUMBER NOT NULL,
    question_id NUMBER NOT NULL,
    disposal_order NUMBER NOT NULL,
    PRIMARY KEY (exam_id, question_id)
);

CREATE TABLE "student_interactions" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    user_id NUMBER NOT NULL,
    chat_id NUMBER NOT NULL,
    content_id NUMBER,
    interaction_type VARCHAR2(255) NOT NULL,
    is_correct NUMBER(1),
    topic VARCHAR2(255),
    difficulty VARCHAR2(50),
    notes VARCHAR2(4000)
);

CREATE TABLE "student_profile" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL UNIQUE,
    education_level VARCHAR2(50) NOT NULL CHECK (education_level IN ('none', 'elementary', 'high_school', 'graduated')),
    focus_area VARCHAR2(50) NOT NULL CHECK (focus_area IN ('reinforcement', 'enem', 'competition', 'free')),
    methodology VARCHAR2(255),
    updated_at TIMESTAMP
);

CREATE TABLE "study_sessions" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL,
    chat_id NUMBER NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    messages_count NUMBER NOT NULL,
    topics_covered VARCHAR2(4000) NOT NULL
);

CREATE TABLE "user" (
    id NUMBER GENERATED AS IDENTITY PRIMARY KEY,
    email VARCHAR2(255) NOT NULL UNIQUE,
    password VARCHAR2(255) NOT NULL,
    role VARCHAR2(50) CHECK (role IN ('student', 'admin')),
    name VARCHAR2(255),
    created_at TIMESTAMP,
    is_active NUMBER(1)
);

-- Foreign Keys

ALTER TABLE "alternative" ADD CONSTRAINT fk_alt_quest FOREIGN KEY (question_id) REFERENCES "question"(id);
ALTER TABLE "answer_question" ADD CONSTRAINT fk_ans_exec FOREIGN KEY (execution_id) REFERENCES "performed_exam"(id);
ALTER TABLE "answer_question" ADD CONSTRAINT fk_ans_quest FOREIGN KEY (question_id) REFERENCES "question"(id);
ALTER TABLE "answer_question" ADD CONSTRAINT fk_ans_alt FOREIGN KEY (answer_alternative_id) REFERENCES "alternative"(id);
ALTER TABLE "chat" ADD CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES "user"(id);
ALTER TABLE "chat_content" ADD CONSTRAINT fk_cc_chat FOREIGN KEY (chat_id) REFERENCES "chat"(id);
ALTER TABLE "chat_content" ADD CONSTRAINT fk_cc_content FOREIGN KEY (content_id) REFERENCES "content"(id);
ALTER TABLE "content" ADD CONSTRAINT fk_cont_disc FOREIGN KEY (discipline_id) REFERENCES "discipline"(id);
ALTER TABLE "content_source" ADD CONSTRAINT fk_cs_cont FOREIGN KEY (content_id) REFERENCES "content"(id);
ALTER TABLE "content_source" ADD CONSTRAINT fk_cs_src FOREIGN KEY (source_id) REFERENCES "knowledge_source"(id);
ALTER TABLE "knowledge_source" ADD CONSTRAINT fk_ks_val FOREIGN KEY (admin_validator_id) REFERENCES "user"(id);
ALTER TABLE "learning_trace" ADD CONSTRAINT fk_lt_prof FOREIGN KEY (profile_id) REFERENCES "student_profile"(id);
ALTER TABLE "learning_trace" ADD CONSTRAINT fk_lt_cont FOREIGN KEY (content_id) REFERENCES "content"(id);
ALTER TABLE "message" ADD CONSTRAINT fk_msg_chat FOREIGN KEY (chat_id) REFERENCES "chat"(id);
ALTER TABLE "performed_exam" ADD CONSTRAINT fk_pe_exam FOREIGN KEY (exam_id) REFERENCES "exam"(id);
ALTER TABLE "performed_exam" ADD CONSTRAINT fk_pe_user FOREIGN KEY (user_id) REFERENCES "user"(id);
ALTER TABLE "question" ADD CONSTRAINT fk_qu_cont FOREIGN KEY (content_id) REFERENCES "content"(id);
ALTER TABLE "question_exam" ADD CONSTRAINT fk_qe_exam FOREIGN KEY (exam_id) REFERENCES "exam"(id);
ALTER TABLE "question_exam" ADD CONSTRAINT fk_qe_quest FOREIGN KEY (question_id) REFERENCES "question"(id);
ALTER TABLE "student_interactions" ADD CONSTRAINT fk_si_user FOREIGN KEY (user_id) REFERENCES "user"(id);
ALTER TABLE "student_interactions" ADD CONSTRAINT fk_si_chat FOREIGN KEY (chat_id) REFERENCES "chat"(id);
ALTER TABLE "student_interactions" ADD CONSTRAINT fk_si_cont FOREIGN KEY (content_id) REFERENCES "content"(id);
ALTER TABLE "student_profile" ADD CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES "user"(id);
ALTER TABLE "study_sessions" ADD CONSTRAINT fk_ss_user FOREIGN KEY (user_id) REFERENCES "user"(id);
ALTER TABLE "study_sessions" ADD CONSTRAINT fk_ss_chat FOREIGN KEY (chat_id) REFERENCES "chat"(id);
