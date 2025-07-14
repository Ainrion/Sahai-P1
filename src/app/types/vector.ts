// Vector and RAG related types for Phase 2

export interface CulturalKnowledge {
  id?: string;
  title: string;
  content: string;
  category:
    | "festival"
    | "food"
    | "custom"
    | "tradition"
    | "language"
    | "mythology"
    | "art"
    | "dance"
    | "music"
    | "other";
  region?: string;
  language: "Hindi" | "English" | "both";
  tags: string[];
  source: string;
  dateAdded?: string;
  vector?: number[];
}

export interface Document {
  id?: string;
  fileName: string;
  content: string;
  fileType: "pdf" | "doc" | "docx" | "txt" | "md";
  fileSize: number;
  uploadDate?: string;
  chunks: string[];
  vector?: number[];
}

export interface VectorSearchResult {
  id: string;
  distance: number;
  content: string;
  metadata: Record<string, any>;
}

export interface SearchOptions {
  category?: string;
  region?: string;
  language?: string;
  limit?: number;
  threshold?: number;
}

export interface RAGContext {
  culturalKnowledge: CulturalKnowledge[];
  documents: Document[];
  totalResults: number;
  searchQuery: string;
}

export interface UploadedFile {
  fileName: string;
  content: string;
  fileType: string;
  fileSize: number;
  buffer: Buffer;
}

export interface FileProcessingResult {
  success: boolean;
  fileName: string;
  content: string;
  chunks: string[];
  error?: string;
}

export interface VectorStoreStatus {
  success: boolean;
  version?: string;
  hostname?: string;
  modules?: Record<string, any>;
  error?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface SearchRequest {
  query: string;
  options?: SearchOptions;
}

export interface SearchResponse {
  success: boolean;
  results: VectorSearchResult[];
  totalResults: number;
  searchTime: number;
  error?: string;
}

export interface UploadRequest {
  file: UploadedFile;
  category?: string;
  tags?: string[];
}

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  fileName: string;
  fileSize: number;
  chunksCount: number;
  error?: string;
}

// Extended chat types for RAG integration
export interface RAGChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
  ragContext?: RAGContext;
  sources?: Array<{
    title: string;
    category: string;
    relevance: number;
  }>;
}

export interface RAGChatResponse {
  message: string;
  sources: Array<{
    title: string;
    category: string;
    content: string;
    relevance: number;
  }>;
  error?: string;
}

export interface CulturalCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface RegionalFilter {
  id: string;
  name: string;
  states: string[];
  count: number;
}

export interface LanguageFilter {
  id: string;
  name: string;
  code: string;
  count: number;
}

export interface AdvancedSearchFilters {
  categories: CulturalCategory[];
  regions: RegionalFilter[];
  languages: LanguageFilter[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface KnowledgeBaseStats {
  totalDocuments: number;
  totalCulturalKnowledge: number;
  categoryCounts: Record<string, number>;
  languageCounts: Record<string, number>;
  recentUploads: number;
  storageUsed: number;
}
