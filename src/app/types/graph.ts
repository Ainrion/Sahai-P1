// Graph Database Types for Neo4j GraphRAG Implementation

// Core Graph Types
export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  elementId?: string;
}

export interface GraphRelationship {
  id: string;
  type: string;
  properties: Record<string, any>;
  startNodeId: string;
  endNodeId: string;
  elementId?: string;
}

export interface GraphPath {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  length: number;
}

// Cultural Knowledge Graph Types
export interface CulturalEntity extends GraphNode {
  properties: {
    name: string;
    type:
      | "festival"
      | "food"
      | "person"
      | "place"
      | "tradition"
      | "custom"
      | "deity"
      | "language"
      | "art"
      | "music";
    description?: string;
    region?: string;
    language?: string;
    significance?: string;
    category?: string;
    dateAdded: string;
    lastUpdated: string;
    popularity?: number;
    verified?: boolean;
  };
}

export interface CulturalRelationship extends GraphRelationship {
  type:
    | "CELEBRATED_IN" // Festival -> Place
    | "WORSHIPS" // Festival -> Deity
    | "ORIGINATED_FROM" // Tradition -> Place/Person
    | "INFLUENCED_BY" // Culture -> Culture
    | "PART_OF" // Element -> Larger_Element
    | "RELATED_TO" // General relationship
    | "PRACTICED_BY" // Tradition -> People/Community
    | "ASSOCIATED_WITH" // Food -> Festival
    | "SPEAKS" // Person/Community -> Language
    | "CREATED_BY" // Art/Music -> Person
    | "PERFORMED_DURING" // Music/Dance -> Festival
    | "FOLLOWS" // Person -> Tradition
    | "CONNECTED_TO" // Generic connection
    | "VARIANT_OF" // Regional variant
    | "EVOLVED_INTO"; // Historical evolution
  properties: {
    strength?: number; // Relationship strength (0-1)
    since?: string; // When relationship started
    until?: string; // When relationship ended (if applicable)
    context?: string; // Additional context
    verified?: boolean; // Whether relationship is verified
  };
}

// Query Types
export interface GraphQuery {
  query: string;
  parameters?: Record<string, any>;
  limit?: number;
  timeout?: number;
}

export interface GraphTraversalQuery {
  startNodeId: string;
  relationshipTypes?: string[];
  direction?: "INCOMING" | "OUTGOING" | "BOTH";
  maxDepth?: number;
  filters?: {
    nodeLabels?: string[];
    relationshipProperties?: Record<string, any>;
    nodeProperties?: Record<string, any>;
  };
}

export interface SemanticGraphQuery {
  concept: string;
  context?: string;
  relationshipTypes?: string[];
  maxResults?: number;
  includeScore?: boolean;
  minScore?: number;
}

// Response Types
export interface GraphQueryResult {
  success: boolean;
  data: GraphNode[] | GraphRelationship[] | GraphPath[] | any[];
  totalResults: number;
  executionTime: number;
  error?: string;
  metadata?: {
    query: string;
    parameters?: Record<string, any>;
    resultType: "nodes" | "relationships" | "paths" | "mixed";
  };
}

export interface GraphTraversalResult {
  success: boolean;
  paths: GraphPath[];
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  traversalDepth: number;
  totalPaths: number;
  executionTime: number;
  error?: string;
}

export interface GraphInsightResult {
  success: boolean;
  insights: {
    centralNodes: { node: GraphNode; centrality: number }[];
    clusters: { cluster: GraphNode[]; coherence: number }[];
    influentialRelationships: {
      relationship: GraphRelationship;
      influence: number;
    }[];
    patterns: { pattern: string; frequency: number; examples: GraphPath[] }[];
  };
  executionTime: number;
  error?: string;
}

// GraphRAG Specific Types
export interface GraphRAGContext {
  nodes: CulturalEntity[];
  relationships: CulturalRelationship[];
  paths: GraphPath[];
  insights: string[];
  relevanceScore: number;
  graphQuery: string;
  vectorQuery?: string;
}

export interface HybridSearchResult {
  graphResults: GraphQueryResult;
  vectorResults?: any; // From existing vector types
  combinedScore: number;
  explanation: string;
}

export interface GraphRAGResponse {
  success: boolean;
  answer: string;
  context: GraphRAGContext;
  sources: {
    type: "graph" | "vector" | "hybrid";
    nodes: GraphNode[];
    relationships: GraphRelationship[];
    relevance: number;
  }[];
  reasoning: string[];
  confidence: number;
  executionTime: number;
  error?: string;
}

// Graph Analytics Types
export interface NodeAnalytics {
  nodeId: string;
  degree: number;
  inDegree: number;
  outDegree: number;
  betweennessCentrality?: number;
  closenessCentrality?: number;
  pageRank?: number;
  clustering?: number;
}

export interface GraphMetrics {
  totalNodes: number;
  totalRelationships: number;
  nodeTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
  density: number;
  averageDegree: number;
  components: number;
  diameter?: number;
}

// Schema Types
export interface GraphSchema {
  nodeTypes: {
    label: string;
    properties: Record<
      string,
      { type: string; required: boolean; indexed?: boolean }
    >;
  }[];
  relationshipTypes: {
    type: string;
    properties: Record<string, { type: string; required: boolean }>;
    allowedStartLabels: string[];
    allowedEndLabels: string[];
  }[];
  constraints: {
    type: "UNIQUE" | "EXISTS" | "KEY";
    target: string;
    property?: string;
  }[];
  indexes: {
    type: "BTREE" | "TEXT" | "FULLTEXT";
    target: string;
    property: string;
  }[];
}

// Configuration Types
export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionAcquisitionTimeout?: number;
  connectionTimeout?: number;
  maxTransactionRetryTime?: number;
}

export interface GraphRAGConfig {
  maxTraversalDepth: number;
  maxResults: number;
  enableCaching: boolean;
  cacheTimeout: number;
  hybridSearchWeights: {
    graph: number;
    vector: number;
    text: number;
  };
  reasoningDepth: number;
  confidenceThreshold: number;
}
