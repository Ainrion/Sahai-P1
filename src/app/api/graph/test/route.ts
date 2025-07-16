import { NextRequest, NextResponse } from "next/server";
import { executeQuery, executeTransaction } from "../../../lib/neo4j";

export async function POST(request: NextRequest) {
  try {
    console.log("Testing simple entity creation...");

    // Test 1: Simple query
    const simpleTest = await executeQuery('RETURN "Hello Neo4j" as message');
    console.log("Simple test result:", simpleTest);

    // Test 2: Create a single entity
    const createTest = await executeQuery(
      `CREATE (c:CulturalEntity {
        name: $name,
        type: $type,
        description: $description
      }) RETURN c.name as name`,
      {
        name: "Test Festival",
        type: "festival",
        description: "A test festival for debugging",
      }
    );
    console.log("Create test result:", createTest);

    // Test 3: Count entities
    const countTest = await executeQuery(
      "MATCH (c:CulturalEntity) RETURN count(c) as count"
    );
    console.log("Count test result:", countTest);

    return NextResponse.json({
      success: true,
      tests: {
        simple: simpleTest,
        create: createTest,
        count: countTest,
      },
    });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Neo4j test endpoint ready",
    usage: "POST to run tests",
  });
}
