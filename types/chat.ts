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
  message: string;
  classification?: ChatClassification;
  trail?: string;
  sources?: KnowledgeSourceRef[];
}