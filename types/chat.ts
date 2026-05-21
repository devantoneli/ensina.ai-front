export interface SidebarItem {
  id: string;
  label: string;
  active?: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  date: string;
}

export interface ContentResult {
  id: string;
  languageCode: string;
  subject: string;
  topic: string;
  progress: number;
  highlight: string;
}

export interface TrailItem {
  id: string;
  title: string;
  date: string;
}

export interface ChatOption {
  id: string;
  label: string;
}

export interface KnowledgeSourceRef {
  id: number;
  name: string;
  type: string;
  url?: string;
  contents: { id: number; name: string }[];
}

export interface FreeModeTeaching {
  direct_answer?: string;
  explanation?: string;
  study_tips?: string[];
  check_question?: string;
}

export interface FreeModeTrailSource {
  name?: string;
  url?: string;
  reason?: string;
}

export interface FreeModeTrailModule {
  title?: string;
  activities?: string[];
  prerequisites?: string[];
  recommended_sources?: FreeModeTrailSource[];
}

export interface FreeModeClassification {
  discipline?: string;
  contents?: string[];
  content_ids?: number[];
  available_disciplines?: string[];
  matched_sources?: KnowledgeSourceRef[];
  status?: string;
  top_score?: number;
  confidence?: number;
  recommendation_eligible?: boolean;
  message?: string;
  context_items?: unknown[];
}

export type ChatMessage =
  | {
      id: string;
      sender: 'assistant' | 'user';
      type: 'text';
      text: string[];
      sources?: KnowledgeSourceRef[];
    }
  | {
      id: string;
      sender: 'assistant';
      type: 'checklist';
      prompt: string;
      options: ChatOption[];
      actionLabel: string;
    };

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  subtitle: string;
  timeLabel: string;
  progressLabel: string;
  contentResult: ContentResult;
  messages: ChatMessage[];
}

export interface ChatMessageRequest {
  role: 'user' | 'model';
  content: string;
}

export interface ChatClassification {
  discipline: string;
  contents: string[];
}

export interface ChatResponse {
  state: string;
  conversation_mode?: 'study_plan' | 'pedagogical_support' | string;
  message?: string;
  detail?: string;
  classification?: ChatClassification & FreeModeClassification;
  teaching?: FreeModeTeaching;
  trail?: string | { trail?: FreeModeTrailModule[] };
  recommended_studies?: Array<{
    content?: string;
    reason?: string;
    sources?: Array<{ name?: string; url?: string }>;
  }>;
  sources?: KnowledgeSourceRef[];
}