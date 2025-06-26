import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if Ollama is running by hitting its API endpoint
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Ollama is not running" },
        { status: 503 }
      );
    }

    const models = await response.json();

    // Check if Llama 3.2 3B model is available
    const hasLlama3_2 = models.models?.some(
      (model: any) =>
        model.name.includes("llama3.2:3b") ||
        model.name.includes("llama3.2") ||
        model.name.includes("llama3")
    );

    return NextResponse.json({
      status: "connected",
      ollama_running: true,
      models_available: models.models?.length || 0,
      llama3_2_available: hasLlama3_2,
      models: models.models?.map((m: any) => m.name) || [],
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        error: "Cannot connect to Ollama",
        message: "Make sure Ollama is running on localhost:11434",
      },
      { status: 503 }
    );
  }
}
