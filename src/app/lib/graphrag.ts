import { executeQuery, getNeo4jDriver } from "./neo4j";
import { searchCulturalKnowledge, searchDocuments } from "./weaviate";
import {
  GraphRAGContext,
  GraphRAGResponse,
  HybridSearchResult,
  GraphTraversalQuery,
  GraphTraversalResult,
  SemanticGraphQuery,
  GraphQueryResult,
  CulturalEntity,
  CulturalRelationship,
  GraphPath,
  GraphNode,
  GraphRelationship,
  GraphRAGConfig,
} from "../types/graph";

// Default GraphRAG configuration
const DEFAULT_GRAPHRAG_CONFIG: GraphRAGConfig = {
  maxTraversalDepth: 3,
  maxResults: 10,
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
  hybridSearchWeights: {
    graph: 0.6,
    vector: 0.3,
    text: 0.1,
  },
  reasoningDepth: 2,
  confidenceThreshold: 0.7,
};

// Simple in-memory cache
const queryCache = new Map<string, { result: any; timestamp: number }>();

/**
 * Generate cache key for queries
 */
function generateCacheKey(query: string, params: any): string {
  return `${query}:${JSON.stringify(params)}`;
}

/**
 * Get cached result if available and not expired
 */
function getCachedResult(cacheKey: string): any | null {
  const cached = queryCache.get(cacheKey);
  if (
    cached &&
    Date.now() - cached.timestamp < DEFAULT_GRAPHRAG_CONFIG.cacheTimeout
  ) {
    return cached.result;
  }
  queryCache.delete(cacheKey);
  return null;
}

/**
 * Cache query result
 */
function setCachedResult(cacheKey: string, result: any): void {
  queryCache.set(cacheKey, { result, timestamp: Date.now() });
}

/**
 * Find related entities through graph traversal
 */
