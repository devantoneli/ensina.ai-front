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

export type ChatMessage =
  | {
      id: string;
      sender: 'assistant' | 'user';
      type: 'text';
      text: string[];
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