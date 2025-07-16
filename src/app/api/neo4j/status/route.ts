import { NextRequest, NextResponse } from "next/server";
import {
  checkNeo4jConnection,
  initializeGraphSchema,
  getGraphMetrics,
  getGraphSchema,
  clearGraphData,
} from "../../../lib/neo4j";

export async function GET(request: NextRequest) {
  try {
    // Check Neo4j connection status
    const connectionStatus = await checkNeo4jConnection();

    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: connectionStatus.error,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Get graph metrics if connected
    const metrics = await getGraphMetrics();
    const schema = await getGraphSchema();

    return NextResponse.json({
      success: true,
      connected: true,
      version: connectionStatus.version,
      metrics,
      schema: {
        nodeTypes: schema.nodeTypes.length,
        relationshipTypes: schema.relationshipTypes.length,
        constraints: schema.constraints.length,
        indexes: schema.indexes.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Neo4j status check failed:", error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, confirm } = body;

    switch (action) {
      case "initialize":
        return await handleInitializeSchema();

      case "clear":
        if (!confirm) {
          return NextResponse.json(
            {
              success: false,
              error: "Confirmation required to clear data. Set confirm: true",
            },
            { status: 400 }
          );
        }
        return await handleClearData();

      case "metrics":
        return await handleGetMetrics();

      case "schema":
        return await handleGetSchema();

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Supported actions: initialize, clear, metrics, schema",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Neo4j management operation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleInitializeSchema() {
  try {
    // Check connection first
    const connectionStatus = await checkNeo4jConnection();
    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          success: false,
          error: "Neo4j is not connected",
          connectionError: connectionStatus.error,
        },
        { status: 503 }
      );
    }

    // Initialize schema
    const result = await initializeGraphSchema();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to initialize schema",
          details: result.error,
        },
        { status: 500 }
      );
    }

    // Get updated metrics after initialization
    const metrics = await getGraphMetrics();
    const schema = await getGraphSchema();

    return NextResponse.json({
      success: true,
      message: "Graph schema initialized successfully",
      metrics,
      schema: {
        nodeTypes: schema.nodeTypes,
        relationshipTypes: schema.relationshipTypes,
        constraints: schema.constraints,
        indexes: schema.indexes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Schema initialization failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Schema initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleClearData() {
  try {
    // Check connection first
    const connectionStatus = await checkNeo4jConnection();
    if (!connectionStatus.connected) {
      return NextResponse.json(
        {
          success: false,
          error: "Neo4j is not connected",
        },
        { status: 503 }
      );
    }

    // Get metrics before clearing
    const beforeMetrics = await getGraphMetrics();

    // Clear data
    const result = await clearGraphData();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to clear data",
          details: result.error,
        },
        { status: 500 }
      );
    }

    // Get metrics after clearing
    const afterMetrics = await getGraphMetrics();

    return NextResponse.json({
      success: true,
      message: "Graph data cleared successfully",
      beforeMetrics,
      afterMetrics,
      nodesRemoved: beforeMetrics.totalNodes,
      relationshipsRemoved: beforeMetrics.totalRelationships,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Data clearing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Data clearing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleGetMetrics() {
  try {
    const metrics = await getGraphMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleGetSchema() {
  try {
    const schema = await getGraphSchema();

    return NextResponse.json({
      success: true,
      schema,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get schema:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
