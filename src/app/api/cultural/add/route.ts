import { NextRequest, NextResponse } from "next/server";
import { addCulturalKnowledge } from "../../../lib/weaviate";

export async function POST(request: NextRequest) {
  try {
    const knowledge = await request.json();

    // Validate required fields
    if (
      !knowledge.title ||
      !knowledge.content ||
      !knowledge.category ||
      !knowledge.language ||
      !knowledge.tags ||
      !knowledge.source
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, content, category, language, tags, source",
        },
        { status: 400 }
      );
    }

    // Add cultural knowledge to Weaviate
    const result = await addCulturalKnowledge(knowledge);

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to add cultural knowledge: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Cultural knowledge added successfully",
    });
  } catch (error) {
    console.error("Cultural knowledge addition error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return guidelines for adding cultural knowledge
    return NextResponse.json({
      endpoint: "/api/cultural/add",
      method: "POST",
      description: "Add cultural knowledge to the database",
      requiredFields: {
        title: "string - Title of the cultural knowledge",
        content: "string - Detailed content/description",
        category: "string - Category (festival, food, custom, etc.)",
        language: "string - Language (Hindi, English, both)",
        source: "string - Source of the information",
      },
      optionalFields: {
        region: "string - Region associated with the knowledge",
        tags: "string[] - Array of tags for categorization",
      },
      supportedCategories: [
        "festival",
        "food",
        "custom",
        "tradition",
        "language",
        "mythology",
        "art",
        "dance",
        "music",
        "other",
      ],
      supportedLanguages: ["Hindi", "English", "both"],
      example: {
        title: "Diwali - Festival of Lights",
        content: "Diwali is one of the most important festivals...",
        category: "festival",
        region: "Pan-India",
        language: "English",
        tags: ["diwali", "lights", "festival", "hindu"],
        source: "Traditional Hindu Calendar",
      },
    });
  } catch (error) {
    console.error("Cultural add GET error:", error);
    return NextResponse.json(
      { error: "Failed to get cultural knowledge guidelines" },
      { status: 500 }
    );
  }
}
