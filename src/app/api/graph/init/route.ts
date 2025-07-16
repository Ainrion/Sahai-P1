import { NextRequest, NextResponse } from "next/server";
import {
  checkNeo4jConnection,
  initializeGraphSchema,
} from "../../../lib/neo4j";
import {
  initializeCulturalGraph,
  addCulturalEntity,
} from "../../../lib/culturalData";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entity } = body;

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

    switch (action) {
      case "initialize":
        return await handleInitialization();

      case "add_entity":
        if (!entity) {
          return NextResponse.json(
            {
              success: false,
              error: "Entity data is required for add_entity action",
            },
            { status: 400 }
          );
        }
        return await handleAddEntity(entity);

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Supported actions: initialize, add_entity",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Graph initialization failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Graph initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      message: "Graph initialization API is ready",
      availableActions: [
        {
          action: "initialize",
          method: "POST",
          description:
            "Initialize the complete cultural knowledge graph with sample data",
        },
        {
          action: "add_entity",
          method: "POST",
          description: "Add a new cultural entity to the graph",
          requiredFields: ["name", "type", "description"],
        },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Graph initialization API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Graph initialization API error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleInitialization(): Promise<NextResponse> {
  try {
    console.log("Starting cultural knowledge graph initialization...");

    // Initialize schema first
    const schemaResult = await initializeGraphSchema();
    if (!schemaResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to initialize graph schema",
          details: schemaResult.error,
        },
        { status: 500 }
      );
    }

    // Initialize cultural data
    const dataResult = await initializeCulturalGraph();
    if (!dataResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to initialize cultural data",
          details: dataResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cultural knowledge graph initialized successfully",
      data: {
        schemaInitialized: true,
        entitiesCreated: dataResult.entities,
        relationshipsCreated: dataResult.relationships,
        totalNodes: dataResult.entities,
        totalRelationships: dataResult.relationships,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleAddEntity(entityData: any): Promise<NextResponse> {
  try {
    // Validate required fields
    const requiredFields = ["name", "type", "description"];
    const missingFields = requiredFields.filter((field) => !entityData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          missingFields,
        },
        { status: 400 }
      );
    }

    // Add the entity
    const result = await addCulturalEntity(entityData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to add cultural entity",
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cultural entity "${entityData.name}" added successfully`,
      entity: {
        name: entityData.name,
        type: entityData.type,
        description: entityData.description,
        region: entityData.region || "",
        language: entityData.language || "",
        category: entityData.category || "",
        verified: false,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Add entity failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Add entity failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
