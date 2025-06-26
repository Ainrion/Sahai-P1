import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "../../types/chat";

// Ollama API configuration
const OLLAMA_BASE_URL = "http://localhost:11434";
const MODEL_NAME = "llama3.2:3b"; // You can change this to match your exact model name

interface OllamaRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

interface RequestBody {
  message: string;
  conversation?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, conversation = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Build conversation history for context
    const messages = [
      {
        role: "system",
        content: `You are Sahai, a helpful AI assistant that can communicate in both Hindi and English. You have knowledge about Indian culture, festivals, food, and customs. You can code-switch between Hindi and English naturally based on the user's preference. Always be respectful and culturally sensitive.

Key guidelines:
- Respond in the same language as the user (Hindi or English)
- If the user mixes languages, feel free to do the same
- Provide culturally relevant examples when discussing Indian topics
- Keep responses conversational and helpful
- If asked about technical topics, provide clear explanations`,
      },
      // Add conversation history (last 10 messages for context)
      ...conversation.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      // Add current message
      {
        role: "user",
        content: message,
      },
    ];

    const ollamaRequest: OllamaRequest = {
      model: MODEL_NAME,
      messages: messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
      },
    };

    console.log("Sending request to Ollama:", {
      model: MODEL_NAME,
      messageCount: messages.length,
      userMessage: message,
    });

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ollamaRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama API error:", response.status, errorText);

      let errorMessage = "Failed to get response from Ollama";
      if (response.status === 404) {
        errorMessage = `Model "${MODEL_NAME}" not found. Please pull the model using: ollama pull ${MODEL_NAME}`;
      } else if (response.status === 503) {
        errorMessage =
          "Ollama service is unavailable. Please make sure Ollama is running.";
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.message || !data.message.content) {
      console.error("Invalid response from Ollama:", data);
      return NextResponse.json(
        { error: "Invalid response from Ollama" },
        { status: 500 }
      );
    }

    console.log("Ollama response received:", {
      model: data.model,
      done: data.done,
      responseLength: data.message.content.length,
    });

    return NextResponse.json({
      message: data.message.content,
      model: data.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check if it's a connection error
    if (
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("fetch")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot connect to Ollama. Please make sure Ollama is running on localhost:11434",
          details: errorMessage,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
