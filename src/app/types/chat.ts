export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}
