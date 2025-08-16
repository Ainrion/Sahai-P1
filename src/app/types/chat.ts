export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  content?: string; // Extracted text for PDFs
}

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
  isPreparing?: boolean;
  attachments?: FileAttachment[];
}

export interface ChatResponse {
  message: string;
  error?: string;
}

// Streaming response types
export interface StreamingChatResponse {
  content: string;
  done: boolean;
  sources?: Array<{
    title: string;
    category: string;
    content: string;
    relevance: number;
  }>;
  error?: string;
  model?: string;
  timestamp?: string;
}
