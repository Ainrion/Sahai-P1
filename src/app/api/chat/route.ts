import { NextRequest, NextResponse } from "next/server";
import { ChatMessage, StreamingChatResponse } from "../../types/chat";
import { searchCulturalKnowledge, searchDocuments } from "../../lib/weaviate";
import { RAGChatResponse } from "../../types/vector";
import { graphRAGQuery, hybridSearch } from "../../lib/graphrag";
import { checkNeo4jConnection } from "../../lib/neo4j";
import { GraphRAGResponse, HybridSearchResult } from "../../types/graph";

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

    // Perform enhanced GraphRAG search for relevant context
    let ragContext = "";
    let graphRagContext = "";
    let sources: Array<{
      title: string;
      category: string;
      content: string;
      relevance: number;
      source: "vector" | "graph" | "document" | "hybrid";
    }> = [];
    let isGraphRAGEnabled = false;

    try {
      // Check if Neo4j is available for GraphRAG
      const neo4jStatus = await checkNeo4jConnection();
      isGraphRAGEnabled = neo4jStatus.connected;

      if (isGraphRAGEnabled) {
        console.log("Using enhanced GraphRAG with hybrid search");

        // Use GraphRAG for enhanced cultural understanding
        const graphRAGResult: GraphRAGResponse = await graphRAGQuery(message, {
          includeVector: true,
          maxDepth: 2,
          generateReasoning: true,
        });

        if (graphRAGResult.success) {
          // Build GraphRAG context
          graphRagContext = `\n\nGraphRAG Enhanced Context:\n`;
          graphRagContext += `Answer: ${graphRAGResult.answer}\n`;

          if (graphRAGResult.context.insights.length > 0) {
            graphRagContext += `\nCultural Insights:\n`;
            graphRAGResult.context.insights.forEach((insight, index) => {
              graphRagContext += `- ${insight}\n`;
            });
          }

          if (graphRAGResult.reasoning.length > 0) {
            graphRagContext += `\nReasoning Process:\n`;
            graphRAGResult.reasoning.forEach((step, index) => {
              graphRagContext += `${index + 1}. ${step}\n`;
            });
          }

          // Add graph sources
          graphRAGResult.sources.forEach((source, index) => {
            source.nodes.forEach((node, nodeIndex) => {
              if (node.properties?.name) {
                sources.push({
                  title: node.properties.name,
                  category: node.properties.type || source.type,
                  content:
                    node.properties.description ||
                    node.properties.significance ||
                    "Cultural entity",
                  relevance: source.relevance,
                  source: source.type,
                });
              }
            });
          });

          ragContext = graphRagContext;
        } else {
          console.warn(
            "GraphRAG failed, falling back to vector search:",
            graphRAGResult.error
          );
          isGraphRAGEnabled = false;
        }
      }

      // Fallback to vector search if GraphRAG is not available or failed
      if (!isGraphRAGEnabled) {
        console.log("Using traditional vector RAG search");

        // Search cultural knowledge and documents for context
        const [culturalResults, documentResults] = await Promise.all([
          searchCulturalKnowledge(message, undefined, 3),
          searchDocuments(message, 2),
        ]);

        // Process cultural knowledge results
        if (culturalResults.success && culturalResults.data.length > 0) {
          culturalResults.data.forEach((item: any, index: number) => {
            ragContext += `\n\nCultural Knowledge ${index + 1}:\nTitle: ${
              item.title
            }\nCategory: ${item.category}\nContent: ${item.content}\nRegion: ${
              item.region || "General"
            }\n`;
            sources.push({
              title: item.title,
              category: item.category,
              content: item.content.substring(0, 200) + "...",
              relevance: 0.9 - index * 0.1,
              source: "vector",
            });
          });
        }

        // Process document results
        if (documentResults.success && documentResults.data.length > 0) {
          documentResults.data.forEach((item: any, index: number) => {
            ragContext += `\n\nDocument ${index + 1}:\nFile: ${
              item.fileName
            }\nContent: ${item.content.substring(0, 500)}\n`;
            sources.push({
              title: item.fileName,
              category: "document",
              content: item.content.substring(0, 200) + "...",
              relevance: 0.8 - index * 0.1,
              source: "document",
            });
          });
        }
      }
    } catch (ragError) {
      console.error("Enhanced RAG search error:", ragError);
      isGraphRAGEnabled = false;
      // Continue without RAG context if search fails
    }

    // Build conversation history for context
    const systemPrompt = `You are Sahai, a helpful AI assistant that can communicate in both Hindi and English. You have knowledge about Indian culture, festivals, food, and customs. You can code-switch between Hindi and English naturally based on the user's preference. Always be respectful and culturally sensitive.

Key guidelines:
- Respond in the same language as the user (Hindi or English)
- If the user mixes languages, feel free to do the same
- Provide culturally relevant examples when discussing Indian topics
- Keep responses conversational and helpful
- If asked about technical topics, provide clear explanations
- Use the provided context to enhance your responses when relevant

${ragContext ? `\n\nRelevant Context from Knowledge Base:\n${ragContext}` : ""}

${
  isGraphRAGEnabled
    ? `\n\n🧠 Enhanced with GraphRAG: I'm using advanced graph reasoning to understand cultural relationships and connections. This allows me to provide deeper insights about how different cultural elements are interconnected.`
    : `\n\n📚 Using Vector Search: I'm accessing my knowledge base through semantic search to provide relevant cultural information.`
}

Instructions for using context:
- Use the context to provide more accurate and detailed information
- Always acknowledge when information comes from the knowledge base${
      isGraphRAGEnabled ? " or graph analysis" : ""
    }
- If the context is relevant, integrate it naturally into your response
- If the context is not relevant to the user's question, you can ignore it
- Maintain your conversational and helpful tone while being informative${
      isGraphRAGEnabled
        ? "\n- Leverage relationship insights to explain cultural connections and influences"
        : ""
    }`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
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
      stream: true, // Enable streaming
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
      },
    };

    console.log("Sending streaming request to Ollama:", {
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

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          const errorResponse: StreamingChatResponse = {
            type: "error",
            error: "No response stream available",
          };
          controller.enqueue(`data: ${JSON.stringify(errorResponse)}\n\n`);
          controller.close();
          return;
        }

        try {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Send completion message with sources
              const completionResponse: StreamingChatResponse = {
                type: "done",
                sources: sources,
                ragEnabled: ragContext.length > 0,
                graphRAGEnabled: isGraphRAGEnabled,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(
                `data: ${JSON.stringify(completionResponse)}\n\n`
              );
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line);

                  if (data.message && data.message.content) {
                    const chunkResponse: StreamingChatResponse = {
                      type: "chunk",
                      content: data.message.content,
                      model: data.model,
                    };
                    controller.enqueue(
                      `data: ${JSON.stringify(chunkResponse)}\n\n`
                    );
                  }

                  if (data.done) {
                    const completionResponse: StreamingChatResponse = {
                      type: "done",
                      sources: sources,
                      ragEnabled: ragContext.length > 0,
                      graphRAGEnabled: isGraphRAGEnabled,
                      timestamp: new Date().toISOString(),
                    };
                    controller.enqueue(
                      `data: ${JSON.stringify(completionResponse)}\n\n`
                    );
                    controller.close();
                    return;
                  }
                } catch (parseError) {
                  console.error(
                    "Error parsing streaming response:",
                    parseError
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          const errorResponse: StreamingChatResponse = {
            type: "error",
            error:
              error instanceof Error
                ? error.message
                : "Unknown streaming error",
          };
          controller.enqueue(`data: ${JSON.stringify(errorResponse)}\n\n`);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
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
