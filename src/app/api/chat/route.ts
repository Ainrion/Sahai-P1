import { NextRequest, NextResponse } from "next/server";
import {
  ChatMessage,
  StreamingChatResponse,
  FileAttachment,
} from "../../types/chat";
import {
  aiProviderService,
  AIProvider,
  PROVIDER_CONFIGS,
} from "../../lib/aiProviders";

interface RequestBody {
  message: string;
  conversation?: ChatMessage[];
  provider?: AIProvider;
  attachments?: FileAttachment[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      message,
      conversation = [],
      provider = "groq",
      attachments = [],
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Check if the requested provider is available
    if (!aiProviderService.isProviderAvailable(provider)) {
      const availableProviders = aiProviderService.getAvailableProviders();
      return NextResponse.json(
        {
          error: `Provider '${provider}' is not available. Available providers: ${availableProviders.join(
            ", "
          )}`,
          availableProviders,
        },
        { status: 400 }
      );
    }

    // Enhanced system prompt with file analysis capabilities
    let systemPrompt = `You are Sahai, an AI assistant specialized in providing information about Indian culture, traditions, festivals, food, history, and customs. You are knowledgeable, respectful, and passionate about sharing the rich heritage of India.

Key guidelines:
- Provide accurate, culturally sensitive information about Indian traditions and customs
- Be respectful of all religious and cultural practices
- Share interesting facts and stories when relevant
- If you're not certain about specific cultural details, acknowledge this
- Encourage cultural appreciation and understanding
- Use a warm, friendly, and informative tone

Please provide helpful information about Indian culture and traditions based on your knowledge.`;

    // Add file analysis context if attachments are present
    if (attachments && attachments.length > 0) {
      const fileContext = attachments
        .map((file) => {
          if (file.type.startsWith("image/")) {
            return `Image: ${file.name} - Please analyze this image and provide relevant cultural insights if applicable.`;
          } else if (file.type === "application/pdf" && file.content) {
            return `PDF Document: ${
              file.name
            }\nExtracted Text: ${file.content.substring(0, 2000)}...`;
          }
          return `File: ${file.name} (${file.type})`;
        })
        .join("\n\n");

      systemPrompt += `\n\nThe user has attached the following files:\n${fileContext}\n\nPlease analyze these files and provide relevant information or insights based on their content.`;
    }

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      // Add conversation history (last 10 messages for context)
      ...conversation.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      // Add current message
      {
        role: "user" as const,
        content: message,
      },
    ];

    const providerConfig = PROVIDER_CONFIGS[provider];
    console.log("Sending streaming request:", {
      provider: providerConfig.name,
      model: providerConfig.model,
      messageCount: messages.length,
      userMessage: message,
    });

    try {
      // Create a streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of aiProviderService.streamChat(
              provider,
              messages
            )) {
              if (chunk.content) {
                const streamData: StreamingChatResponse = {
                  content: chunk.content,
                  done: false,
                  sources: [], // No RAG sources in simplified version
                  model: `${providerConfig.name} (${providerConfig.model})`,
                };

                const encoder = new TextEncoder();
                const data = encoder.encode(
                  `data: ${JSON.stringify(streamData)}\n\n`
                );
                controller.enqueue(data);
              }

              if (chunk.done) {
                // Send completion signal
                const doneData: StreamingChatResponse = {
                  content: "",
                  done: true,
                  sources: [],
                  model: `${providerConfig.name} (${providerConfig.model})`,
                };

                const encoder = new TextEncoder();
                const data = encoder.encode(
                  `data: ${JSON.stringify(doneData)}\n\n`
                );
                controller.enqueue(data);
                controller.close();
                break;
              }
            }
          } catch (error) {
            console.error("Streaming error:", error);
            controller.error(error);
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
    } catch (providerError: unknown) {
      console.error(`${providerConfig.name} API error:`, providerError);

      let errorMessage = `Failed to get response from ${providerConfig.name}`;
      let statusCode = 500;

      if (
        providerError &&
        typeof providerError === "object" &&
        "status" in providerError
      ) {
        const error = providerError as { status: number };
        statusCode = error.status || 500;

        if (error.status === 401) {
          errorMessage = `Invalid ${providerConfig.name} API key. Please check your API key configuration.`;
        } else if (error.status === 429) {
          errorMessage = `Rate limit exceeded for ${providerConfig.name}. Please try a different model or try again later.`;
        } else if (error.status === 500) {
          errorMessage = `${providerConfig.name} API is currently unavailable. Please try a different model.`;
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          provider: providerConfig.name,
          availableProviders: aiProviderService.getAvailableProviders(),
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
