import { NextRequest, NextResponse } from "next/server";
import {
  getWeaviateStatus,
  testWeaviateConnection,
  initializeCulturalSchema,
} from "../../../lib/weaviate";

export async function GET(request: NextRequest) {
  try {
    // Test Weaviate connection
    const connectionStatus = await testWeaviateConnection();

    if (!connectionStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot connect to Weaviate",
          status: "disconnected",
          suggestions: [
            "Make sure Weaviate is running: docker-compose up -d",
            "Check if Weaviate is accessible at http://localhost:8080",
            "Verify docker-compose.yml configuration",
          ],
        },
        { status: 503 }
      );
    }

    // Get Weaviate status
    const statusInfo = await getWeaviateStatus();

    if (!statusInfo.success) {
      return NextResponse.json(
        {
          success: false,
          error: statusInfo.error,
          status: "error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "connected",
      version: statusInfo.version,
      hostname: statusInfo.hostname,
      modules: statusInfo.modules,
      endpoint: process.env.WEAVIATE_URL || "http://localhost:8080",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Weaviate status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "initialize") {
      // Initialize cultural schema
      const result = await initializeCulturalSchema();

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            action: "initialize",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Cultural schema initialized successfully",
        action: "initialize",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions: initialize" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Weaviate POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
