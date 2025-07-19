export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
  isPreparing?: boolean;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

// Streaming response types
export interface StreamingChatResponse {
  type: "chunk" | "done" | "error";
  content?: string;
  sources?: Array<{
    title: string;
    category: string;
    content: string;
    relevance: number;
    source?: "vector" | "graph" | "document" | "hybrid";
  }>;
  error?: string;
  model?: string;
  timestamp?: string;
  ragEnabled?: boolean;
  graphRAGEnabled?: boolean;
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

// Ollama streaming response
export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}