export async function traverseGraph(
  query: GraphTraversalQuery
): Promise<GraphTraversalResult> {
  const startTime = Date.now();
  const cacheKey = generateCacheKey("traverse", query);

  // Check cache first
  if (DEFAULT_GRAPHRAG_CONFIG.enableCaching) {
    const cached = getCachedResult(cacheKey);
    if (cached) return cached;
  }

  try {
    const {
      startNodeId,
      relationshipTypes = [],
      direction = "BOTH",
      maxDepth = DEFAULT_GRAPHRAG_CONFIG.maxTraversalDepth,
      filters = {},
    } = query;

    // Build Cypher query for traversal
    let cypherQuery = `
      MATCH path = (start)-[r*1..${maxDepth}]-(end)
      WHERE id(start) = $startNodeId
    `;

    // Add relationship type filter
    if (relationshipTypes.length > 0) {
      const relTypeFilter = relationshipTypes
        .map((type) => `'${type}'`)
        .join("|");
      cypherQuery = cypherQuery.replace(
        "]-",
        `${
          direction === "OUTGOING" ? "" : "<"
        }-[r:${relTypeFilter}*1..${maxDepth}]-${
          direction === "INCOMING" ? "" : ">"
        }`
      );
    }

    // Add node label filters
    if (filters.nodeLabels && filters.nodeLabels.length > 0) {
      const labelFilter = filters.nodeLabels
        .map((label) => `'${label}'`)
        .join(":");
      cypherQuery += ` AND ALL(n IN nodes(path) WHERE ANY(label IN labels(n) WHERE label IN [${filters.nodeLabels
        .map((l) => `'${l}'`)
        .join(",")}]))`;
    }

    cypherQuery += `
      RETURN path, 
             nodes(path) as pathNodes, 
             relationships(path) as pathRels,
             length(path) as pathLength
      ORDER BY pathLength
      LIMIT $limit
    `;

    const result = await executeQuery(cypherQuery, {
      startNodeId: parseInt(startNodeId),
      limit: DEFAULT_GRAPHRAG_CONFIG.maxResults,
    });

    if (!result.success) {
      throw new Error(result.error || "Graph traversal failed");
    }

    // Process results
    const paths: GraphPath[] = [];
    const allNodes: GraphNode[] = [];
    const allRelationships: GraphRelationship[] = [];
    const nodeIds = new Set<string>();
    const relIds = new Set<string>();

    result.data.forEach((record: any) => {
      if (record.path) {
        paths.push(record.path);
      }

      if (record.pathNodes) {
        record.pathNodes.forEach((node: GraphNode) => {
          if (!nodeIds.has(node.id)) {
            allNodes.push(node);
            nodeIds.add(node.id);
          }
        });
      }

      if (record.pathRels) {
        record.pathRels.forEach((rel: GraphRelationship) => {
          if (!relIds.has(rel.id)) {
            allRelationships.push(rel);
            relIds.add(rel.id);
          }
        });
      }
    });

    const traversalResult: GraphTraversalResult = {
      success: true,
      paths,
      nodes: allNodes,
      relationships: allRelationships,
      traversalDepth: maxDepth,
      totalPaths: paths.length,
      executionTime: Date.now() - startTime,
    };

    // Cache result
    if (DEFAULT_GRAPHRAG_CONFIG.enableCaching) {
      setCachedResult(cacheKey, traversalResult);
    }

    return traversalResult;
  } catch (error) {
    console.error("Graph traversal failed:", error);
    return {
      success: false,
      paths: [],
      nodes: [],
      relationships: [],
      traversalDepth: 0,
      totalPaths: 0,
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Semantic search in graph using natural language
 */
export async function semanticGraphSearch(
  query: SemanticGraphQuery
): Promise<GraphQueryResult> {
  const startTime = Date.now();
  const cacheKey = generateCacheKey("semantic", query);

  // Check cache first
  if (DEFAULT_GRAPHRAG_CONFIG.enableCaching) {
    const cached = getCachedResult(cacheKey);
    if (cached) return cached;
  }

  try {
    const {
      concept,
      context = "",
      relationshipTypes = [],
      maxResults = DEFAULT_GRAPHRAG_CONFIG.maxResults,
      includeScore = true,
      minScore = 0.5,
    } = query;

    // Use full-text search for concept matching
    let cypherQuery = `
      CALL db.index.fulltext.queryNodes('cultural_search', $searchTerm) 
      YIELD node, score
    `;

    // Add context filtering if provided
    if (context) {
      cypherQuery += ` WHERE node.region CONTAINS $context OR node.category CONTAINS $context OR node.description CONTAINS $context`;
    }

    // Add score filtering
    if (minScore > 0) {
      cypherQuery += ` ${context ? "AND" : "WHERE"} score >= $minScore`;
    }

    cypherQuery += `
      RETURN node, score
      ORDER BY score DESC
      LIMIT $limit
    `;

    const searchTerm = `${concept}${context ? " " + context : ""}`;
    const result = await executeQuery(cypherQuery, {
      searchTerm,
      context,
      minScore,
      limit: maxResults,
    });

    if (!result.success) {
      throw new Error(result.error || "Semantic search failed");
    }

    const searchResult: GraphQueryResult = {
      success: true,
      data: result.data.map((record: any) => ({
        node: record.node,
        score: includeScore ? record.score : undefined,
      })),
      totalResults: result.data.length,
      executionTime: Date.now() - startTime,
      metadata: {
        query: cypherQuery,
        parameters: { searchTerm, context, minScore, limit: maxResults },
        resultType: "nodes",
      },
    };

    // Cache result
    if (DEFAULT_GRAPHRAG_CONFIG.enableCaching) {
      setCachedResult(cacheKey, searchResult);
    }

    return searchResult;
  } catch (error) {
    console.error("Semantic graph search failed:", error);
    return {
      success: false,
      data: [],
      totalResults: 0,
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Hybrid search combining graph and vector results
 */
export async function hybridSearch(
  query: string,
  options: {
    includeGraph?: boolean;
    includeVector?: boolean;
    graphContext?: string;
    maxResults?: number;
    weights?: { graph: number; vector: number };
  } = {}
): Promise<HybridSearchResult> {
  const startTime = Date.now();

  const {
    includeGraph = true,
    includeVector = true,
    graphContext = "",
    maxResults = DEFAULT_GRAPHRAG_CONFIG.maxResults,
    weights = DEFAULT_GRAPHRAG_CONFIG.hybridSearchWeights,
  } = options;

  try {
    // Parallel execution of graph and vector searches
    const searchPromises: Promise<any>[] = [];

    if (includeGraph) {
      searchPromises.push(
        semanticGraphSearch({
          concept: query,
          context: graphContext,
          maxResults: Math.ceil(maxResults * weights.graph),
        })
      );
    } else {
      searchPromises.push(
        Promise.resolve({ success: true, data: [], totalResults: 0 })
      );
    }

    if (includeVector) {
      searchPromises.push(
        searchCulturalKnowledge(
          query,
          undefined,
          Math.ceil(maxResults * weights.vector)
        )
      );
    } else {
      searchPromises.push(Promise.resolve({ success: true, data: [] }));
    }

    const [graphResults, vectorResults] = await Promise.all(searchPromises);

    // Calculate combined score and merge results
    const combinedResults: any[] = [];

    // Add graph results with weighted scores
    if (graphResults.success && graphResults.data) {
      graphResults.data.forEach((item: any, index: number) => {
        const score = item.score || 1 - index * 0.1;
        combinedResults.push({
          ...item,
          source: "graph",
          combinedScore: score * weights.graph,
          originalScore: score,
        });
      });
    }

    // Add vector results with weighted scores
    if (vectorResults.success && vectorResults.data) {
      vectorResults.data.forEach((item: any, index: number) => {
        const score = 1 - index * 0.1; // Simple scoring for vector results
        combinedResults.push({
          ...item,
          source: "vector",
          combinedScore: score * weights.vector,
          originalScore: score,
        });
      });
    }

    // Sort by combined score and limit results
    combinedResults.sort((a, b) => b.combinedScore - a.combinedScore);
    const finalResults = combinedResults.slice(0, maxResults);

    const totalScore = finalResults.reduce(
      (sum, item) => sum + item.combinedScore,
      0
    );
    const avgScore =
      finalResults.length > 0 ? totalScore / finalResults.length : 0;

    return {
      graphResults,
      vectorResults,
      combinedScore: avgScore,
      explanation: `Combined ${finalResults.length} results from graph (${
        weights.graph * 100
      }%) and vector (${weights.vector * 100}%) searches`,
    };
  } catch (error) {
    console.error("Hybrid search failed:", error);
    return {
      graphResults: {
        success: false,
        data: [],
        totalResults: 0,
        executionTime: 0,
      },
      vectorResults: { success: false, data: [] },
      combinedScore: 0,
      explanation: `Search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Generate GraphRAG context for a query
 */
export async function generateGraphRAGContext(
  query: string,
  options: {
    maxDepth?: number;
    includeRelatedEntities?: boolean;
    includeInsights?: boolean;
  } = {}
): Promise<GraphRAGContext> {
  const {
    maxDepth = DEFAULT_GRAPHRAG_CONFIG.reasoningDepth,
    includeRelatedEntities = true,
    includeInsights = true,
  } = options;

  try {
    // First, find relevant nodes using semantic search
    const semanticResults = await semanticGraphSearch({
      concept: query,
      maxResults: 5,
    });

    if (!semanticResults.success || semanticResults.data.length === 0) {
      return {
        nodes: [],
        relationships: [],
        paths: [],
        insights: ["No relevant entities found in the graph"],
        relevanceScore: 0,
        graphQuery: query,
      };
    }

    // Get the most relevant node as starting point
    const startNode = semanticResults.data[0].node;

    let allNodes: CulturalEntity[] = [startNode];
    let allRelationships: CulturalRelationship[] = [];
    let allPaths: GraphPath[] = [];

    // If including related entities, traverse from the main node
    if (includeRelatedEntities && startNode.id) {
      const traversalResult = await traverseGraph({
        startNodeId: startNode.id,
        maxDepth,
        relationshipTypes: [
          "RELATED_TO",
          "ASSOCIATED_WITH",
          "PART_OF",
          "CELEBRATED_IN",
        ],
      });

      if (traversalResult.success) {
        allNodes = [...allNodes, ...traversalResult.nodes];
        allRelationships = traversalResult.relationships;
        allPaths = traversalResult.paths;
      }
    }

    // Generate insights
    const insights: string[] = [];
    if (includeInsights) {
      insights.push(`Found ${allNodes.length} related cultural entities`);
      insights.push(`Discovered ${allRelationships.length} relationships`);
      insights.push(`Explored ${allPaths.length} connection paths`);

      if (allNodes.length > 1) {
        const regions = [
          ...new Set(allNodes.map((n) => n.properties.region).filter(Boolean)),
        ];
        if (regions.length > 1) {
          insights.push(`Connected across regions: ${regions.join(", ")}`);
        }

        const types = [
          ...new Set(allNodes.map((n) => n.properties.type).filter(Boolean)),
        ];
        if (types.length > 1) {
          insights.push(`Spans multiple cultural domains: ${types.join(", ")}`);
        }
      }
    }

    // Calculate relevance score based on number of connections and quality
    const relevanceScore = Math.min(
      allNodes.length * 0.2 +
        allRelationships.length * 0.3 +
        allPaths.length * 0.1,
      1.0
    );

    return {
      nodes: allNodes,
      relationships: allRelationships,
      paths: allPaths,
      insights,
      relevanceScore,
      graphQuery: query,
    };
  } catch (error) {
    console.error("Failed to generate GraphRAG context:", error);
    return {
      nodes: [],
      relationships: [],
      paths: [],
      insights: [
        `Error generating context: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
      relevanceScore: 0,
      graphQuery: query,
    };
  }
}

/**
 * Main GraphRAG query function
 */
export async function graphRAGQuery(
  question: string,
  options: {
    includeVector?: boolean;
    maxDepth?: number;
    generateReasoning?: boolean;
  } = {}
): Promise<GraphRAGResponse> {
  const startTime = Date.now();

  const {
    includeVector = true,
    maxDepth = DEFAULT_GRAPHRAG_CONFIG.reasoningDepth,
    generateReasoning = true,
  } = options;

  try {
    // Get hybrid search results
    const hybridResults = await hybridSearch(question, {
      includeGraph: true,
      includeVector,
      maxResults: DEFAULT_GRAPHRAG_CONFIG.maxResults,
    });

    // Generate graph context
    const graphContext = await generateGraphRAGContext(question, {
      maxDepth,
      includeRelatedEntities: true,
      includeInsights: true,
    });

    // Generate reasoning steps if requested
    const reasoning: string[] = [];
    if (generateReasoning) {
      reasoning.push(`1. Searched for entities related to: "${question}"`);
      reasoning.push(
        `2. Found ${graphContext.nodes.length} relevant cultural entities`
      );
      reasoning.push(
        `3. Explored ${graphContext.relationships.length} relationships`
      );
      reasoning.push(
        `4. Generated insights from ${graphContext.paths.length} connection paths`
      );

      if (hybridResults.vectorResults && hybridResults.vectorResults.success) {
        reasoning.push(`5. Enhanced with vector search results`);
      }
    }

    // Prepare sources
    const sources = [
      {
        type: "graph" as const,
        nodes: graphContext.nodes,
        relationships: graphContext.relationships,
        relevance: graphContext.relevanceScore,
      },
    ];

    if (includeVector && hybridResults.vectorResults?.success) {
      sources.push({
        type: "vector" as const,
        nodes: hybridResults.vectorResults.data.map((item: any) => ({
          id: item.id || "",
          labels: ["VectorResult"],
          properties: item,
        })),
        relationships: [],
        relevance: 0.8,
      });
    }

    // Generate answer based on context
    const answer = generateContextualAnswer(
      question,
      graphContext,
      hybridResults
    );

    return {
      success: true,
      answer,
      context: graphContext,
      sources,
      reasoning,
      confidence: Math.max(graphContext.relevanceScore, 0.5),
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("GraphRAG query failed:", error);
    return {
      success: false,
      answer:
        "I apologize, but I encountered an error while processing your question.",
      context: {
        nodes: [],
        relationships: [],
        paths: [],
        insights: [],
        relevanceScore: 0,
        graphQuery: question,
      },
      sources: [],
      reasoning: [
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      confidence: 0,
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate contextual answer based on graph context
 */
function generateContextualAnswer(
  question: string,
  context: GraphRAGContext,
  hybridResults: HybridSearchResult
): string {
  if (context.nodes.length === 0) {
    return "I couldn't find specific information about that in my cultural knowledge graph. Could you please rephrase your question or be more specific?";
  }

  const mainEntity = context.nodes[0];
  let answer = `Based on my cultural knowledge graph, here's what I found about ${mainEntity.properties.name}:\n\n`;

  // Add main entity description
  if (mainEntity.properties.description) {
    answer += `${mainEntity.properties.description}\n\n`;
  }

  // Add relationship insights
  if (context.relationships.length > 0) {
    answer += "**Cultural Connections:**\n";
    const relationshipGroups = groupRelationshipsByType(context.relationships);

    Object.entries(relationshipGroups).forEach(([type, rels]) => {
      const relatedEntities = rels
        .map((rel) => {
          const relatedNode = context.nodes.find(
            (n) => n.id === rel.endNodeId || n.id === rel.startNodeId
          );
          return relatedNode?.properties.name || "Unknown entity";
        })
        .filter((name) => name !== "Unknown entity");

      if (relatedEntities.length > 0) {
        answer += `- ${formatRelationshipType(type)}: ${relatedEntities.join(
          ", "
        )}\n`;
      }
    });
    answer += "\n";
  }

  // Add insights
  if (context.insights.length > 0) {
    answer += "**Additional Insights:**\n";
    context.insights.forEach((insight) => {
      answer += `- ${insight}\n`;
    });
  }

  return answer;
}

/**
 * Group relationships by type
 */
function groupRelationshipsByType(
  relationships: CulturalRelationship[]
): Record<string, CulturalRelationship[]> {
  return relationships.reduce((groups, rel) => {
    if (!groups[rel.type]) {
      groups[rel.type] = [];
    }
    groups[rel.type].push(rel);
    return groups;
  }, {} as Record<string, CulturalRelationship[]>);
}

/**
 * Format relationship type for display
 */
function formatRelationshipType(type: string): string {
  const typeMap: Record<string, string> = {
    CELEBRATED_IN: "Celebrated in",
    WORSHIPS: "Associated with deity",
    ORIGINATED_FROM: "Originated from",
    INFLUENCED_BY: "Influenced by",
    PART_OF: "Part of",
    RELATED_TO: "Related to",
    PRACTICED_BY: "Practiced by",
    ASSOCIATED_WITH: "Associated with",
    SPEAKS: "Language spoken",
    CREATED_BY: "Created by",
    PERFORMED_DURING: "Performed during",
    FOLLOWS: "Follows tradition",
    CONNECTED_TO: "Connected to",
    VARIANT_OF: "Variant of",
    EVOLVED_INTO: "Evolved into",
  };

  return typeMap[type] || type.toLowerCase().replace(/_/g, " ");
}
