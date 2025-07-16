import { NextRequest, NextResponse } from "next/server";
import {
  graphRAGQuery,
  hybridSearch,
  semanticGraphSearch,
  traverseGraph,
  generateGraphRAGContext,
} from "../../../lib/graphrag";
import { checkNeo4jConnection } from "../../../lib/neo4j";
import {
  GraphRAGResponse,
  HybridSearchResult,
  GraphQueryResult,
  GraphTraversalResult,
  SemanticGraphQuery,
  GraphTraversalQuery,
} from "../../../types/graph";

export async function POST(request: NextRequest) {
  try {
    // Check Neo4j connection first
    const connectionStatus = await checkNeo4jConnection();
    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          success: false,
          error: "Neo4j database is not connected",
          details: connectionStatus.error,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { query, type, options = {} } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Query is required and must be a string",
        },
        { status: 400 }
      );
    }

    switch (type) {
      case "graphrag":
        return await handleGraphRAGQuery(query, options);

      case "hybrid":
        return await handleHybridSearch(query, options);

      case "semantic":
        return await handleSemanticSearch(query, options);

      case "traverse":
        return await handleTraversal(query, options);

      case "context":
        return await handleContextGeneration(query, options);

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid search type. Supported types: graphrag, hybrid, semantic, traverse, context",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Graph search failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Graph search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "semantic";
    const limit = parseInt(searchParams.get("limit") || "10");
    const context = searchParams.get("context") || "";
    const includeVector = searchParams.get("includeVector") === "true";

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter "q" is required',
        },
        { status: 400 }
      );
    }

    // Check Neo4j connection
    const connectionStatus = await checkNeo4jConnection();
    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          success: false,
          error: "Neo4j database is not connected",
          details: connectionStatus.error,
        },
        { status: 503 }
      );
    }

    switch (type) {
      case "semantic":
        const semanticResult = await semanticGraphSearch({
          concept: query,
          context: context,
          maxResults: limit,
        });
        return NextResponse.json(semanticResult);

      case "hybrid":
        const hybridResult = await hybridSearch(query, {
          includeVector,
          graphContext: context,
          maxResults: limit,
        });
        return NextResponse.json(hybridResult);

      case "graphrag":
        const graphragResult = await graphRAGQuery(query, {
          includeVector,
          maxDepth: 2,
        });
        return NextResponse.json(graphragResult);

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid search type. Supported types: semantic, hybrid, graphrag",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Graph search GET failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Graph search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleGraphRAGQuery(
  query: string,
  options: any
): Promise<NextResponse> {
  try {
    const {
      includeVector = true,
      maxDepth = 2,
      generateReasoning = true,
    } = options;

    const result: GraphRAGResponse = await graphRAGQuery(query, {
      includeVector,
      maxDepth,
      generateReasoning,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GraphRAG query failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "GraphRAG query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleHybridSearch(
  query: string,
  options: any
): Promise<NextResponse> {
  try {
    const {
      includeGraph = true,
      includeVector = true,
      graphContext = "",
      maxResults = 10,
      weights = { graph: 0.6, vector: 0.4 },
    } = options;

    const result: HybridSearchResult = await hybridSearch(query, {
      includeGraph,
      includeVector,
      graphContext,
      maxResults,
      weights,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Hybrid search failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Hybrid search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleSemanticSearch(
  query: string,
  options: any
): Promise<NextResponse> {
  try {
    const {
      context = "",
      relationshipTypes = [],
      maxResults = 10,
      includeScore = true,
      minScore = 0.5,
    } = options;

    const semanticQuery: SemanticGraphQuery = {
      concept: query,
      context,
      relationshipTypes,
      maxResults,
      includeScore,
      minScore,
    };

    const result: GraphQueryResult = await semanticGraphSearch(semanticQuery);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Semantic search failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Semantic search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleTraversal(
  query: string,
  options: any
): Promise<NextResponse> {
  try {
    const {
      startNodeId,
      relationshipTypes = [],
      direction = "BOTH",
      maxDepth = 3,
      filters = {},
    } = options;

    if (!startNodeId) {
      return NextResponse.json(
        {
          success: false,
          error: "startNodeId is required for traversal queries",
        },
        { status: 400 }
      );
    }

    const traversalQuery: GraphTraversalQuery = {
      startNodeId,
      relationshipTypes,
      direction,
      maxDepth,
      filters,
    };

    const result: GraphTraversalResult = await traverseGraph(traversalQuery);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Graph traversal failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Graph traversal failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleContextGeneration(
  query: string,
  options: any
): Promise<NextResponse> {
  try {
    const {
      maxDepth = 2,
      includeRelatedEntities = true,
      includeInsights = true,
    } = options;

    const result = await generateGraphRAGContext(query, {
      maxDepth,
      includeRelatedEntities,
      includeInsights,
    });

    return NextResponse.json({
      success: true,
      context: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Context generation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Context generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
